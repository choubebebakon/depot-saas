CREATE TABLE "JournalAudit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "metadataText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JournalAudit_tenantId_createdAt_idx" ON "JournalAudit"("tenantId", "createdAt");
CREATE INDEX "JournalAudit_action_idx" ON "JournalAudit"("action");
