
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
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

    const { requestId } = await context.params;
    const body = await request.json().catch(() => null);

    if (
      !body ||
      body.confirmRetention !== true ||
      body.confirmLegalObligations !== true
    ) {
      return NextResponse.json(
        { error: "Retention and legal obligations must be confirmed." },
        { status: 400 }
      );
    }

    const now = new Date();

    const outcome = await prisma.$transaction(async (tx) => {
      const deletion = await tx.financeDeletionAudit.findUnique({
        where: { id: requestId },
      });

      if (!deletion || deletion.status !== "REQUESTED") {
        return { error: "Request unavailable.", status: 409 };
      }

      if (deletion.requestedById === user.id) {
        return {
          error: "You cannot approve your own request.",
          status: 403,
        };
      }

      const application = await tx.financeApplication.findFirst({
        where: {
          id: deletion.applicationId,
          submittedAt: { not: null },
        },
        select: {
          legalHold: true,
          retentionReviewAt: true,
        },
      });

      if (!application) {
        return { error: "Application not found.", status: 404 };
      }

      if (application.legalHold) {
        return { error: "Legal hold prevents approval.", status: 409 };
      }

      if (
        !application.retentionReviewAt ||
        application.retentionReviewAt > now
      ) {
        return {
          error: "Application is not eligible for retention review.",
          status: 409,
        };
      }

      const updated = await tx.financeDeletionAudit.updateMany({
        where: {
          id: requestId,
          status: "REQUESTED",
          requestedById: { not: user.id },
        },
        data: {
          status: "APPROVED",
          approvedById: user.id,
          approvedAt: now,
          retentionVerifiedAt: now,
          approvalExpiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000
          ),
        },
      });

      if (updated.count !== 1) {
        return { error: "Request changed.", status: 409 };
      }

      return { approved: true };
    });

    if ("error" in outcome) {
      return NextResponse.json(
        { error: outcome.error },
        { status: outcome.status as 403 | 404 | 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Deletion approved but not executed.",
    });
  } catch (error) {
    logServerError({
      operation: "finance-deletion-approval",
      error,
    });

    return NextResponse.json(
      { error: "Unable to approve deletion." },
      { status: 500 }
    );
  }
}
