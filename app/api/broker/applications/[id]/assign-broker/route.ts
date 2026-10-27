
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";

export const runtime = "nodejs";

class AssignmentError extends Error {
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

    if (user.role !== "STAFF" && user.role !== "BOSS") {
      return NextResponse.json(
        { error: "You cannot assign brokers." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    const brokerId =
      typeof body?.brokerId === "string"
        ? body.brokerId.trim()
        : "";

    if (!brokerId) {
      return NextResponse.json(
        { error: "Please choose a broker." },
        { status: 400 }
      );
    }

    const broker = await prisma.portalUser.findFirst({
      where: {
        id: brokerId,
        role: "BROKER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Broker account not found or inactive." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const application =
        await tx.financeApplication.findFirst({
            where: {
            id,
            submittedAt: { not: null },
            },
            select: {
              id: true,
              status: true,
              assignedStaffId: true,
              assignedBrokerId: true,
            },
          });

        if (!application) {
          throw new AssignmentError(
            "Application not found or you do not have permission.",
            404
          );
        }

        // No database changes if already assigned to the selected broker.
        if (application.assignedBrokerId === broker.id) {
        const current = await tx.financeApplication.findFirst({
            where: {
            id,
            submittedAt: { not: null },
            assignedBrokerId: broker.id,
            status: application.status,
            },
            select: { id: true },
        });

        if (!current) {
            throw new AssignmentError(
            "Application changed. Refresh and try again.",
            409
            );
        }

        return {
            assignedBrokerId: broker.id,
            assignedBrokerName: broker.name,
            status: application.status,
            unchanged: true,
        };
        }

        // Only advance an application that has not entered an active finance-processing stage.
        const nextStatus =
          application.status === "RECEIVED" ||
          application.status === "SUBMITTED"
            ? "SENT_TO_BROKER"
            : application.status;

        const update =
            await tx.financeApplication.updateMany({
                where: {
                id,
                submittedAt: { not: null },
                status: application.status,
                assignedBrokerId: application.assignedBrokerId,
                },
            data: {
              assignedBrokerId: broker.id,
              status: nextStatus,
            },
          });

        if (update.count !== 1) {
          throw new AssignmentError(
            "Application changed. Refresh and try again.",
            409
          );
        }

        await tx.brokerAssignmentHistory.create({
          data: {
            applicationId: id,
            assignedById: user.id,
            brokerId: broker.id,
            previousBrokerId: application.assignedBrokerId,
            previousStatus: application.status,
            newStatus: nextStatus,
          },
        });

        return {
          assignedBrokerId: broker.id,
          assignedBrokerName: broker.name,
          status: nextStatus,
          unchanged: false,
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
    if (error instanceof AssignmentError) {
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
        { error: "Application changed. Please try again." },
        { status: 409 }
      );
    }

    console.error("Broker assignment error:", error);

    return NextResponse.json(
      { error: "Unable to save broker assignment." },
      { status: 500 }
    );
  }
}

