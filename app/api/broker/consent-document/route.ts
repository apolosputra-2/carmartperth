
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getPortalUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    if (!["STAFF", "BOSS", "BROKER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Not authorised." },
        { status: 403 }
      );
    }

    const brokerId =
      request.nextUrl.searchParams.get("brokerId");

    if (!brokerId || brokerId.length > 100) {
      return NextResponse.json(
        { error: "Valid broker ID required." },
        { status: 400 }
      );
    }

    if (user.role === "BROKER" && brokerId !== user.id) {
      return NextResponse.json(
        { error: "Not authorised for this broker." },
        { status: 403 }
      );
    }

    const broker = await prisma.portalUser.findFirst({
      where: {
        id: brokerId,
        role: "BROKER",
        isActive: true,
      },
      select: { id: true },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Broker not available." },
        { status: 404 }
      );
    }

    const documents = await prisma.brokerConsentDocument.findMany({
      where: {
        brokerId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        pdfUrl: true,
        version: true,
      },
      take: 2,
    });

    if (documents.length !== 1) {
      return NextResponse.json(
        {
          error:
            "Broker must have exactly one active consent document.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { document: documents[0] },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load broker consent document." },
      { status: 500 }
    );
  }
}
