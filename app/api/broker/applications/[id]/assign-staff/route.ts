
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";

export const runtime = "nodejs";

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

    // STAFF: Can claim an unassigned application only.
    if (user.role === "STAFF") {
      const result = await prisma.financeApplication.updateMany({
        where: {
          id,
          submittedAt: { not: null },
          assignedStaffId: null,
        },
        data: {
          assignedStaffId: user.id,
        },
      });

      if (result.count !== 1) {
        return NextResponse.json(
          {
            error:
              "This application is unavailable or has already been claimed.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        assignedStaffId: user.id,
        assignedStaffName: user.name,
      });
    }

    // BOSS: Can assign or reassign to an active STAFF account.
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

    const result = await prisma.financeApplication.updateMany({
      where: {
        id,
        submittedAt: { not: null },
      },
      data: {
        assignedStaffId: staff.id,
      },
    });

    if (result.count !== 1) {
      return NextResponse.json(
        { error: "Submitted application not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assignedStaffId: staff.id,
      assignedStaffName: staff.name,
    });
  } catch (error) {
    console.error("Staff assignment error:", error);

    return NextResponse.json(
      { error: "Unable to save staff assignment." },
      { status: 500 }
    );
  }
}
