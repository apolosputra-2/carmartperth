-- CreateTable
CREATE TABLE "BrokerConsentToken" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "BrokerConsentToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerConsentToken_tokenHash_key" ON "BrokerConsentToken"("tokenHash");

-- CreateIndex
CREATE INDEX "BrokerConsentToken_applicationId_brokerId_idx" ON "BrokerConsentToken"("applicationId", "brokerId");

-- CreateIndex
CREATE INDEX "BrokerConsentToken_status_expiresAt_idx" ON "BrokerConsentToken"("status", "expiresAt");
