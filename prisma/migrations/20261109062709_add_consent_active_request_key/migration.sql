/*
  Warnings:

  - A unique constraint covering the columns `[activeRequestKey]` on the table `BrokerConsentRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BrokerConsentRequest" ADD COLUMN     "activeRequestKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BrokerConsentRequest_activeRequestKey_key" ON "BrokerConsentRequest"("activeRequestKey");
