
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

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
        { error: "You cannot assign staff." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    let targetStaffId = user.id;
    let targetStaffName = user.name;

    // Only Boss can choose another staff member.
    if (user.role === "BOSS") {
      const body = await request.json().catch(() => null);

      const staffId =
        typeof body?.staffId === "string"
          ? body.staffId.trim()
          : "";

      if (!staffId) {
        return NextResponse.json(
          { error: "Select a staff member." },
          { status: 400 }
        );
      }

      const staff = await prisma.portalUser.findFirst({
        where: {
          id: staffId,
          role: "STAFF",
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!staff) {
        return NextResponse.json(
          { error: "Staff account not found or inactive." },
          { status: 400 }
        );
      }

      targetStaffId = staff.id;
      targetStaffName = staff.name;
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const application =
          await tx.financeApplication.findFirst({
            where: {
              id,
              submittedAt: { not: null },
              deletionInProgress: false,
            },
            select: {
              id: true,
              assignedStaffId: true,
            },
          });

        if (!application) {
          throw new AssignmentError(
            "Submitted application not found.",
            404
          );
        }

        // Staff cannot take somebody else's assignment.
        if (
          user.role === "STAFF" &&
          application.assignedStaffId !== null
        ) {
          throw new AssignmentError(
            "This application has already been claimed.",
            409
          );
        }

    // Boss selecting the same Staff = no change.
if (application.assignedStaffId === targetStaffId) {
    const current = await tx.financeApplication.findFirst({
        where: {
          id,
          submittedAt: { not: null },
          deletionInProgress: false,
          assignedStaffId: targetStaffId,
        },
        select: { id: true },
    });

    if (!current) {
        throw new AssignmentError(
        "Assignment changed. Refresh and try again.",
        409
        );
    }

    return {
        unchanged: true,
        assignedStaffId: targetStaffId,
        assignedStaffName: targetStaffName,
    };
}

const update =
    await tx.financeApplication.updateMany({
    where: {
        id,
        submittedAt: { not: null },
        deletionInProgress: false,
        assignedStaffId:
        application.assignedStaffId,
    },
    data: {
        assignedStaffId: targetStaffId,
    },
    });

if (update.count !== 1) {
    throw new AssignmentError(
    "Assignment changed. Refresh and try again.",
    409
    );
}

// Save history in the same transaction.
await tx.staffAssignmentHistory.create({
    data: {
    applicationId: id,
    assignedById: user.id,
    staffId: targetStaffId,
    previousStaffId:
        application.assignedStaffId,
    },
});

return {
    unchanged: false,
    assignedStaffId: targetStaffId,
    assignedStaffName: targetStaffName,
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
    {
        error: "Assignment changed. Please try again.",
    },
    { status: 409 }
    );
}

logServerError({
  operation: "staff-assignment",
  error,
});

return NextResponse.json(
    { error: "Unable to save staff assignment." },
      { status: 500 }
    );
  }
}
