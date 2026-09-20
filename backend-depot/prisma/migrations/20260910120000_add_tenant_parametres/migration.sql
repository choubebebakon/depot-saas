-- Persist JSON settings (ticket / caisse / facture) per tenant.
ALTER TABLE "Tenant" ADD COLUMN "parametres" JSONB;
