
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/secureLogger";

export const runtime = "nodejs";


async function saveCompletedConsent(
    requestId: string,
    signatureData: string
) {
    return prisma.$transaction(
        async (tx) => {
            const now = new Date();

            // Recheck the original consent request.
            const consent = await tx.brokerConsentRequest.findFirst({
                where: {
                    id: requestId,
                    status: "PENDING",
                    expiresAt: { gt: now },
                },
                select: {
                    id: true,
                    applicationId: true,
                    brokerId: true,
                    consentDocumentId: true,
                },
            });

            if (!consent) return false;

            // Confirm the application still belongs to this broker.
            const application = await tx.financeApplication.findFirst({
                where: {
                    id: consent.applicationId,
                    submittedAt: { not: null },
                    assignedBrokerId: consent.brokerId,
                },
                select: { id: true },
            });

            if (!application) return false;

            // Confirm the broker is still active.
            const broker = await tx.portalUser.findFirst({
                where: {
                    id: consent.brokerId,
                    role: "BROKER",
                    isActive: true,
                },
                select: { id: true },
            });

            if (!broker) return false;

            // Confirm the original PDF is still active.
            const consentDocument =
                await tx.brokerConsentDocument.findFirst({
                    where: {
                        id: consent.consentDocumentId,
                        brokerId: consent.brokerId,
                        isActive: true,
                    },
                    select: { id: true },
                });

            if (!consentDocument) return false;

            // Complete only a still-pending, unexpired request.
            const result = await tx.brokerConsentRequest.updateMany({
                where: {
                    id: consent.id,
                    status: "PENDING",
                    expiresAt: { gt: new Date() },
                },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    signatureData,
                    activeRequestKey: null,
                },
            });

            return result.count === 1;
        },
        {
            isolationLevel: "Serializable",
        }
    );
}

export async function POST(request: NextRequest) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid request body." },
            { status: 400 }
        );
    }

    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return NextResponse.json(
            { error: "Invalid request body." },
            { status: 400 }
        );
    }

    const data = body as Record<string, unknown>;

    const { token, agreed, signatureData } = data;

    // Validate the secure consent token.
    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/.test(token)
    ) {
        return NextResponse.json(
            { error: "Invalid consent link." },
            { status: 400 }
        );
    }

    // Agreement must be explicitly confirmed.
    if (agreed !== true) {
        return NextResponse.json(
            { error: "You must agree to the privacy consent." },
            { status: 400 }
        );
    }

    // Basic signature input validation.
    if (
        typeof signatureData !== "string" ||
        !signatureData.startsWith("data:image/png;base64,") ||
        signatureData.length > 500_000
    ) {
        return NextResponse.json(
            { error: "Invalid signature data." },
            { status: 400 }
        );
    }

    
    // Decode and validate the PNG signature payload.
    const base64Signature = signatureData.slice(
        "data:image/png;base64,".length
    );

    if (
        !base64Signature ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
            base64Signature
        )
    ) {
        return NextResponse.json(
            { error: "Invalid signature image encoding." },
            { status: 400 }
        );
    }

    const signatureBuffer = Buffer.from(
        base64Signature,
        "base64"
    );

    // PNG files must begin with the standard 8-byte signature.
    const pngHeader = Buffer.from([
        137, 80, 78, 71, 13, 10, 26, 10,
    ]);

    if (
        signatureBuffer.length < 45 ||
        !signatureBuffer.subarray(0, 8).equals(pngHeader)
    ) {
        return NextResponse.json(
            { error: "Signature must be a valid PNG image." },
            { status: 400 }
        );
    }

    // Verify that the first PNG chunk is IHDR.
    if (
        signatureBuffer.readUInt32BE(8) !== 13 ||
        signatureBuffer.toString("ascii", 12, 16) !== "IHDR"
    ) {
        return NextResponse.json(
            { error: "Invalid PNG structure." },
            { status: 400 }
        );
    }

    const imageWidth = signatureBuffer.readUInt32BE(16);
    const imageHeight = signatureBuffer.readUInt32BE(20);

    if (
        imageWidth < 100 ||
        imageWidth > 2000 ||
        imageHeight < 50 ||
        imageHeight > 1000
    ) {
        return NextResponse.json(
            { error: "Invalid signature image dimensions." },
            { status: 400 }
        );
    }
    
    // Fully decode the PNG and inspect its visible pixels.
    try {
        const decoded = sharp(signatureBuffer, {
            limitInputPixels: 2_000_000,
            failOn: "error",
        });

        const metadata = await decoded.metadata();

        if (
            metadata.format !== "png" ||
            metadata.width !== imageWidth ||
            metadata.height !== imageHeight
        ) {
            return NextResponse.json(
                { error: "Invalid signature image." },
                { status: 400 }
            );
        }

        // Flatten transparency onto white and inspect
        // the image as an 8-bit grayscale buffer.
        const { data: pixels } = await decoded
            .flatten({ background: "#ffffff" })
            .greyscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        let inkPixels = 0;

        for (const pixel of pixels) {
            // Dark pixels indicate visible signature strokes.
            if (pixel < 180) {
                inkPixels++;

                if (inkPixels >= 50) {
                    break;
                }
            }
        }

        if (inkPixels < 50) {
            return NextResponse.json(
                {
                    error:
                        "Signature is blank or too small. Please draw your signature.",
                },
                { status: 400 }
            );
        }
    } catch {
        return NextResponse.json(
            {
                error:
                    "Unable to decode the signature image.",
            },
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
                        "This consent link is invalid, expired, or already used.",
                },
                { status: 410 }
            );
        }

        
        // Confirm the finance application is still submitted
        // and assigned to the broker on this consent request.
        const application = await prisma.financeApplication.findFirst({
            where: {
                id: consentRequest.applicationId,
                submittedAt: { not: null },
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
                        "This consent request is no longer valid for the assigned broker. Please contact the dealership.",
                },
                { status: 410 }
            );
        }

        // Confirm the broker still exists and is active.
        const broker = await prisma.portalUser.findFirst({
            where: {
                id: consentRequest.brokerId,
                role: "BROKER",
                isActive: true,
            },
            select: {
                id: true,
            },
        });

        if (!broker) {
            return NextResponse.json(
                {
                    error:
                        "The broker associated with this consent request is no longer available.",
                },
                { status: 410 }
            );
        }
        
        // Verify the exact privacy consent document
        // originally attached to this request.
        const consentDocument =
            await prisma.brokerConsentDocument.findFirst({
                where: {
                    id: consentRequest.consentDocumentId,
                    brokerId: consentRequest.brokerId,
                    isActive: true,
                },
                select: {
                    id: true,
                    version: true,
                },
            });

        if (!consentDocument) {
            return NextResponse.json(
                {
                    error:
                        "The privacy consent document is no longer available. Please request a new consent link.",
                },
                { status: 410 }
            );
        }


        const saved = await saveCompletedConsent(
            consentRequest.id,
            signatureData
        );

        if (!saved) {
            return NextResponse.json(
                {
                    error:
                        "This consent request is no longer available. Please request a new consent link.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Privacy consent submitted successfully.",
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );

        } catch (error) {
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "P2034"
            ) {
                return NextResponse.json(
                    {
                        error:
                            "The consent request was updated during submission. Please try again.",
                    },
                    { status: 409 }
                );
            }

            logServerError({
                operation: "finance-consent-submit",
                error,
            });

        return NextResponse.json(
            { error: "Unable to process privacy consent." },
            { status: 500 }
        );
    }
}
