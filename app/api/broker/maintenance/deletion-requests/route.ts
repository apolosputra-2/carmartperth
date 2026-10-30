
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

    if (user.role !== "BOSS") {
      return NextResponse.json(
        { error: "Not authorised." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    const applicationId =
      typeof body?.applicationId === "string"
        ? body.applicationId.trim()
        : "";

    const reason =
      typeof body?.reason === "string"
        ? body.reason.trim()
        : "";

    if (
      !applicationId ||
      applicationId.length > 200 ||
      reason.length < 15 ||
      reason.length > 1000
    ) {
      return NextResponse.json(
        { error: "Valid application ID and reason required." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.financeApplication.findFirst({
        where: {
          id: applicationId,
          submittedAt: { not: null },
        },
        select: {
          id: true,
          legalHold: true,
        },
      });

      if (!application) {
        return { error: "Application not found.", status: 404 };
      }

      if (application.legalHold) {
        return {
          error: "Application is under legal hold.",
          status: 409,
        };
      }

      const existing = await tx.financeDeletionAudit.findFirst({
        where: {
          applicationId,
          status: {
            in: ["REQUESTED", "APPROVED", "EXECUTING"],
          },
        },
        select: { id: true },
      });

      if (existing) {
        return {
          error: "A deletion request already exists.",
          status: 409,
        };
      }

      const created = await tx.financeDeletionAudit.create({
        data: {
          applicationId,
          requestedById: user.id,
          reason,
          status: "REQUESTED",
        },
        select: {
          id: true,
          status: true,
          requestedAt: true,
        },
      });

      return { created };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status as 404 | 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        request: result.created,
      },
      { status: 201 }
    );
  } catch (error) {
    logServerError({
      operation: "finance-deletion-request",
      error,
    });

    return NextResponse.json(
      { error: "Unable to create deletion request." },
      { status: 500 }
    );
  }
}
