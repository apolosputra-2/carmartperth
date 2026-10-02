import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json();

    console.log("Sending SMS through Twilio");
    console.log("To:", to);

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    });

    console.log("Twilio SID:", result.sid);
    console.log("Twilio status:", result.status);

    return NextResponse.json({
      success: true,
      sid: result.sid,
      status: result.status,
    });
  } catch (error) {
    console.error("Twilio SMS error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send SMS",
      },
      { status: 500 }
    );
  }
}