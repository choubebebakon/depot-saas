-- Ticket de caisse (POS Supermarché) : montant effectivement reçu du client
-- et monnaie restituée. Permet d'imprimer un ticket conforme depuis le
-- sous-module Factures après la vente (régression corrigée).
ALTER TABLE "Vente" ADD COLUMN "montantRecu" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Vente" ADD COLUMN "monnaie" DOUBLE PRECISION NOT NULL DEFAULT 0;