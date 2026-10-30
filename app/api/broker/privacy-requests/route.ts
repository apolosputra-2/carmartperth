
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
        { error: "Not authorised." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    const requestType = body?.requestType;
    const requesterName =
      typeof body?.requesterName === "string"
        ? body.requesterName.trim()
        : "";
    const requesterContact =
      typeof body?.requesterContact === "string"
        ? body.requesterContact.trim()
        : "";
    const applicationId =
      typeof body?.applicationId === "string"
        ? body.applicationId.trim()
        : "";

    if (
      !["ACCESS", "CORRECTION"].includes(requestType) ||
      requesterName.length < 2 ||
      requesterName.length > 150 ||
      requesterContact.length < 3 ||
      requesterContact.length > 200 ||
      applicationId.length > 200
    ) {
      return NextResponse.json(
        { error: "Invalid privacy request." },
        { status: 400 }
      );
    }

    if (applicationId) {
      const application =
        await prisma.financeApplication.findFirst({
          where: {
            id: applicationId,
            submittedAt: { not: null },
          },
          select: { id: true },
        });

      if (!application) {
        return NextResponse.json(
          { error: "Application not found." },
          { status: 404 }
        );
      }
    }

    const created = await prisma.privacyRequest.create({
      data: {
        applicationId: applicationId || null,
        requestType,
        requesterName,
        requesterContact,
        receivedById: user.id,
        identityVerified: false,
        status: "RECEIVED",
      },
      select: {
        id: true,
        requestType: true,
        status: true,
        receivedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        request: created,
      },
      { status: 201 }
    );
  } catch (error) {
    logServerError({
      operation: "privacy-request-create",
      error,
    });

    return NextResponse.json(
      { error: "Unable to register privacy request." },
      { status: 500 }
    );
  }
}
