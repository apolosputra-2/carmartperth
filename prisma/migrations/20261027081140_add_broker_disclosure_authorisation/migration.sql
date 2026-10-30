-- AlterTable
ALTER TABLE "FinanceApplication" ADD COLUMN     "brokerDisclosureAuthorised" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "brokerDisclosureAuthorisedAt" TIMESTAMP(3),
ADD COLUMN     "brokerDisclosureAuthorisedBy" TEXT,
ADD COLUMN     "brokerDisclosureEvidence" TEXT;
