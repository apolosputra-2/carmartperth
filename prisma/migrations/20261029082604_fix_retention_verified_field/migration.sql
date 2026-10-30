/*
  Warnings:

  - You are about to drop the column `etentionVerifiedAt` on the `FinanceDeletionAudit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FinanceDeletionAudit" DROP COLUMN "etentionVerifiedAt",
ADD COLUMN     "retentionVerifiedAt" TIMESTAMP(3);
