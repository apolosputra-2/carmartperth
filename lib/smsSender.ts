
import "server-only";

import twilio from "twilio";

type SendSmsInput = {
  to: string;
  body: string;
  smsId: string;
};

type SendSmsResult = {
  provider: "MOCK" | "TWILIO";
  messageSid: string | null;
  status: string;
};

// Mock mode is the default.
// Live SMS requires explicit configuration.
export async function sendSms(
  input: SendSmsInput
): Promise<SendSmsResult> {
  const { to, body, smsId } = input;

  // 1. Validate recipient.
  // Australian mobiles only for this integration.
  if (!/^\+614\d{8}$/.test(to)) {
    throw new Error(
      "Recipient must be an Australian mobile in +614XXXXXXXX format."
    );
  }

  // 2. Validate message content.
  if (!body.trim() || body.length > 1600) {
    throw new Error("Invalid SMS message length.");
  }

  if (!smsId) {
    throw new Error("SMS record ID is required.");
  }

  // 3. Check operating mode.
  const mode = process.env.SMS_MODE ?? "mock";

  if (mode !== "mock" && mode !== "live") {
    throw new Error("Invalid SMS_MODE configuration.");
  }

  // 4. Mock mode: no SMS is sent.
  if (mode === "mock") {
    return {
      provider: "MOCK",
      messageSid: null,
      status: "MOCKED",
    };
  }

  // 5. Require explicit live SMS permission.
  if (process.env.ENABLE_LIVE_SMS !== "true") {
    throw new Error("Live SMS is not enabled.");
  }

  // 6. Load Twilio credentials.
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Approved Australian alphanumeric sender ID.
  const senderId = process.env.TWILIO_SENDER_ID;

  if (!accountSid || !authToken || !senderId) {
    throw new Error(
      "Twilio credentials or sender ID are missing."
    );
  }

  // Restrict this integration to CARMART.
  if (senderId !== "CARMART") {
    throw new Error(
      "Unexpected Twilio sender ID configuration."
    );
  }

  // 7. Validate public application URL.
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured.");
  }

  const baseUrl = new URL(appUrl);

  if (
    baseUrl.protocol !== "https:" ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.hostname === "localhost" ||
    baseUrl.hostname === "127.0.0.1"
  ) {
    throw new Error(
      "APP_URL must be a public HTTPS URL."
    );
  }

  // 8. Build Twilio delivery-status callback.
  const callbackUrl = new URL(
    "/api/webhooks/twilio/status",
    baseUrl
  );

  callbackUrl.searchParams.set("smsId", smsId);

  // 9. Create Twilio client.
  const client = twilio(accountSid, authToken);

  // 10. Send through approved CARMART sender.
  const message = await client.messages.create({
    to,
    from: senderId,
    body,
    statusCallback: callbackUrl.toString(),
  });

  // 11. Return provider response.
  // Twilio acceptance does not guarantee delivery.
  return {
    provider: "TWILIO",
    messageSid: message.sid,
    status: message.status,
  };
}
