
import { NextRequest, NextResponse } from "next/server";
import { getPortalUser } from "@/lib/brokerPermissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logServerError } from "@/lib/secureLogger";
import { sendSms } from "@/lib/smsSender";
import { randomBytes, createHash } from "node:crypto";

export const runtime = "nodejs";

function buildBrokerConsentSms(
    customerName: string,
    token: string
) {
    const baseUrl = process.env.APP_URL;

    if (!baseUrl) {
        throw new Error("APP_URL is not configured.");
    }

    const url = new URL(baseUrl);

    if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1"
    ) {
        throw new Error("APP_URL must be a public HTTPS URL.");
    }

    url.pathname = "/finance/consent";
    url.search = "";
    url.searchParams.set("token", token);
    url.hash = "";

    return (
        `Hi ${customerName}, it's Carmart Perth.\n\n` +
        "Please review and sign your broker's privacy consent form using this secure link:\n\n" +
        url.toString() +
        "\n\nIf you weren't expecting this message, please contact Carmart Perth on (08) 9272 6814."
    );
}

function generateConsentToken() {
    const token = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
        .update(token)
        .digest("hex");

    return { token, tokenHash };
}

async function reserveBrokerConsentSms(
    tx: Prisma.TransactionClient,
    consentRequestId: string,
    applicationId: string,
    brokerId: string,
    customerName: string,
    customerPhone: string,
    requestedById: string
) {
    return tx.smsMessage.create({
        data: {
            applicationId,
            brokerId,
            recipientName: customerName,
            recipientPhone: customerPhone,
            messageType: "BROKER_CONSENT",
            idempotencyKey:
                `BROKER_CONSENT:${consentRequestId}`,
            requestedById,
            provider: "MOCK",
            status: "SENDING",
            attemptCount: 1,
        },
        select: {
            id: true,
        },
    });
}

