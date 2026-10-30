
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

const incidentTypes = new Set([
  "UNAUTHORISED_ACCESS",
  "DATA_DISCLOSURE",
  "LOST_DOCUMENT",
  "ACCOUNT_COMPROMISE",
  "MALWARE",
  "SERVICE_DISRUPTION",
  "OTHER",
]);

export async function POST(request: NextRequest) {
  try {
    const user = await getPortalUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    if (user.role !== "BOSS") {
      return NextResponse.json(
        { error: "Not authorised." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    const incidentType = body?.incidentType;
    const summary =
      typeof body?.summary === "string"
        ? body.summary.trim()
        : "";

    if (
      !incidentTypes.has(incidentType) ||
      summary.length < 10 ||
      summary.length > 2000
    ) {
      return NextResponse.json(
        { error: "Valid incident type and summary required." },
        { status: 400 }
      );
    }

    const incident = await prisma.securityIncident.create({
      data: {
        incidentType,
        summary,
        reportedById: user.id,
        status: "REPORTED",
        severity: "UNASSESSED",
      },
      select: {
        id: true,
        incidentType: true,
        status: true,
        reportedAt: true,
      },
    });

    return NextResponse.json(
      { success: true, incident },
      { status: 201 }
    );
  } catch (error) {
    logServerError({
      operation: "security-incident-create",
      error,
    });

    return NextResponse.json(
      { error: "Unable to register security incident." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getPortalUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    if (user.role !== "BOSS") {
      return NextResponse.json(
        { error: "Not authorised." },
        { status: 403 }
      );
    }

    const incidents = await prisma.securityIncident.findMany({
      orderBy: { reportedAt: "desc" },
      take: 100,
      select: {
        id: true,
        incidentType: true,
        severity: true,
        status: true,
        summary: true,
        reportedById: true,
        reportedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { incidents },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    logServerError({
      operation: "security-incident-list",
      error,
    });

    return NextResponse.json(
      { error: "Unable to load security incidents." },
      { status: 500 }
    );
  }
}
