
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

    const consentId =
        request.nextUrl.searchParams.get("consentId");

    if (!consentId || consentId.length > 100) {
        return NextResponse.json(
            { error: "Invalid consent ID." },
            { status: 400 }
        );
    }

    try {
        const consent = await prisma.brokerConsentRequest.findFirst({
            where: {
                id: consentId,
                status: "COMPLETED",
                completedAt: { not: null },
            },
            select: {
                applicationId: true,
                brokerId: true,
                signatureData: true,
            },
        });

        if (!consent) {
            return NextResponse.json(
                { error: "Completed consent not found." },
                { status: 404 }
            );
        }

        // Confirm the application still belongs
        // to the broker associated with the consent.
        const application = await prisma.financeApplication.findFirst({
            where: {
                id: consent.applicationId,
                submittedAt: { not: null },
                assignedBrokerId: consent.brokerId,
                ...(user.role === "BROKER"
                    ? { assignedBrokerId: user.id }
                    : {}),
            },
            select: {
                id: true,
            },
        });

        if (!application) {
            return NextResponse.json(
                { error: "Access denied." },
                { status: 403 }
            );
        }

        if (
            !consent.signatureData ||
            !consent.signatureData.startsWith(
                "data:image/png;base64,"
            )
        ) {
            return NextResponse.json(
                { error: "Signature image unavailable." },
                { status: 404 }
            );
        }

        const base64 = consent.signatureData.slice(
            "data:image/png;base64,".length
        );

        if (
            base64.length > 500_000 ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)
        ) {
            return NextResponse.json(
                { error: "Stored signature is invalid." },
                { status: 500 }
            );
        }

        const signature = Buffer.from(base64, "base64");

        const pngHeader = Buffer.from([
            137, 80, 78, 71, 13, 10, 26, 10,
        ]);

        if (
            signature.length < 45 ||
            !signature.subarray(0, 8).equals(pngHeader)
        ) {
            return NextResponse.json(
                { error: "Stored signature is invalid." },
                { status: 500 }
            );
        }

        return new NextResponse(new Uint8Array(signature), {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": "inline",
            },
        });
    } catch (error) {
        logServerError({
            operation: "broker-consent-signature",
            error,
        });

        return NextResponse.json(
            { error: "Unable to load signature." },
            { status: 500 }
        );
    }
}
