
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Development-only until we add authenticated staff/boss logins.
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Authentication is not configured yet." },
      { status: 403 }
    );
  }

  try {
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
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      staff: users
        .filter((user) => user.role === "STAFF")
        .map(({ id, name }) => ({ id, name })),

      brokers: users
        .filter((user) => user.role === "BROKER")
        .map(({ id, name }) => ({ id, name })),
    });
  } catch (error) {
    console.error("Failed to load portal users:", error);

    return NextResponse.json(
      { error: "Failed to load staff and brokers." },
      { status: 500 }
    );
  }
}
