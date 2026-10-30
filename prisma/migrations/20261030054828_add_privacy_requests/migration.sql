-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "requestType" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterContact" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "identityVerifiedAt" TIMESTAMP(3),
    "identityVerifiedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "resolutionNote" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrivacyRequest_applicationId_idx" ON "PrivacyRequest"("applicationId");

-- CreateIndex
CREATE INDEX "PrivacyRequest_status_receivedAt_idx" ON "PrivacyRequest"("status", "receivedAt");
