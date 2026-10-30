-- AlterTable
ALTER TABLE "FinanceApplication" ADD COLUMN     "legalHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legalHoldReason" TEXT,
ADD COLUMN     "retentionReviewAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FinanceDeletionAudit" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "FinanceDeletionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceDeletionAudit_applicationId_idx" ON "FinanceDeletionAudit"("applicationId");

-- CreateIndex
CREATE INDEX "FinanceDeletionAudit_requestedById_idx" ON "FinanceDeletionAudit"("requestedById");

-- CreateIndex
CREATE INDEX "FinanceDeletionAudit_status_idx" ON "FinanceDeletionAudit"("status");

-- CreateIndex
CREATE INDEX "FinanceDeletionAudit_requestedAt_idx" ON "FinanceDeletionAudit"("requestedAt");
