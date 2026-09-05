-- Production invariant: a depot can never have more than one open cash session.
-- The application already uses Serializable transactions, but this database
-- constraint closes the remaining race at the storage boundary.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "SessionCaisse"
    WHERE "estOuverte" = true
    GROUP BY "depotId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create unique open-cash-session constraint: duplicate open sessions exist for at least one depot.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "SessionCaisse_one_open_per_depot_idx"
  ON "SessionCaisse" ("depotId")
  WHERE "estOuverte" = true;
