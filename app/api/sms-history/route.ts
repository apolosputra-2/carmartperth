
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

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

    if (user.role !== "STAFF" && user.role !== "BOSS" && user.role !== "BROKER") {
      return NextResponse.json(
        { error: "Not authorised." },
        { status: 403 }
      );
    }

    const search = (
      request.nextUrl.searchParams.get("search") ?? ""
    ).trim();

    if (search.length > 100) {
      return NextResponse.json(
        { error: "Search term is too long." },
        { status: 400 }
      );
    }


    const messages = await prisma.smsMessage.findMany({
      where: {
        // Brokers can only see SMS requests they sent.
        ...(user.role === "BROKER"
          ? { requestedById: user.id }
          : {}),

        // Preserve phone number search.
        ...(search
          ? {
              recipientPhone: {
                contains: search,
              },
            }
          : {}),
      },
      select: {
        id: true,
        recipientPhone: true,
        recipientName: true,
        messageType: true,
        provider: true,
        status: true,
        requestedById: true,
        attemptCount: true,
        createdAt: true,
        sentAt: true,
        deliveredAt: true,
        failedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json(
      {
        messages,
        count: messages.length,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    logServerError({
      operation: "sms-history-list",
      error,
    });

    return NextResponse.json(
      { error: "Unable to load SMS history." },
      { status: 500 }
    );
  }
}
