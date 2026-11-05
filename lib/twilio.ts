
import "server-only";
import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are missing.");
  }

  if (!client) {
    client = twilio(accountSid, authToken);
  }

  return client;
}

export function getTwilioConfig() {
  return {
    senderId: process.env.TWILIO_SENDER_ID,
    appUrl: process.env.APP_URL,
    mode: process.env.SMS_MODE ?? "mock",
    liveEnabled: process.env.ENABLE_LIVE_SMS === "true",
  };
}
