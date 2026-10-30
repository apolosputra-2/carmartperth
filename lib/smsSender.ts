
import "server-only";

import twilio from "twilio";

type SendSmsInput = {
  to: string;
  body: string;
};

type SendSmsResult = {
  provider: "MOCK" | "TWILIO";
  messageSid: string | null;
  status: string;
};

// Mock mode is the default.
// No real SMS can be sent unless explicitly enabled.
export async function sendSms(
  input: SendSmsInput
): Promise<SendSmsResult> {
  const { to, body } = input;

  // Require international-format numbers.
  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    throw new Error(
      "Recipient must be in E.164 international format."
    );
  }

  if (!body.trim() || body.length > 1600) {
    throw new Error("Invalid SMS message length.");
  }

  const mode = process.env.SMS_MODE ?? "mock";

  if (mode !== "mock" && mode !== "live") {
    throw new Error("Invalid SMS_MODE configuration.");
  }

  if (mode === "mock") {
    // Deliberately do not log the recipient,
    // message body, or customer information.
    return {
      provider: "MOCK",
      messageSid: null,
      status: "MOCKED",
    };
  }

  if (process.env.ENABLE_LIVE_SMS !== "true") {
    throw new Error("Live SMS is not enabled.");
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Twilio credentials or sender are missing."
    );
  }

  const client = twilio(accountSid, authToken);

  const message = await client.messages.create({
    to,
    from,
    body,
  });

  return {
    provider: "TWILIO",
    messageSid: message.sid,
    status: message.status,
  };
}
