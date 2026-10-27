-- CreateTable
CREATE TABLE "FinanceDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceDocument_storageKey_key" ON "FinanceDocument"("storageKey");

-- CreateIndex
CREATE INDEX "FinanceDocument_applicationId_idx" ON "FinanceDocument"("applicationId");

-- AddForeignKey
ALTER TABLE "FinanceDocument" ADD CONSTRAINT "FinanceDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FinanceApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
