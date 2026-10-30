
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/secureLogger";
import { getPortalUser } from "@/lib/brokerPermissions";


export async function GET() {
  const user = await getPortalUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  if (user.role !== "STAFF" && user.role !== "BOSS") {
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }

  try {
    const salespeople = await prisma.salesperson.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(salespeople);
  } catch (error) {
        logServerError({
            operation: "salespeople-fetch",
            error,
        });

    return NextResponse.json(
      { error: "Unable to load salespeople" },
      { status: 500 }
    );
  }
}
