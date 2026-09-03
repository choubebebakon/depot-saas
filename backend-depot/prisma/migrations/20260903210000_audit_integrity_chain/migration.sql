CREATE TABLE IF NOT EXISTS "AuditIntegrity" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "journalAuditId" TEXT NOT NULL,
  "previousHash" TEXT,
  "hash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditIntegrity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditIntegrity_journalAuditId_key" UNIQUE ("journalAuditId"),
  CONSTRAINT "AuditIntegrity_hash_key" UNIQUE ("hash"),
  CONSTRAINT "AuditIntegrity_journalAuditId_fkey" FOREIGN KEY ("journalAuditId") REFERENCES "JournalAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AuditIntegrity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditIntegrity_tenantId_createdAt_idx"
  ON "AuditIntegrity"("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS "AuditIntegrity_previousHash_idx"
  ON "AuditIntegrity"("previousHash");
