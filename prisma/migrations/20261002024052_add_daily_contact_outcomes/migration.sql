-- CreateEnum
CREATE TYPE "ContactOutcome" AS ENUM ('SUCCESSFUL', 'UNSUCCESSFUL');

-- CreateTable
CREATE TABLE "LeadContactDay" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "salespersonId" INTEGER,
    "contactDate" DATE NOT NULL,
    "outcome" "ContactOutcome" NOT NULL,
    "lastContactedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadContactDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadContactDay_leadId_contactDate_key" ON "LeadContactDay"("leadId", "contactDate");

-- AddForeignKey
ALTER TABLE "LeadContactDay" ADD CONSTRAINT "LeadContactDay_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadContactDay" ADD CONSTRAINT "LeadContactDay_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "Salesperson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
