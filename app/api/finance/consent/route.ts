
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        return NextResponse.json(
            { error: "Invalid consent link." },
            { status: 400 }
        );
    }

    const tokenHash = createHash("sha256")
        .update(token)
        .digest("hex");

    try {
        const consentRequest =
            await prisma.brokerConsentRequest.findUnique({
                where: { tokenHash },
                select: {
                    id: true,
                    applicationId: true,
                    brokerId: true,
                    consentDocumentId: true,
                    status: true,
                    expiresAt: true,
                },
            });

        if (
            !consentRequest ||
            consentRequest.status !== "PENDING" ||
            consentRequest.expiresAt <= new Date()
        ) {
            return NextResponse.json(
                {
                    error:
                        "This consent link is invalid or no longer available.",
                },
                { status: 410 }
            );
        }

        
        // Verify the original application still belongs
        // to the broker associated with this consent link.
        const application = await prisma.financeApplication.findFirst({
            where: {
                id: consentRequest.applicationId,
                submittedAt: {
                    not: null,
                },
                assignedBrokerId: consentRequest.brokerId,
            },
            select: {
                id: true,
            },
        });

        if (!application) {
            return NextResponse.json(
                {
                    error:
                        "This consent link is no longer available. Please contact the dealership.",
                },
                { status: 410 }
            );
        }
        
        // Retrieve the exact consent PDF linked to this request.
        const consentDocument =
            await prisma.brokerConsentDocument.findFirst({
                where: {
                    id: consentRequest.consentDocumentId,
                    brokerId: consentRequest.brokerId,
                    isActive: true,
                },
                select: {
                    id: true,
                    title: true,
                    pdfUrl: true,
                    version: true,
                },
            });

        if (!consentDocument) {
            return NextResponse.json(
                {
                    error:
                        "The privacy consent document is no longer available. Please contact the dealership.",
                },
                { status: 410 }
            );
        }
        return NextResponse.json(
            {
                status: "PENDING",
                document: consentDocument,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                    "Referrer-Policy": "no-referrer",
                },
            }
        );
    } catch (error) {
        logServerError({
            operation: "finance-consent-lookup",
            error,
        });

        return NextResponse.json(
            {
                error: "Unable to load privacy consent.",
            },
            { status: 500 }
        );
    }
}
