-- CreateTable
CREATE TABLE "StaffAssignmentHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "previousStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffAssignmentHistory_applicationId_createdAt_idx" ON "StaffAssignmentHistory"("applicationId", "createdAt");
