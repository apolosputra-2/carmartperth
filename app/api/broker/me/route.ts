
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const user = await prisma.portalUser.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Account inactive or not found" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    role: user.role,
  });
}
