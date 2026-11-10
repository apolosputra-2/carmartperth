-- CreateTable
CREATE TABLE "BrokerConsentRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "consentDocumentId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "signatureData" TEXT,

    CONSTRAINT "BrokerConsentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerConsentRequest_tokenHash_key" ON "BrokerConsentRequest"("tokenHash");

-- CreateIndex
CREATE INDEX "BrokerConsentRequest_applicationId_idx" ON "BrokerConsentRequest"("applicationId");

-- CreateIndex
CREATE INDEX "BrokerConsentRequest_brokerId_idx" ON "BrokerConsentRequest"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerConsentRequest_consentDocumentId_idx" ON "BrokerConsentRequest"("consentDocumentId");

-- CreateIndex
CREATE INDEX "BrokerConsentRequest_expiresAt_idx" ON "BrokerConsentRequest"("expiresAt");
