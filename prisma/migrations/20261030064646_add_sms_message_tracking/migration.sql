-- CreateTable
CREATE TABLE "SmsMessage" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "providerSid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "requestedById" TEXT,
    "brokerId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsMessage_providerSid_key" ON "SmsMessage"("providerSid");

-- CreateIndex
CREATE UNIQUE INDEX "SmsMessage_idempotencyKey_key" ON "SmsMessage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SmsMessage_applicationId_idx" ON "SmsMessage"("applicationId");

-- CreateIndex
CREATE INDEX "SmsMessage_recipientPhone_idx" ON "SmsMessage"("recipientPhone");

-- CreateIndex
CREATE INDEX "SmsMessage_messageType_status_idx" ON "SmsMessage"("messageType", "status");

-- CreateIndex
CREATE INDEX "SmsMessage_createdAt_idx" ON "SmsMessage"("createdAt");
