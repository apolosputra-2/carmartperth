
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (
    !token ||
    !/^[a-f0-9]{64}$/.test(token) ||
    request.nextUrl.searchParams.getAll("token").length !== 1 ||
    Array.from(request.nextUrl.searchParams.keys()).length !== 1
  ) {
    return NextResponse.json(
      { error: "Invalid or expired finance link." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  try {
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const prefill = await prisma.financeLinkPrefill.findUnique({
      where: {
        tokenHash,
      },
      select: {
        customerName: true,
        phone: true,
        brokerId: true,
        expiresAt: true,
      },
    });

    if (!prefill || prefill.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired finance link." },
        { status: 404, headers: noStoreHeaders }
      );
    }
    
    let brokerConsent = null;

    if (prefill.brokerId) {
    const documents = await prisma.brokerConsentDocument.findMany({
        where: {
        brokerId: prefill.brokerId,
        isActive: true,
        },
        select: {
        id: true,
        title: true,
        pdfUrl: true,
        version: true,
        },
        take: 2,
    });

    // A selected broker must have exactly one active
    // consent document before the form can proceed.
    if (documents.length !== 1) {
        return NextResponse.json(
        {
            error: "Broker consent documents are not configured correctly.",
        },
        { status: 409, headers: noStoreHeaders }
        );
    }

    brokerConsent = documents[0];
    }

    // Treat the last word as surname.
    // Customers can correct their legal name in the form.
    const nameParts = prefill.customerName.trim().split(/\s+/);

    const firstName = nameParts[0] ?? "";

    const lastName =
    nameParts.length > 1
        ? nameParts[nameParts.length - 1]
        : "";

    const middleName =
    nameParts.length > 2
        ? nameParts.slice(1, -1).join(" ")
        : "";


    // Convert Australian international mobile format to local format.
    const phone = prefill.phone.startsWith("+61")
      ? `0${prefill.phone.slice(3)}`
      : prefill.phone;

    return NextResponse.json(
      {
        firstName,
        lastName,
        middleName,
        phone,
        brokerId: prefill.brokerId ?? null,
        brokerConsent,
      },
      { status: 200, headers: noStoreHeaders }
    );
  } catch (error) {
    logServerError({
      operation: "finance-prefill",
      error,
    });

    return NextResponse.json(
      { error: "Unable to load finance prefill." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
