BEGIN;

-- AuditIntegrity must never disappear automatically when its JournalAudit row is deleted.
-- This closes the previous ON DELETE CASCADE loophole in the integrity chain.
ALTER TABLE "AuditIntegrity"
  DROP CONSTRAINT IF EXISTS "AuditIntegrity_journalAuditId_fkey";

ALTER TABLE "AuditIntegrity"
  ADD CONSTRAINT "AuditIntegrity_journalAuditId_fkey"
  FOREIGN KEY ("journalAuditId")
  REFERENCES "JournalAudit"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- Audit is append-only at database level. Application code intentionally has no
-- supported UPDATE/DELETE workflow for these records, so the database is the
-- final enforcement boundary against accidental or compromised application writes.
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit tables are append-only: UPDATE/DELETE is forbidden';
END;
$$;

DROP TRIGGER IF EXISTS "JournalAudit_append_only_guard" ON "JournalAudit";
CREATE TRIGGER "JournalAudit_append_only_guard"
BEFORE UPDATE OR DELETE ON "JournalAudit"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_mutation();

DROP TRIGGER IF EXISTS "AuditIntegrity_append_only_guard" ON "AuditIntegrity";
CREATE TRIGGER "AuditIntegrity_append_only_guard"
BEFORE UPDATE OR DELETE ON "AuditIntegrity"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_mutation();

COMMIT;
