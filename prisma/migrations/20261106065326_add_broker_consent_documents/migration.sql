-- CreateTable
CREATE TABLE "BrokerConsentDocument" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerConsentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrokerConsentDocument_brokerId_isActive_idx" ON "BrokerConsentDocument"("brokerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerConsentDocument_brokerId_version_key" ON "BrokerConsentDocument"("brokerId", "version");
