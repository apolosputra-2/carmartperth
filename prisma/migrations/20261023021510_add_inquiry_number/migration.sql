/*
  Warnings:

  - A unique constraint covering the columns `[inquiryNumber]` on the table `FinanceApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FinanceApplication" ADD COLUMN     "inquiryNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FinanceApplication_inquiryNumber_key" ON "FinanceApplication"("inquiryNumber");
