
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
    console.error("Failed to fetch salespeople:", error);

    return NextResponse.json(
      { error: "Unable to load salespeople" },
      { status: 500 }
    );
  }
}
