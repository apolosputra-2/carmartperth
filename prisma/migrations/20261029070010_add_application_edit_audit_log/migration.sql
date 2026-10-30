-- CreateTable
CREATE TABLE "ApplicationEditAuditLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "editorRole" TEXT NOT NULL,
    "changedFields" JSONB NOT NULL,
    "authorityConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEditAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationEditAuditLog_applicationId_createdAt_idx" ON "ApplicationEditAuditLog"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEditAuditLog_editorId_idx" ON "ApplicationEditAuditLog"("editorId");
