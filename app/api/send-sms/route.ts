
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/brokerPermissions";
import { logServerError } from "@/lib/secureLogger";
import { sendSms } from "@/lib/smsSender";

export const runtime = "nodejs";

function buildFinanceApplicationSms() {
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
  url.hash = "";

  return (
    "Hi, this is Carmart Perth. " +
    "Please complete your finance application here:\n" +
    url.toString() +
    "\nIf you weren't expecting this, contact Carmart Perth."
  );
}

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

    const to =
      typeof body?.recipientPhone === "string"
        ? body.recipientPhone.trim()
        : "";

    if (!/^\+[1-9]\d{7,14}$/.test(to)) {
      return NextResponse.json(
        { error: "Invalid phone number." },
        { status: 400 }
      );
    }

    // Only the general application link is supported here.
    // Broker-specific consent needs its own secure workflow.
    if (
      body?.messageType !== "FINANCE_APPLICATION_LINK" ||
      body?.applicationId
    ) {
      return NextResponse.json(
        { error: "Unsupported SMS request." },
        { status: 400 }
      );
    }

    const smsBody = buildFinanceApplicationSms();

    const idempotencyKey =
      `FINANCE_APPLICATION_LINK:NO_APPLICATION:${to}`;

    let sms = await prisma.smsMessage.findUnique({
      where: { idempotencyKey },
    });

    if (!sms) {
      try {
        sms = await prisma.smsMessage.create({
          data: {
            recipientPhone: to,
            messageType: "FINANCE_APPLICATION_LINK",
            applicationId: null,
            idempotencyKey,
            requestedById: user.id,
            provider: "MOCK",
            status: "PENDING",
            attemptCount: 0,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          sms = await prisma.smsMessage.findUniqueOrThrow({
            where: { idempotencyKey },
          });
        } else {
          throw error;
        }
      }
    }

    // Claim exactly once. Concurrent requests cannot both
    // move a PENDING record into SENDING.
    const claimed = await prisma.smsMessage.updateMany({
      where: {
        id: sms.id,
        status: "PENDING",
      },
      data: {
        status: "SENDING",
        attemptCount: { increment: 1 },
      },
    });

    if (claimed.count !== 1) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        messageId: sms.id,
        status: sms.status,
      });
    }

    try {
      const result = await sendSms({
        to,
        body: smsBody,
      });

      const finalStatus =
        result.provider === "MOCK"
          ? "MOCKED"
          : "SENT";

      await prisma.smsMessage.update({
        where: { id: sms.id },
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

      return NextResponse.json({
        success: true,
        duplicate: false,
        messageId: sms.id,
        status: finalStatus,
      });
    } catch (error) {
      // A provider timeout may mean Twilio accepted the SMS.
      // Never blindly resend an uncertain attempt.
      await prisma.smsMessage.updateMany({
        where: {
          id: sms.id,
          status: "SENDING",
        },
        data: {
          status: "UNKNOWN",
          lastError: "SMS outcome requires investigation.",
        },
      });

      logServerError({
        operation: "sms-send",
        error,
      });

      return NextResponse.json(
        {
          error:
            "SMS outcome is uncertain. Do not retry automatically.",
          messageId: sms.id,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    logServerError({
      operation: "sms-request",
      error,
    });

    return NextResponse.json(
      { error: "Unable to process SMS request." },
      { status: 500 }
    );
  }
}
