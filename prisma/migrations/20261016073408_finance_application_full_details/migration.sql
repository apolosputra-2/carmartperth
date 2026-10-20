-- AlterTable
ALTER TABLE "FinanceApplication" ADD COLUMN     "applicantType" TEXT,
ADD COLUMN     "applicationType" TEXT,
ADD COLUMN     "consentRecordedAt" TIMESTAMP(3),
ADD COLUMN     "formData" JSONB;
