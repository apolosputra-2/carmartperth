
import { NextRequest, NextResponse } from "next/server";
import { getPortalUser } from "@/lib/brokerPermissions";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const user = await getPortalUser();

    if (!user) {
        return NextResponse.json(
            { error: "Please sign in." },
            { status: 401 }
        );
    }

    if (!["STAFF", "BOSS", "BROKER"].includes(user.role)) {
        return NextResponse.json(
            { error: "Not authorised." },
            { status: 403 }
        );
    }

    const applicationId =
        request.nextUrl.searchParams.get("applicationId");

    if (
        !applicationId ||
        applicationId.length > 100
    ) {
        return NextResponse.json(
            { error: "Valid application ID required." },
            { status: 400 }
        );
    }

    try {
        const application = await prisma.financeApplication.findFirst({
            where: {
                id: applicationId,
                submittedAt: { not: null },
                ...(user.role === "BROKER"
                    ? { assignedBrokerId: user.id }
                    : {}),
            },
            select: {
                id: true,
                assignedBrokerId: true,
            },
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found or access denied." },
                { status: 404 }
            );
        }

        // Only show consent for the currently assigned broker.
        const brokerId = application.assignedBrokerId;

        if (!brokerId) {
            return NextResponse.json(
                { consent: null },
                { headers: { "Cache-Control": "private, no-store" } }
            );
        }

        const consent = await prisma.brokerConsentRequest.findFirst({
            where: {
                applicationId,
                brokerId,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                brokerId: true,
                consentDocumentId: true,
                status: true,
                createdAt: true,
                completedAt: true,
                expiresAt: true,
                signatureData: true,
            },
        });

        if (!consent) {
            return NextResponse.json(
                { consent: null },
                { headers: { "Cache-Control": "private, no-store" } }
            );
        }

        const [broker, document] = await Promise.all([
            prisma.portalUser.findUnique({
                where: { id: consent.brokerId },
                select: { name: true },
            }),
            prisma.brokerConsentDocument.findFirst({
                where: {
                    id: consent.consentDocumentId,
                    brokerId: consent.brokerId,
                },
                select: {
                    title: true,
                    version: true,
                },
            }),
        ]);

        const status =
            consent.status === "PENDING" &&
            consent.expiresAt <= new Date()
                ? "EXPIRED"
                : consent.status;

        return NextResponse.json(
            {
                consent: {
                    id: consent.id,
                    status,
                    brokerName: broker?.name ?? "Unknown broker",
                    documentTitle: document?.title ?? "Privacy Consent",
                    documentVersion: document?.version ?? null,
                    requestedAt: consent.createdAt,
                    completedAt: consent.completedAt,
                    hasSignature: Boolean(consent.signatureData),
                },
            },
            {
                headers: {
                    "Cache-Control": "private, no-store",
                },
            }
        );
    } catch (error) {
        logServerError({
            operation: "broker-consent-status",
            error,
        });

        return NextResponse.json(
            { error: "Unable to load privacy consent status." },
            { status: 500 }
        );
    }
}
