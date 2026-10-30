-- CreateTable
CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "accessedById" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'DOCUMENT_DOWNLOAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentAccessLog_applicationId_idx" ON "DocumentAccessLog"("applicationId");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_documentId_idx" ON "DocumentAccessLog"("documentId");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_accessedById_idx" ON "DocumentAccessLog"("accessedById");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_createdAt_idx" ON "DocumentAccessLog"("createdAt");
