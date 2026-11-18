
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
        { error: "Only a BOSS can delete applications." },
        { status: 403 }
      );
    }

    const origin = request.headers.get("origin");
    const trustedOrigins = [
      "https://carmartfinance.com.au",
      "https://carmart-finance-production.up.railway.app",
    ];

    if (
      !trustedOrigins.includes(origin ?? "") &&
      !(
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/localhost:\d+$/.test(origin ?? "")
      )
    ) {
      return NextResponse.json(
        { error: "Untrusted request origin." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const now = new Date();

    const result = await prisma.$transaction(
      async (tx) => {
        const app = await tx.financeApplication.findUnique({
          where: { id },
          select: {
            id: true,
            submittedAt: true,
            legalHold: true,
            deletionInProgress: true,
            retentionReviewAt: true,
            documents: {
              select: { id: true },
              take: 1,
            },
          },
        });

        if (!app || !app.submittedAt) {
          return {
            error: "Application not found.",
            status: 404,
          };
        }

        if (
          app.legalHold ||
          app.deletionInProgress
        ) {
          return {
            error:
              "Deletion blocked: retention review is not complete, or the application is protected.",
            status: 409,
          };
        }

        // Do not orphan files on Railway.
        if (app.documents.length > 0) {
          return {
            error:
              "This application has documents. Secure document deletion must be configured first.",
            status: 409,
          };
        }

        const pending = await tx.financeDeletionAudit.count({
          where: {
            applicationId: id,
            status: {
              in: [
                "REQUESTED",
                "APPROVED",
                "EXECUTING",
                "DB_DELETED",
              ],
            },
          },
        });

        if (pending > 0) {
          return {
            error: "An existing deletion operation needs review.",
            status: 409,
          };
        }

        const filter = { applicationId: id };

        await tx.documentAccessLog.deleteMany({ where: filter });
        await tx.applicationEditAuditLog.deleteMany({ where: filter });
        await tx.financeStatusHistory.deleteMany({ where: filter });
        await tx.brokerAssignmentHistory.deleteMany({ where: filter });
        await tx.staffAssignmentHistory.deleteMany({ where: filter });

        await tx.brokerConsentRequest.deleteMany({ where: filter });
        await tx.brokerConsentToken.deleteMany({ where: filter });

        // Preserve separate privacy and SMS records,
        // but remove their link to the deleted application.
        await tx.privacyRequest.updateMany({
          where: filter,
          data: { applicationId: null },
        });

        await tx.smsMessage.updateMany({
          where: filter,
          data: { applicationId: null },
        });

        const deleted = await tx.financeApplication.deleteMany({
          where: {
            id,
            submittedAt: { not: null },
            legalHold: false,
            deletionInProgress: false,
            documents: { none: {} },
          },
        });

        if (deleted.count !== 1) {
          throw new Error("Application eligibility changed.");
        }

        // Keep an audit trail of who deleted the application.
        await tx.financeDeletionAudit.create({
          data: {
            applicationId: id,
            requestedById: user.id,
            approvedById: user.id,
            reason:
              "Direct deletion by BOSS after retention eligibility verification.",
            status: "COMPLETED",
            retentionVerifiedAt: now,
            approvedAt: now,
            completedAt: now,
            documentCount: 0,
          },
        });

        return { success: true as const };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status as 404 | 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError({
      operation: "boss-direct-application-delete",
      error,
    });

    return NextResponse.json(
      { error: "Unable to delete application safely." },
      { status: 500 }
    );
  }
}
