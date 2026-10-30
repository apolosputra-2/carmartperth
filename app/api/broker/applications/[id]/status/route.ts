
import { NextRequest, NextResponse } from "next/server";
import {
  FinanceApplicationStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

const allowedStatuses = new Set<FinanceApplicationStatus>([
  "SENT_TO_BROKER",
  "UNDER_REVIEW",
  "ADDITIONAL_INFO_REQUIRED",
  "SENT_TO_LENDER",
  "CONDITIONALLY_APPROVED",
  "APPROVED",
  "DECLINED",
  "SETTLED",
]);

class StatusError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export async function PATCH(
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

    if (user.role !== "BROKER") {
      return NextResponse.json(
        { error: "Only brokers can update finance statuses." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    const newStatus = body?.status;
    const note = body?.note;

    if (
        typeof newStatus !== "string" ||
        (
            newStatus !== "RECEIVED" &&
            newStatus !== "SUBMITTED" &&
            !allowedStatuses.has(
            newStatus as FinanceApplicationStatus
            )
        )
        ) {
        return NextResponse.json(
            { error: "Please select a valid finance status." },
            { status: 400 }
        );
    }

    if (note !== undefined && typeof note !== "string") {
      return NextResponse.json(
        { error: "Invalid status note." },
        { status: 400 }
      );
    }

    if (typeof note === "string" && note.length > 2000) {
      return NextResponse.json(
        { error: "Status note is too long." },
        { status: 400 }
      );
    }

    const selectedStatus =
      newStatus as FinanceApplicationStatus;

    const result = await prisma.$transaction(
      async (tx) => {
        const application =
          await tx.financeApplication.findFirst({
            where: {
              id,
              submittedAt: { not: null },
              assignedBrokerId: user.id,
            },
            select: {
              id: true,
              status: true,
            },
          });

    if (!application) {
        throw new StatusError(
            "Application not found or not assigned to you.",
            404
        );
        }

    // Prevent manually changing status to Received
    if (
        (selectedStatus === "RECEIVED"  ||
        selectedStatus === "SUBMITTED") &&
        selectedStatus !== application.status
        ) {
        throw new StatusError(
            "Received is an automatic status and cannot be selected manually.",
            400
        );
    }

    const cleanNote =
    typeof note === "string" ? note.trim() : "";

    const statusChanged =
    application.status !== selectedStatus;
            if (!statusChanged && !cleanNote) {
                throw new StatusError(
                    "Choose a new status or enter a note.",
                    400
                );
            }

        if (statusChanged) {
        const updated =
            await tx.financeApplication.updateMany({
            where: {
                id,
                submittedAt: { not: null },
                deletionInProgress: false,
                assignedBrokerId: user.id,
                status: application.status,
            },
            data: {
                status: selectedStatus,
                reviewedAt: new Date(),
            },
            });

            if (updated.count !== 1) {
                throw new StatusError(
                "Application changed. Refresh and try again.",
                409
                );
            }
        }

        if (!statusChanged) {
            const stillAssigned =
                await tx.financeApplication.findFirst({
                where: {
                    id,
                    submittedAt: { not: null },
                    deletionInProgress: false,
                    assignedBrokerId: user.id,
                    status: application.status,
                },
                select: { id: true },
                });

            if (!stillAssigned) {
                throw new StatusError(
                "Application changed. Refresh and try again.",
                409
                );
            }
        }

        const history = await tx.financeStatusHistory.create({
            data: {
                applicationId: id,
                changedById: user.id,
                previousStatus: application.status,
                newStatus: selectedStatus,
                note: cleanNote || null,
            },
        });

        return {
          previousStatus: application.status,
          status: selectedStatus,
          historyId: history.id,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof StatusError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          error: "Application changed. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    logServerError({
        operation: "finance-status-update",
        error,
    });

    return NextResponse.json(
      { error: "Unable to update finance status." },
      { status: 500 }
    );
  }
}
