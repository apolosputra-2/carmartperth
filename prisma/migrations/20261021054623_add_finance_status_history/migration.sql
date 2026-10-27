-- CreateTable
CREATE TABLE "FinanceStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "previousStatus" "FinanceApplicationStatus" NOT NULL,
    "newStatus" "FinanceApplicationStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceStatusHistory_applicationId_createdAt_idx" ON "FinanceStatusHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "FinanceStatusHistory_changedById_idx" ON "FinanceStatusHistory"("changedById");
