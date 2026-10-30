-- CreateTable
CREATE TABLE "FinanceDeletionDocument" (
    "id" TEXT NOT NULL,
    "deletionAuditId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "quarantinedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "FinanceDeletionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceDeletionDocument_deletionAuditId_status_idx" ON "FinanceDeletionDocument"("deletionAuditId", "status");

-- CreateIndex
CREATE INDEX "FinanceDeletionDocument_storageKey_idx" ON "FinanceDeletionDocument"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceDeletionDocument_deletionAuditId_documentId_key" ON "FinanceDeletionDocument"("deletionAuditId", "documentId");
