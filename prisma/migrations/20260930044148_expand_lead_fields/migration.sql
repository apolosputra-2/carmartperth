/*
  Warnings:

  - The `status` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'HOT', 'CONTACTED', 'APPOINTMENT', 'CONTACT_UNSUCCESSFUL', 'CONTRACT_SIGNED', 'WON', 'DELIVERED', 'LOST');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "assignedSalesperson" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "vehicleName" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "LeadStatus" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");
