
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getPortalUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    if (
      currentUser.role !== "STAFF" &&
      currentUser.role !== "BOSS"
    ) {
      return NextResponse.json(
        { error: "You do not have permission." },
        { status: 403 }
      );
    }

    const users = await prisma.portalUser.findMany({
      where: {
        isActive: true,
        role: {
          in: ["STAFF", "BROKER"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      staff: users
        .filter((user) => user.role === "STAFF")
        .map(({ id, name, email}) => ({
          id,
          name,
          email,
        })),

      brokers: users
        .filter((user) => user.role === "BROKER")
        .map(({ id, name, email, phone }) => ({
          id,
          name,
          email,
          phone,
        })),
    });
  } catch (error) {
    console.error("Failed to load portal users:", error);

    return NextResponse.json(
      { error: "Failed to load staff and brokers." },
      { status: 500 }
    );
  }
}
