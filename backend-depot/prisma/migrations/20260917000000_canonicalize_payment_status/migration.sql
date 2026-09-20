-- PARTIE 3 (contrainte 5) — Canonicalisation de PaymentStatus.
-- `SUCCESS` devient l'unique statut "paiement abouti" ; `COMPLETED` est un
-- doublon historique déprécié. Cette migration réaffecte les lignes COMPLETED
-- vers SUCCESS : sémantiquement identiques, AUCUNE donnée n'est perdue ou
-- réécrite de manière destructive (le statut reste "succès").
-- La valeur COMPLETED reste déclarée dans l'enum Postgres (retrait différé
-- après vérification — voir checklist de décommissionnement).
-- NB : si cette migration s'exécute sur une base où AUCUNE ligne n'utilise
-- COMPLETED, elle est un no-op inoffensif.

UPDATE "Payment"
SET "status" = 'SUCCESS'::"PaymentStatus"
WHERE "status" = 'COMPLETED'::"PaymentStatus";