async function createConsentRequest(
    applicationId: string,
    brokerId: string,
    consentDocumentId: string,
    requestedById: string
) {
    const { token, tokenHash } = generateConsentToken();

    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const activeRequestKey = createHash("sha256")
        .update(JSON.stringify([applicationId, brokerId]))
        .digest("hex");

    const record = await prisma.$transaction(async (tx) => {
        
        // Serialize consent requests for the same application and broker.
        await tx.$queryRaw`
            SELECT 1 AS locked
            FROM pg_advisory_xact_lock(
                hashtextextended(${activeRequestKey}, 0)
            )
        `;

        // Recheck application assignment inside the transaction.
        const currentApplication = await tx.financeApplication.findFirst({
            where: {
                id: applicationId,
                submittedAt: {
                    not: null,
                },
                assignedBrokerId: brokerId,
            },
        select: {
            id: true,
            customerName: true,
            phone: true,
        },
        });

        if (!currentApplication) {
            throw new Error("CONSENT_APPLICATION_ASSIGNMENT_CHANGED");
        }
            // Validate the customer's stored mobile number
            // before preparing a privacy consent SMS.
            const customerPhoneInput = currentApplication.phone?.trim();

            if (
                !customerPhoneInput ||
                !/^(04\d{8}|\+614\d{8})$/.test(customerPhoneInput)
            ) {
                throw new Error("CONSENT_INVALID_PHONE");
            }

            // Normalize for SMS records, cooldown checks, and Twilio.
            const customerPhone = customerPhoneInput.startsWith("04")
                ? `+61${customerPhoneInput.slice(1)}`
                : customerPhoneInput;

            const customerName = currentApplication.customerName?.trim();

            if (
                !customerName ||
                customerName.length > 80 ||
                /[\r\n\x00-\x1F\x7F]/.test(customerName)
            ) {
                throw new Error("CONSENT_INVALID_CUSTOMER_NAME");
            }
        
        // Recheck that the selected broker is still active.
        const currentBroker = await tx.portalUser.findFirst({
            where: {
                id: brokerId,
                role: "BROKER",
                isActive: true,
            },
            select: {
                id: true,
            },
        });

        if (!currentBroker) {
            throw new Error("CONSENT_BROKER_UNAVAILABLE");
        }

        // Recheck the broker's active consent document.
        const activeDocuments = await tx.brokerConsentDocument.findMany({
            where: {
                brokerId,
                isActive: true,
            },
            select: {
                id: true,
            },
            take: 2,
        });

        if (
            activeDocuments.length !== 1 ||
            activeDocuments[0].id !== consentDocumentId
        ) {
            throw new Error("CONSENT_DOCUMENT_CHANGED");
        }

        
        // Recheck whether this exact consent document
        // has already been completed.
        const completedConsent = await tx.brokerConsentRequest.findFirst({
            where: {
                applicationId,
                brokerId,
                consentDocumentId,
                status: "COMPLETED",
                completedAt: {
                    not: null,
                },
            },
            select: {
                id: true,
            },
        });

        if (completedConsent) {
            throw new Error("CONSENT_ALREADY_COMPLETED");
        }

        // Release expired requests before creating a new one.
        await tx.brokerConsentRequest.updateMany({
            where: {
                applicationId,
                brokerId,
                status: "PENDING",
                expiresAt: { lte: new Date() },
            },
            data: {
                status: "EXPIRED",
                activeRequestKey: null,
            },
        });
        
        // Check for an existing request while holding the lock.
        const activeRequest = await tx.brokerConsentRequest.findFirst({
            where: {
                activeRequestKey,
                status: "PENDING",
                expiresAt: {
                    gt: new Date(),
                },
            },
            select: {
                id: true,
            },
        });

        if (activeRequest) {
            throw new Error("CONSENT_REQUEST_ALREADY_PENDING");
        }

        
        // Lock consent SMS checks for this recipient.
        // Concurrent requests for the same phone must wait.
        const phoneLockKey = `BROKER_CONSENT_PHONE:${customerPhone}`;

        await tx.$queryRaw`
            SELECT 1 AS locked
            FROM pg_advisory_xact_lock(
                hashtextextended(${phoneLockKey}, 0)
            )
        `;

        // Lock consent SMS checks for this sender.
        // This helps prevent concurrent requests from
        // bypassing the hourly limit.
        const senderLockKey = `BROKER_CONSENT_SENDER:${requestedById}`;

        await tx.$queryRaw`
            SELECT 1 AS locked
            FROM pg_advisory_xact_lock(
                hashtextextended(${senderLockKey}, 0)
            )
        `;

        // Prevent repeated SMS requests to the same phone
        // within five minutes.
        const recentSms = await tx.smsMessage.findFirst({
            where: {
                recipientPhone: customerPhone,
                createdAt: {
                    gt: new Date(Date.now() - 5 * 60 * 1000),
                },
            },
            select: {
                id: true,
            },
        });

        if (recentSms) {
            throw new Error("CONSENT_SMS_COOLDOWN");
        }

        // Prevent another consent SMS while the previous
        // delivery outcome is unresolved.
        const unresolvedSms = await tx.smsMessage.findFirst({
            where: {
                applicationId,
                brokerId,
                messageType: "BROKER_CONSENT",
                status: {
                    in: ["PENDING", "SENDING", "UNKNOWN"],
                },
            },
            select: {
                id: true,
            },
        });

        if (unresolvedSms) {
            throw new Error("CONSENT_SMS_UNRESOLVED");
        }

        
        // Limit each portal user to 30 SMS requests
        // across all message types in a rolling hour.
        const hourlySmsCount = await tx.smsMessage.count({
            where: {
                requestedById,
                createdAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000),
                },
            },
        });

        if (hourlySmsCount >= 30) {
            throw new Error("CONSENT_SMS_HOURLY_LIMIT");
        }

        // PostgreSQL enforces uniqueness of activeRequestKey.

        const consentRecord = await tx.brokerConsentRequest.create({
            data: {
                applicationId,
                brokerId,
                consentDocumentId,
                requestedById,
                tokenHash,
                expiresAt,
                status: "PENDING",
                activeRequestKey,
            },
            select: {
                id: true,
                expiresAt: true,
            },
        });

        // Reserve the SMS in the same transaction
        // as the consent request.
        const smsRecord = await reserveBrokerConsentSms(
            tx,
            consentRecord.id,
            applicationId,
            brokerId,
            customerName,
            customerPhone,
            requestedById
        );

        return {
            ...consentRecord,
            smsId: smsRecord.id,
        };
    });

    return {
        requestId: record.id,
        smsId: record.smsId,
        token,
        expiresAt: record.expiresAt,
    };
}

