-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FinanceApplicationStatus" ADD VALUE 'RECEIVED';
ALTER TYPE "FinanceApplicationStatus" ADD VALUE 'SENT_TO_BROKER';
ALTER TYPE "FinanceApplicationStatus" ADD VALUE 'ADDITIONAL_INFO_REQUIRED';
ALTER TYPE "FinanceApplicationStatus" ADD VALUE 'SENT_TO_LENDER';
ALTER TYPE "FinanceApplicationStatus" ADD VALUE 'CONDITIONALLY_APPROVED';
ALTER TYPE "FinanceApplicationStatus" ADD VALUE 'SETTLED';

-- AlterTable
ALTER TABLE "FinanceApplication" ADD COLUMN     "assignedBrokerId" TEXT,
ADD COLUMN     "assignedStaffId" TEXT;

-- CreateTable
CREATE TABLE "BrokerAssignmentHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "previousBrokerId" TEXT,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrokerAssignmentHistory_applicationId_createdAt_idx" ON "BrokerAssignmentHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "BrokerAssignmentHistory_assignedById_idx" ON "BrokerAssignmentHistory"("assignedById");

-- CreateIndex
CREATE INDEX "BrokerAssignmentHistory_brokerId_idx" ON "BrokerAssignmentHistory"("brokerId");

-- CreateIndex
CREATE INDEX "FinanceApplication_assignedStaffId_idx" ON "FinanceApplication"("assignedStaffId");

-- CreateIndex
CREATE INDEX "FinanceApplication_assignedBrokerId_idx" ON "FinanceApplication"("assignedBrokerId");

-- AddForeignKey
ALTER TABLE "FinanceApplication" ADD CONSTRAINT "FinanceApplication_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "PortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceApplication" ADD CONSTRAINT "FinanceApplication_assignedBrokerId_fkey" FOREIGN KEY ("assignedBrokerId") REFERENCES "PortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
