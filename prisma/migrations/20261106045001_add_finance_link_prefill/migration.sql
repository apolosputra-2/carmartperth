-- CreateTable
CREATE TABLE "FinanceLinkPrefill" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceLinkPrefill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceLinkPrefill_tokenHash_key" ON "FinanceLinkPrefill"("tokenHash");

-- CreateIndex
CREATE INDEX "FinanceLinkPrefill_expiresAt_idx" ON "FinanceLinkPrefill"("expiresAt");
