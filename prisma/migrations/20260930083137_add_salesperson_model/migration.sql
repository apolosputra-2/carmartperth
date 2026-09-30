/*
  Warnings:

  - You are about to drop the column `assignedSalesperson` on the `Lead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "assignedSalesperson",
ADD COLUMN     "salespersonId" INTEGER;

-- CreateTable
CREATE TABLE "Salesperson" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Salesperson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Salesperson_name_key" ON "Salesperson"("name");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "Salesperson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
