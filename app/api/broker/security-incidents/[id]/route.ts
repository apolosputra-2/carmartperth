
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

const allowedTransitions: Record<string, string[]> = {
  REPORTED: ["INVESTIGATING"],
  INVESTIGATING: ["CONTAINED"],
  CONTAINED: ["NOTIFICATION_REVIEW"],
  NOTIFICATION_REVIEW: ["RECOVERING"],
  RECOVERING: ["CLOSED"],
};

function appendNote(
  previous: string | null,
  entry: string
) {
  return previous ? `${previous}\n\n${entry}` : entry;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    const action = body.action ?? "CHANGE_STATUS";
    const status = body.status;
    const note =
      typeof body.note === "string"
        ? body.note.trim()
        : "";

    if (note.length < 10 || note.length > 2000) {
      return NextResponse.json(
        {
          error:
            "A note between 10 and 2000 characters is required.",
        },
        { status: 400 }
      );
    }

    if (
      action !== "CHANGE_STATUS" &&
      action !== "RECORD_NOTIFICATION"
    ) {
      return NextResponse.json(
        { error: "Invalid incident action." },
        { status: 400 }
      );
    }

    const current = await prisma.securityIncident.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json(
        { error: "Incident not found." },
        { status: 404 }
      );
    }

    if (current.status === "CLOSED") {
      return NextResponse.json(
        { error: "Incident already closed." },
        { status: 409 }
      );
    }

    const now = new Date();

    const entry =
      `[${now.toISOString()}] ` +
      `${user.id} (${user.role}) — ` +
      `${action}: ${note}`;

    const data: Record<string, unknown> = {
      investigationNotes: appendNote(
        current.investigationNotes,
        entry
      ),
    };

    if (action === "RECORD_NOTIFICATION") {
      if (current.status !== "NOTIFICATION_REVIEW") {
        return NextResponse.json(
          {
            error:
              "Notification decisions can only be recorded during notification review.",
          },
          { status: 409 }
        );
      }

      if (typeof body.notificationRequired !== "boolean") {
        return NextResponse.json(
          {
            error:
              "An explicit notification decision is required.",
          },
          { status: 400 }
        );
      }

      if (
        body.oaicNotified !== undefined &&
        typeof body.oaicNotified !== "boolean"
      ) {
        return NextResponse.json(
          { error: "Invalid OAIC notification confirmation." },
          { status: 400 }
        );
      }

      if (
        body.customersNotified !== undefined &&
        typeof body.customersNotified !== "boolean"
      ) {
        return NextResponse.json(
          { error: "Invalid customer notification confirmation." },
          { status: 400 }
        );
      }

      if (
        !body.notificationRequired &&
        (body.oaicNotified === true ||
          body.customersNotified === true)
      ) {
        return NextResponse.json(
          {
            error:
              "Notification confirmations conflict with the decision.",
          },
          { status: 400 }
        );
      }

      // Do not silently reverse a previously recorded decision.
      // A changed decision requires a separate audited procedure.
      if (
        current.notificationRequired !== null &&
        current.notificationRequired !== body.notificationRequired
      ) {
        return NextResponse.json(
          {
            error:
              "Notification decision already recorded. Escalate changes for review.",
          },
          { status: 409 }
        );
      }

      data.notificationRequired =
        body.notificationRequired;

      data.notificationDecisionAt =
        current.notificationDecisionAt ?? now;

      data.notificationNotes = appendNote(
        current.notificationNotes,
        entry
      );

      // These flags record an authorised user's confirmation
      // that notification happened. They do not send anything.
      if (
        body.notificationRequired &&
        body.oaicNotified === true &&
        !current.oaicNotifiedAt
      ) {
        data.oaicNotifiedAt = now;
      }

      if (
        body.notificationRequired &&
        body.customersNotified === true &&
        !current.customersNotifiedAt
      ) {
        data.customersNotifiedAt = now;
      }
    } else {
      if (
        typeof status !== "string" ||
        !allowedTransitions[current.status]?.includes(status)
      ) {
        return NextResponse.json(
          { error: "Invalid incident status transition." },
          { status: 409 }
        );
      }

      data.status = status;

      if (status === "CONTAINED") {
        if (body.containmentConfirmed !== true) {
          return NextResponse.json(
            {
              error:
                "Confirm actual containment before recording it.",
            },
            { status: 400 }
          );
        }

        data.containedAt = now;
        data.containmentNotes = appendNote(
          current.containmentNotes,
          entry
        );
      }

      if (status === "RECOVERING") {
        if (current.notificationRequired === null) {
          return NextResponse.json(
            {
              error:
                "Record the notification decision first.",
            },
            { status: 409 }
          );
        }

        data.recoveryNotes = appendNote(
          current.recoveryNotes,
          entry
        );
      }

      if (status === "CLOSED") {
        if (body.recoveryConfirmed !== true) {
          return NextResponse.json(
            {
              error:
                "Recovery must be confirmed before closure.",
            },
            { status: 400 }
          );
        }

        if (!current.containedAt) {
          return NextResponse.json(
            {
              error: "Containment has not been recorded.",
            },
            { status: 409 }
          );
        }

        if (current.notificationRequired === null) {
          return NextResponse.json(
            {
              error:
                "Notification assessment is incomplete.",
            },
            { status: 409 }
          );
        }

        data.recoveredAt = now;
        data.recoveryNotes = appendNote(
          current.recoveryNotes,
          entry
        );
        data.closedAt = now;
        data.postIncidentReview = appendNote(
          current.postIncidentReview,
          entry
        );
      }
    }

    const result = await prisma.securityIncident.updateMany({
      where: {
        id,
        status: current.status,
        updatedAt: current.updatedAt,
      },
      data,
    });

    if (result.count !== 1) {
      return NextResponse.json(
        {
          error:
            "Incident changed. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      status:
        action === "CHANGE_STATUS"
          ? status
          : current.status,
    });
  } catch (error) {
    logServerError({
      operation: "security-incident-update",
      error,
    });

    return NextResponse.json(
      { error: "Unable to update security incident." },
      { status: 500 }
    );
  }
}
