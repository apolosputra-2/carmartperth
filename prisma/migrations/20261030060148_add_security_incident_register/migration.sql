-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'UNASSESSED',
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "summary" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedToId" TEXT,
    "investigationNotes" TEXT,
    "affectedDataTypes" JSONB,
    "affectedRecordCount" INTEGER,
    "containedAt" TIMESTAMP(3),
    "containmentNotes" TEXT,
    "notificationRequired" BOOLEAN,
    "notificationDecisionAt" TIMESTAMP(3),
    "notificationNotes" TEXT,
    "oaicNotifiedAt" TIMESTAMP(3),
    "customersNotifiedAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "recoveryNotes" TEXT,
    "closedAt" TIMESTAMP(3),
    "postIncidentReview" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityIncident_status_reportedAt_idx" ON "SecurityIncident"("status", "reportedAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");

-- CreateIndex
CREATE INDEX "SecurityIncident_reportedById_idx" ON "SecurityIncident"("reportedById");
