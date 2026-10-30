
import { NextResponse } from "next/server";
import { lstat, unlink } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";
import { quarantineFinanceDocument } from "@/lib/financeDocumentQuarantine";

export const runtime = "nodejs";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const quarantineRoot = path.resolve(
  process.cwd(),
  "private-document-quarantine"
);

class DeletionError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

async function deleteQuarantinedFile(key: string) {
  if (!UUID.test(key)) {
    throw new Error("Invalid storage key.");
  }

  const filePath = path.join(quarantineRoot, key);

  try {
    const stats = await lstat(filePath);

    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new Error("Unsafe quarantine file.");
    }

    await unlink(filePath);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      // Only used after the database deletion committed.
      // A previous cleanup attempt may have removed the file.
      return;
    }
    throw error;
  }
}

export async function POST(
  _request: Request,
  context: {
    params: Promise<{ requestId: string }>;
  }
) {
  try {
    const user = await getPortalUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    if (user.role !== "BOSS") {
      return NextResponse.json(
        { error: "Not authorised." },
        { status: 403 }
      );
    }

    // Destructive execution stays off by default.
    if (
      process.env.ENABLE_FINANCE_DELETION !== "true"
    ) {
      return NextResponse.json(
        { error: "Deletion execution is disabled." },
        { status: 503 }
      );
    }

    const { requestId } = await context.params;
    const now = new Date();

    const audit = await prisma.financeDeletionAudit.findUnique({
      where: { id: requestId },
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Deletion request not found." },
        { status: 404 }
      );
    }

    if (
      audit.requestedById === user.id ||
      audit.approvedById === user.id
    ) {
      return NextResponse.json(
        { error: "A separate BOSS must execute deletion." },
        { status: 403 }
      );
    }

    if (
      audit.status !== "APPROVED" &&
      audit.status !== "EXECUTING" &&
      audit.status !== "DB_DELETED"
    ) {
      return NextResponse.json(
        { error: "Request is not executable." },
        { status: 409 }
      );
    }

    if (
      !audit.approvedById ||
      !audit.retentionVerifiedAt ||
      !audit.approvalExpiresAt ||
      (!["DB_DELETED"].includes(audit.status) &&
        audit.approvalExpiresAt <= now)
    ) {
      return NextResponse.json(
        { error: "Approval is invalid or expired." },
        { status: 409 }
      );
    }

    // Phase 1: claim the application for deletion.
    if (audit.status === "APPROVED") {
      const claimed = await prisma.$transaction(
        async (tx) => {
          const current =
            await tx.financeDeletionAudit.findUnique({
              where: { id: requestId },
            });

          if (current?.status !== "APPROVED") {
            return false;
          }

          const application =
            await tx.financeApplication.findFirst({
              where: {
                id: audit.applicationId,
                submittedAt: { not: null },
                legalHold: false,
                deletionInProgress: false,
                retentionReviewAt: {
                  lte: now,
                },
              },
              select: { id: true },
            });

          if (!application) {
            return false;
          }

          const lock =
            await tx.financeApplication.updateMany({
              where: {
                id: audit.applicationId,
                legalHold: false,
                deletionInProgress: false,
                retentionReviewAt: {
                  lte: now,
                },
              },
              data: {
                deletionInProgress: true,
              },
            });

          if (lock.count !== 1) {
            return false;
          }

          const updated =
            await tx.financeDeletionAudit.updateMany({
              where: {
                id: requestId,
                status: "APPROVED",
              },
              data: {
                status: "EXECUTING",
                executionStartedAt: now,
              },
            });

          if (updated.count !== 1) {
            throw new Error("Deletion claim changed.");
          }

          const documents =
            await tx.financeDocument.findMany({
              where: {
                applicationId: audit.applicationId,
              },
              select: {
                id: true,
                storageKey: true,
              },
            });

          await tx.financeDeletionDocument.createMany({
            data: documents.map((document) => ({
              deletionAuditId: requestId,
              documentId: document.id,
              storageKey: document.storageKey,
              status: "PENDING",
            })),
            skipDuplicates: true,
          });

          await tx.financeDeletionAudit.update({
            where: { id: requestId },
            data: {
              documentCount: documents.length,
            },
          });

          return true;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      if (!claimed) {
        return NextResponse.json(
          {
            error:
              "Deletion blocked by retention, legal hold, or concurrent operation.",
          },
          { status: 409 }
        );
      }
    }

    const latest = await prisma.financeDeletionAudit.findUniqueOrThrow({
      where: { id: requestId },
    });

    // Phase 2: quarantine documents.
    if (latest.status === "EXECUTING") {
      const application =
        await prisma.financeApplication.findUnique({
          where: { id: audit.applicationId },
          select: {
            legalHold: true,
            deletionInProgress: true,
            retentionReviewAt: true,
          },
        });

      if (
        !application ||
        application.legalHold ||
        !application.deletionInProgress ||
        !application.retentionReviewAt ||
        application.retentionReviewAt > new Date()
      ) {
        throw new DeletionError(
          "Deletion stopped: application protection changed.",
          409
        );
      }

      const documents =
        await prisma.financeDeletionDocument.findMany({
          where: { deletionAuditId: requestId },
        });

      for (const document of documents) {
        if (document.status === "QUARANTINED") {
          continue;
        }

        await quarantineFinanceDocument(
          document.storageKey
        );

        await prisma.financeDeletionDocument.update({
          where: { id: document.id },
          data: {
            status: "QUARANTINED",
            quarantinedAt: new Date(),
            lastError: null,
          },
        });
      }

      // Phase 3: remove application and dependent DB records
      // together. The deletion audit remains.
      await prisma.$transaction(
        async (tx) => {
          const current =
            await tx.financeDeletionAudit.findUnique({
              where: { id: requestId },
            });

          if (current?.status !== "EXECUTING") {
            throw new Error("Deletion state changed.");
          }

          const pending =
            await tx.financeDeletionDocument.count({
              where: {
                deletionAuditId: requestId,
                status: { not: "QUARANTINED" },
              },
            });

          if (pending !== 0) {
            throw new Error("Documents not quarantined.");
          }

          const application =
            await tx.financeApplication.findUnique({
              where: { id: audit.applicationId },
              select: {
                legalHold: true,
                deletionInProgress: true,
                retentionReviewAt: true,
              },
            });

          if (
            !application ||
            application.legalHold ||
            !application.deletionInProgress ||
            !application.retentionReviewAt ||
            application.retentionReviewAt > new Date()
          ) {
            throw new Error("Application no longer eligible.");
          }

          const filter = {
            applicationId: audit.applicationId,
          };

          await tx.documentAccessLog.deleteMany({
            where: filter,
          });

          await tx.applicationEditAuditLog.deleteMany({
            where: filter,
          });

          await tx.financeStatusHistory.deleteMany({
            where: filter,
          });

          await tx.brokerAssignmentHistory.deleteMany({
            where: filter,
          });

          await tx.staffAssignmentHistory.deleteMany({
            where: filter,
          });

          // FinanceDocument rows cascade with application.
          const removed =
            await tx.financeApplication.deleteMany({
              where: {
                id: audit.applicationId,
                legalHold: false,
                deletionInProgress: true,
              },
            });

          if (removed.count !== 1) {
            throw new Error("Application deletion failed.");
          }

          await tx.financeDeletionAudit.update({
            where: { id: requestId },
            data: { status: "DB_DELETED" },
          });
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    }

    // Phase 4: permanently remove quarantined files.
    // This can be retried after an interrupted cleanup.
    const remaining =
      await prisma.financeDeletionDocument.findMany({
        where: {
          deletionAuditId: requestId,
          status: { not: "DELETED" },
        },
      });

    for (const document of remaining) {
      await deleteQuarantinedFile(document.storageKey);

      await prisma.financeDeletionDocument.update({
        where: { id: document.id },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
          lastError: null,
        },
      });
    }

    await prisma.financeDeletionAudit.update({
      where: { id: requestId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        lastCleanupAttemptAt: new Date(),
        failureReason: null,
      },
    });

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
    });
  } catch (error) {
    logServerError({
      operation: "finance-deletion-execute",
      error,
    });

    return NextResponse.json(
      {
        error:
          "Deletion did not complete. Do not start another deletion request; investigate and retry this operation.",
      },
      { status: 500 }
    );
  }
}
