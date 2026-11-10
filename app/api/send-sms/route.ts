
import { NextRequest, NextResponse } from "next/server";
import {
  randomUUID,
  randomBytes,
  createHash,
} from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";
import { sendSms } from "@/lib/smsSender";

export const runtime = "nodejs";

function buildFinanceApplicationSms(recipientName: string, prefillToken: string) {
  const baseUrl = process.env.APP_URL;

  if (!baseUrl) {
    throw new Error("APP_URL is not configured.");
  }

  const url = new URL(baseUrl);

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1"
  ) {
    throw new Error("APP_URL must be a public HTTPS URL.");
  }

  url.pathname = "/finance/apply";
  url.search = "";
  url.searchParams.set("prefillToken", prefillToken);
  url.hash = "";

  return (
    `Hi ${recipientName}, it's the team at Carmart Perth.\n\n` +
    "Please complete your finance application here:\n\n" +
    url.toString() +
    "\n\nIf you need assistance, please call us on (08) 9272 6814."
  );
}

type ReservationResult =
  | {
      allowed: true;
      smsId: string;
    }
  | {
      allowed: false;
      reason: string;
      status: number;
    };

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate portal user.
    const user = await getPortalUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    // 2. Only STAFF and BOSS may send SMS.
    if (user.role !== "STAFF" && user.role !== "BOSS" && user.role !== "BROKER") {
      return NextResponse.json(
        { error: "Not authorised." },
        { status: 403 }
      );
    }

    // 3. Validate request body.
    const body = await request.json().catch(() => null);

    const to =
      typeof body?.recipientPhone === "string"
        ? body.recipientPhone.trim()
        : "";

    const recipientName =
      typeof body?.recipientName === "string"
        ? body.recipientName.trim()
        : "";

    const brokerId =
      body?.brokerId === null ||
      body?.brokerId === undefined ||
      body?.brokerId === ""
        ? null
        : typeof body.brokerId === "string"
          ? body.brokerId.trim()
          : null;

    // Reject invalid broker ID types rather than treating them
    // as an intentional "No broker selected" choice.
    if (
      body?.brokerId !== null &&
      body?.brokerId !== undefined &&
      body?.brokerId !== "" &&
      (!brokerId || brokerId.length > 128)
    ) {
      return NextResponse.json(
        { error: "Invalid broker selection." },
        { status: 400 }
      );
    }

    if (
      !recipientName ||
      recipientName.length > 80 ||
      /[\r\n\x00-\x1F\x7F]/.test(recipientName)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid customer name." },
        { status: 400 }
      );
    }

    if (!/^\+[1-9]\d{7,14}$/.test(to)) {
      return NextResponse.json(
        { error: "Invalid phone number." },
        { status: 400 }
      );
    }

    // Only general finance application links are supported.
    if (
      body?.messageType !== "FINANCE_APPLICATION_LINK" ||
      body?.applicationId
    ) {
      return NextResponse.json(
        { error: "Unsupported SMS request." },
        { status: 400 }
      );
    }

    // 4. Prepare a short-lived personalized finance link.
    const prefillToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(prefillToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Validate the public URL before creating database records.
    const smsBody = buildFinanceApplicationSms(
      recipientName,
      prefillToken
    );

    let reservation: ReservationResult;

    // 5. Reserve an SMS record transactionally.
    try {
      reservation = await prisma.$transaction(
        async (tx): Promise<ReservationResult> => {
          
        // Validate the optional preselected broker.
        if (brokerId) {
          const broker = await tx.portalUser.findFirst({
            where: {
              id: brokerId,
              role: "BROKER",
              isActive: true,
            },
            select: {
              id: true,
            },
          });

          if (!broker) {
            return {
              allowed: false,
              reason: "Selected broker is no longer available.",
              status: 400,
            };
          }
        }

        // Block automatic resending if the previous
        // message has an unknown or unfinished outcome.
        const unresolved = await tx.smsMessage.findFirst({
          where: {
            recipientPhone: to,
            recipientName,
            messageType: "FINANCE_APPLICATION_LINK",
            status: {
              in: ["UNKNOWN", "SENDING", "PENDING"],
            },
          },
          select: {
            id: true,
          },
        });

        if (unresolved) {
          return {
            allowed: false,
            reason:
              "An SMS request is pending or has an uncertain outcome. Please review SMS History before sending again.",
            status: 409,
          };
        }
        
        // Store prefill details for this specific SMS link.
        await tx.financeLinkPrefill.create({
          data: {
            tokenHash,
            customerName: recipientName,
            phone: to,
            brokerId,
            expiresAt,
          },
        });

        // Create the SMS record before contacting Twilio.
        const sms = await tx.smsMessage.create({
          data: {
            recipientPhone: to,
            recipientName: recipientName,
            messageType: "FINANCE_APPLICATION_LINK",
            applicationId: null,
            idempotencyKey:
              `FINANCE_APPLICATION_LINK:${randomUUID()}`,
            requestedById: user.id,
            provider: "MOCK",
            status: "SENDING",
            attemptCount: 1,
          },
          select: {
            id: true,
          },
        });

        return {
          allowed: true,
          smsId: sms.id,
        };
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      }
    );
    } catch (error) {
      // Concurrent transactions may conflict.
      // Do not automatically retry a send request.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        return NextResponse.json(
          {
            error:
              "Another SMS request was processed at the same time. Refresh SMS History before trying again.",
          },
          { status: 409 }
        );
      }

      throw error;
    }

    // 6. Return unresolved SMS or reservation errors
    if (!reservation.allowed) {
      return NextResponse.json(
        {
          error: reservation.reason,
          duplicate: false,
        },
        {
          status: reservation.status,
        }
      );
    }

    const smsId = reservation.smsId;

    // 7. Send SMS outside the database transaction.
    try {
      const result = await sendSms({
        to,
        body: smsBody,
        smsId,
      });

      const finalStatus =
        result.provider === "MOCK"
          ? "MOCKED"
          : "SENT";

      // IMPORTANT:
      // Only update records still marked SENDING.
      // A Twilio callback may have already marked the
      // message DELIVERED or FAILED.
      const saved = await prisma.smsMessage.updateMany({
        where: {
          id: smsId,
          status: "SENDING",
        },
        data: {
          provider: result.provider,
          providerSid: result.messageSid,
          status: finalStatus,
          sentAt:
            result.provider === "TWILIO"
              ? new Date()
              : null,
        },
      });

      // If the webhook updated the record first,
      // read its latest status instead of overwriting it.
      const current =
        saved.count === 0
          ? await prisma.smsMessage.findUnique({
              where: {
                id: smsId,
              },
              select: {
                status: true,
              },
            })
          : null;

      const recordedStatus =
        current?.status ?? finalStatus;

      return NextResponse.json({
        success: true,
        duplicate: false,
        messageId: smsId,
        status: recordedStatus,
      });
    } catch (error) {
      // A provider timeout may mean Twilio accepted the SMS.
      // Never automatically resend an uncertain request.
      await prisma.smsMessage.updateMany({
        where: {
          id: smsId,
          status: "SENDING",
        },
        data: {
          status: "UNKNOWN",
          lastError:
            "SMS outcome requires investigation.",
        },
      });

      logServerError({
        operation: "sms-send",
        error,
      });

      return NextResponse.json(
        {
          error:
            "SMS outcome is uncertain. Check SMS History before retrying.",
          messageId: smsId,
        },
        {
          status: 502,
        }
      );
    }
  } catch (error) {
    logServerError({
      operation: "sms-request",
      error,
    });

    return NextResponse.json(
      {
        error: "Unable to process SMS request.",
      },
      {
        status: 500,
      }
    );
  }
}