export async function POST(request: NextRequest) {
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

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
        );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
        );
    }

    const data = body as Record<string, unknown>;

    const { applicationId, brokerId } = data;

    if (
        typeof applicationId !== "string" ||
        !applicationId.trim() ||
        applicationId.length > 100 ||
        typeof brokerId !== "string" ||
        !brokerId.trim() ||
        brokerId.length > 100
    ) {
        return NextResponse.json(
        { error: "Valid application and broker IDs are required." },
        { status: 400 }
        );
    }

    try {
    // Verify the original finance application exists.
    const application = await prisma.financeApplication.findFirst({
        where: {
        id: applicationId,
        submittedAt: {
            not: null,
        },

        // Brokers can only access their assigned applications.
        ...(user.role === "BROKER"
            ? { assignedBrokerId: user.id }
            : {}),
        },
        select: {
        id: true,
        customerName: true,
        phone: true,
        assignedBrokerId: true,
        },
    });

    if (!application) {
        return NextResponse.json(
        {
            error: "Application not found or access denied.",
        },
        { status: 404 }
        );
    }

    // Consent must match the application's assigned broker.
    if (application.assignedBrokerId !== brokerId) {
        return NextResponse.json(
        {
            error:
            "Please assign the selected broker to this application before requesting consent.",
        },
        { status: 409 }
        );
    }

    // Brokers can only create consent requests for themselves.
    if (user.role === "BROKER" && brokerId !== user.id) {
        return NextResponse.json(
        { error: "You can only select your own broker account." },
        { status: 403 }
        );
    }

    // Check the selected broker is active.
    const broker = await prisma.portalUser.findFirst({
        where: {
        id: brokerId,
        role: "BROKER",
        isActive: true,
        },
        select: {
        id: true,
        name: true,
        },
    });

    if (!broker) {
        return NextResponse.json(
        { error: "Selected broker is not available." },
        { status: 404 }
        );
    }

    // Find the broker's active privacy consent PDF.
    const documents = await prisma.brokerConsentDocument.findMany({
        where: {
        brokerId,
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

    if (documents.length !== 1) {
        return NextResponse.json(
        {
            error: "Broker must have exactly one active privacy consent document.",
        },
        { status: 409 }
        );
    }

    
    // Check whether the customer already signed
    // this broker's current privacy consent document.
    const completedConsent = await prisma.brokerConsentRequest.findFirst({
        where: {
            applicationId: application.id,
            brokerId: broker.id,
            consentDocumentId: documents[0].id,
            status: "COMPLETED",
            completedAt: {
                not: null,
            },
        },
        select: {
            id: true,
            completedAt: true,
        },
    });

    if (completedConsent) {
        return NextResponse.json(
            {
                error:
                    "This customer has already completed the selected broker's current privacy consent document.",
            },
            { status: 409 }
        );
    }

    // Unique key for this application and broker combination.
    const activeRequestKey = createHash("sha256")
        .update(JSON.stringify([application.id, broker.id]))
        .digest("hex");

    // Release expired consent requests for this application and broker.
    await prisma.brokerConsentRequest.updateMany({
        where: {
            applicationId: application.id,
            brokerId: broker.id,
            status: "PENDING",
            expiresAt: {
                lte: new Date(),
            },
        },
        data: {
            status: "EXPIRED",
            activeRequestKey: null,
        },
    });
    
    // Prevent duplicate pending consent requests.
    const existingRequest = await prisma.brokerConsentRequest.findFirst({
        where: {
            activeRequestKey,
            status: "PENDING",
            expiresAt: {
                gt: new Date(),
            },
        },
        select: {
            id: true,
        },
    });

    if (existingRequest) {
        return NextResponse.json(
            {
                error:
                    "An active privacy consent request already exists for this application and broker.",
            },
            { status: 409 }
        );
    }


        // Test requests are available only in development.
        // Do not create consent requests in production yet.
        if (process.env.NODE_ENV !== "development") {
            return NextResponse.json(
                { error: "Consent request creation is not enabled yet." },
                { status: 501 }
            );
        }


        // Validate the stored customer details before
        // creating any consent or SMS database records.
        const customerName = application.customerName?.trim();
        const customerPhone = application.phone?.trim();

        if (
            !customerName ||
            customerName.length > 80 ||
            /[\r\n\x00-\x1F\x7F]/.test(customerName)
        ) {
            return NextResponse.json(
                { error: "Invalid customer name." },
                { status: 400 }
            );
        }

        if (
            !customerPhone ||
            !/^(04\d{8}|\+614\d{8})$/.test(customerPhone)
        ) {
            return NextResponse.json(
                { error: "Invalid Australian mobile number." },
                { status: 400 }
            );
        }

        // Convert Australian local format to international format.
        const smsPhone = customerPhone.startsWith("04")
            ? `+61${customerPhone.slice(1)}`
            : customerPhone;

        // Verify APP_URL before creating the database records.
        buildBrokerConsentSms(customerName, "0".repeat(64));

        // Create the consent request and SMS reservation.
        const created = await createConsentRequest(
            application.id,
            broker.id,
            documents[0].id,
            user.id
        );

        const smsBody = buildBrokerConsentSms(
            customerName,
            created.token
        );

        // Send outside the database transaction.
        try {
            const result = await sendSms({
                to: smsPhone,
                body: smsBody,
                smsId: created.smsId,
            });

            const finalStatus =
                result.provider === "MOCK"
                    ? "MOCKED"
                    : "SENT";

            // Do not overwrite a newer Twilio webhook status.
            const updated = await prisma.smsMessage.updateMany({
                where: {
                    id: created.smsId,
                    status: "SENDING",
                },
                data: {
                    provider: result.provider,
                    providerSid: result.messageSid,
                    status: finalStatus,
                    sentAt:
                        result.provider === "TWILIO"
                            ? new Date()
                            : null,
                },
            });

            const current =
                updated.count === 0
                    ? await prisma.smsMessage.findUnique({
                          where: {
                              id: created.smsId,
                          },
                          select: {
                              status: true,
                          },
                      })
                    : null;

            return NextResponse.json(
                {
                    success: true,
                    requestId: created.requestId,
                    messageId: created.smsId,
                    status: current?.status ?? finalStatus,
                },
                {
                    status: 201,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        } catch (error) {
            // A provider timeout may mean Twilio
            // accepted the SMS. Never auto-resend.
            await prisma.smsMessage.updateMany({
                where: {
                    id: created.smsId,
                    status: "SENDING",
                },
                data: {
                    status: "UNKNOWN",
                    lastError:
                        "SMS outcome requires investigation.",
                },
            });

            // TEMPORARY: Development-only error diagnostics.
            // Remove before production deployment.
            if (process.env.NODE_ENV === "development") {
                console.error("[CONSENT DEBUG]", {
                    name: error instanceof Error ? error.name : "Unknown",
                    code:
                        error && typeof error === "object" && "code" in error
                            ? error.code
                            : undefined,
                    message:
                        error instanceof Error ? error.message : "Unknown error",
                });
            }
            
            logServerError({
                operation: "broker-consent-sms-send",
                error,
            });

            return NextResponse.json(
                {
                    error:
                        "Privacy consent SMS outcome is uncertain. Check SMS History before retrying.",
                    messageId: created.smsId,
                },
                { status: 502 }
            );
        }
        
    } catch (error) {
        
        if (
            error instanceof Error &&
            error.message === "CONSENT_INVALID_PHONE"
        ) {
            return NextResponse.json(
                {
                    error:
                        "The application does not have a valid international-format mobile number.",
                },
                { status: 400 }
            );
        }

        if (
            error instanceof Error &&
            error.message === "CONSENT_INVALID_CUSTOMER_NAME"
        ) {
            return NextResponse.json(
                {
                    error: "The application has an invalid customer name.",
                },
                { status: 400 }
            );
        }

        if (
            error instanceof Error &&
            error.message === "CONSENT_APPLICATION_ASSIGNMENT_CHANGED"
        ) {
            return NextResponse.json(
                {
                    error:
                        "The application's broker assignment has changed. Refresh the application and try again.",
                },
                { status: 409 }
            );
        }
        
        if (
            error instanceof Error &&
            error.message === "CONSENT_DOCUMENT_CHANGED"
        ) {
            return NextResponse.json(
                {
                    error:
                        "The broker's active privacy consent document has changed. Refresh and try again.",
                },
                { status: 409 }
            );
        }

        if (
            error instanceof Error &&
            error.message === "CONSENT_ALREADY_COMPLETED"
        ) {
            return NextResponse.json(
                {
                    error:
                        "The customer has already completed this broker's privacy consent document.",
                },
                { status: 409 }
            );
        }

        
        if (
            error instanceof Error &&
            error.message === "CONSENT_BROKER_UNAVAILABLE"
        ) {
            return NextResponse.json(
                {
                    error:
                        "The selected broker is no longer active. Please refresh and choose an available broker.",
                },
                { status: 409 }
            );
        }
        
        if (
            error instanceof Error &&
            error.message === "CONSENT_REQUEST_ALREADY_PENDING"
        ) {
            return NextResponse.json(
                {
                    error:
                        "An active privacy consent request already exists for this application and broker.",
                },
                { status: 409 }
            );
        }

        
        if (
            error instanceof Error &&
            error.message === "CONSENT_SMS_COOLDOWN"
        ) {
            return NextResponse.json(
                {
                    error:
                        "An SMS was recently sent to this number. Please wait five minutes before trying again.",
                },
                { status: 429 }
            );
        }

        if (
            error instanceof Error &&
            error.message === "CONSENT_SMS_UNRESOLVED"
        ) {
            return NextResponse.json(
                {
                    error:
                        "A previous privacy consent SMS has an unresolved delivery status. Please check SMS History before trying again.",
                },
                { status: 409 }
            );
        }

        
        if (
            error instanceof Error &&
            error.message === "CONSENT_SMS_HOURLY_LIMIT"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Hourly SMS limit reached. Please wait before sending another message.",
                },
                { status: 429 }
            );
        }

        // PostgreSQL unique constraint violation.
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return NextResponse.json(
                {
                    error:
                        "A conflicting consent request already exists. Please refresh and check before trying again.",
                },
                { status: 409 }
            );
        }

        logServerError({
            operation: "broker-consent-request",
            error,
        });

        return NextResponse.json(
            {
                error: "Unable to process privacy consent request.",
            },
            { status: 500 }
        );
    }
}

