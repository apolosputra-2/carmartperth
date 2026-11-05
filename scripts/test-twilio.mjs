
import nextEnv from "@next/env";
import twilio from "twilio";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SENDER_ID,
  SMS_MODE,
  ENABLE_LIVE_SMS,
} = process.env;

// Test number supplied as a command-line argument.
// Only use a number you own and have agreed to test.
const testNumber = process.argv[2];

// Require Australian E.164 format.
if (!/^\+614\d{8}$/.test(testNumber ?? "")) {
  console.error(
    "Provide your own Australian mobile in +614XXXXXXXX format."
  );
  process.exit(1);
}

if (
  !TWILIO_ACCOUNT_SID ||
  !TWILIO_AUTH_TOKEN ||
  !TWILIO_SENDER_ID
) {
  console.error("Missing Twilio configuration.");
  process.exit(1);
}

const appUrl = process.env.APP_URL?.replace(/\/$/, "");

if (!appUrl || !appUrl.startsWith("https://")) {
  console.error("APP_URL must be a valid HTTPS URL.");
  process.exit(1);
}

const financeUrl = `${appUrl}/finance/apply`;

const body =
  `Hi! Thanks for your interest in Carmart Perth.\n\n` +
  `You can complete your finance application using the link below:\n\n` +
  `${financeUrl}\n\n` +
  `If you need assistance, call us on (08) 9272 6814.`;

console.log("CARMART SMS SYSTEM 27");
console.log("------------------------------");
console.log("Sender:", TWILIO_SENDER_ID);
console.log("Mode:", SMS_MODE);
console.log("Recipient:", testNumber.slice(0, 5) + "****");
console.log("Message:", body);

if (
  SMS_MODE !== "live" ||
  ENABLE_LIVE_SMS !== "true"
) {
  console.log("\nMOCK MODE: No SMS was sent.");
  process.exit(0);
}

// Explicit approval required for a live test.
if (process.argv[3] !== "--send") {
  console.error(
    "\nLive SMS requires the --send argument."
  );
  process.exit(1);
}

const client = twilio(
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
);

try {
  const message = await client.messages.create({
    body,
    from: TWILIO_SENDER_ID,
    to: testNumber,
  });

  console.log("\nTwilio accepted the request.");
  console.log("Message SID:", message.sid);
  console.log("Initial status:", message.status);
} catch (error) {
  console.error(
    "\nTwilio error:",
    error.message
  );
  process.exitCode = 1;
}
