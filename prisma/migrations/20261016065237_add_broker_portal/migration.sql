-- CreateEnum
CREATE TYPE "FinanceApplicationStatus" AS ENUM ('LINK_SENT', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "FinanceApplication" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerName" TEXT,
    "status" "FinanceApplicationStatus" NOT NULL DEFAULT 'LINK_SENT',
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "employmentType" TEXT,
    "employer" TEXT,
    "monthlyIncome" DECIMAL(12,2),
    "monthlyExpenses" DECIMAL(12,2),
    "loanAmount" DECIMAL(12,2),
    "loanPurpose" TEXT,
    "smsSentAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceApplication_tokenHash_key" ON "FinanceApplication"("tokenHash");
