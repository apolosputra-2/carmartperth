-- AlterTable
ALTER TABLE "FinanceApplication" ADD COLUMN     "deletionInProgress" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FinanceDeletionAudit" ADD COLUMN     "executionStartedAt" TIMESTAMP(3),
ADD COLUMN     "lastCleanupAttemptAt" TIMESTAMP(3);
