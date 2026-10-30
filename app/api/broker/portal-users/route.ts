
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

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


    return NextResponse.json(
    {
        staff: users
        .filter((user) => user.role === "STAFF")
        .map(({ id, name, email }) => ({
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
    },
    {
        headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
        },
    }
    );

    } catch (error) {
            logServerError({
                operation: "portal-users-list",
                error,
            });

    return NextResponse.json(
      { error: "Failed to load staff and brokers." },
      { status: 500 }
    );
  }
}
