
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const appUrl = process.env.APP_URL;

    if (!authToken || !accountSid || !appUrl) {
      return new NextResponse(null, { status: 503 });
    }

    const expectedUrl = new URL(
      "/api/webhooks/twilio/status",
      appUrl
    );

    if (
      expectedUrl.protocol !== "https:" ||
      expectedUrl.username ||
      expectedUrl.password
    ) {
      return new NextResponse(null, { status: 503 });
    }

    const actualUrl = new URL(request.url);

    // Permit exactly one callback query parameter.
    const smsIds = actualUrl.searchParams.getAll("smsId");

    if (
      smsIds.length !== 1 ||
      Array.from(actualUrl.searchParams.keys()).length !== 1
    ) {
      return new NextResponse(null, { status: 400 });
    }

    const smsId = smsIds[0];

    if (!/^[a-zA-Z0-9_-]{8,128}$/.test(smsId)) {
      return new NextResponse(null, { status: 400 });
    }

    expectedUrl.searchParams.set("smsId", smsId);

    // Only accept the configured callback URL.
    if (actualUrl.search !== expectedUrl.search) {
      return new NextResponse(null, { status: 400 });
    }

    const contentType =
      request.headers.get("content-type") ?? "";

    if (
      !contentType
        .toLowerCase()
        .startsWith("application/x-www-form-urlencoded")
    ) {
      return new NextResponse(null, { status: 415 });
    }

    const signature =
      request.headers.get("x-twilio-signature");

    if (!signature) {
      return new NextResponse(null, { status: 403 });
    }

    const form = await request.formData();
    const params: Record<string, string> = {};

    for (const [key, value] of form.entries()) {
      if (typeof value !== "string") {
        return new NextResponse(null, { status: 400 });
      }

      if (Object.prototype.hasOwnProperty.call(params, key)) {
        return new NextResponse(null, { status: 400 });
      }

      params[key] = value;
    }

    // IMPORTANT: Includes ?smsId=... in signature validation.
    const valid = twilio.validateRequest(
      authToken,
      signature,
      expectedUrl.toString(),
      params
    );

    if (!valid || params.AccountSid !== accountSid) {
      return new NextResponse(null, { status: 403 });
    }

    const messageSid = params.MessageSid;
    const messageStatus =
      params.MessageStatus?.toLowerCase();

    const recipientPhone = params.To;

    // Require the callback recipient to be an
    // Australian mobile number.
    if (
      !recipientPhone ||
      !/^\+614\d{8}$/.test(recipientPhone)
    ) {
      return new NextResponse(null, { status: 400 });
    }

    if (
      !messageSid ||
      !/^(SM|MM)[a-fA-F0-9]{32}$/.test(messageSid)
    ) {
      return new NextResponse(null, { status: 400 });
    }

    const now = new Date();

    const updateData =
      messageStatus === "delivered"
        ? {
            status: "DELIVERED",
            deliveredAt: now,
          }
        : messageStatus === "failed" ||
            messageStatus === "undelivered"
        ? {
            status: "FAILED",
            failedAt: now,
            lastError: params.ErrorCode
              ? `Twilio error code: ${params.ErrorCode}`
              : "Twilio reported unsuccessful delivery.",
          }
        : null;

    if (updateData) {
      await prisma.smsMessage.updateMany({
        where: {
          id: smsId,
          recipientPhone,
          messageType: "FINANCE_APPLICATION_LINK",
          status: {
            notIn: ["DELIVERED", "FAILED"],
          },
          OR: [
            {
              providerSid: messageSid,
            },
            {
              providerSid: null,
              status: {
                in: ["SENDING", "UNKNOWN"],
              },
            },
          ],
        },
        data: {
          ...updateData,
          provider: "TWILIO",
          providerSid: messageSid,
        },
      });
    }

    // Acknowledge valid callbacks, including statuses
    // that do not require a database change.
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    logServerError({
      operation: "twilio-status-webhook",
      error,
    });

    return NextResponse.json(
      { error: "Unable to process Twilio status callback." },
      { status: 500 }
    );
  }
}
