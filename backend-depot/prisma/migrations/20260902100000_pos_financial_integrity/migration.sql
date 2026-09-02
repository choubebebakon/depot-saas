-- Production guardrails for POS / Caisse financial and stock invariants.
-- Constraints are intentionally NOT VALID so existing legacy rows are not
-- blocked during deployment. They are enforced for all new/updated rows.
-- After auditing legacy data, validate them with ALTER TABLE ... VALIDATE CONSTRAINT.

ALTER TABLE "Stock"
  ADD CONSTRAINT "Stock_quantite_non_negative"
  CHECK ("quantite" >= 0) NOT VALID;

ALTER TABLE "Vente"
  ADD CONSTRAINT "Vente_total_non_negative"
  CHECK ("total" >= 0) NOT VALID;

ALTER TABLE "Vente"
  ADD CONSTRAINT "Vente_payment_amounts_non_negative"
  CHECK (
    "montantCash" >= 0
    AND "montantOM" >= 0
    AND "montantMoMo" >= 0
    AND "montantCredit" >= 0
  ) NOT VALID;

ALTER TABLE "Vente"
  ADD CONSTRAINT "Vente_payment_total_consistent"
  CHECK (
    ABS(
      "total" - (
        "montantCash"
        + "montantOM"
        + "montantMoMo"
        + "montantCredit"
      )
    ) <= 0.01
  ) NOT VALID;
