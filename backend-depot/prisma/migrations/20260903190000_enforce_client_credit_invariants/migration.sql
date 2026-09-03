-- Keep the financial invariant at database level so concurrent requests
-- cannot make a client's credit balance negative or exceed an explicitly
-- configured positive ceiling. A ceiling of 0 remains the legacy "no ceiling"
-- convention and is therefore not restricted by this trigger.

CREATE OR REPLACE FUNCTION enforce_client_credit_invariants()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.soldeCredit < 0 THEN
    RAISE EXCEPTION 'Le solde crédit client ne peut pas être négatif.'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.plafondCredit > 0 AND NEW.soldeCredit > NEW.plafondCredit THEN
    RAISE EXCEPTION 'Le plafond de crédit client est dépassé.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS client_credit_invariants ON "Client";

CREATE TRIGGER client_credit_invariants
BEFORE INSERT OR UPDATE OF soldeCredit, plafondCredit
ON "Client"
FOR EACH ROW
EXECUTE FUNCTION enforce_client_credit_invariants();
