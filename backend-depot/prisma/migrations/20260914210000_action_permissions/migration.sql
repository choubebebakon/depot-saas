-- §14 — Permissions d'action fines (matrice GesTock)
-- Table ActionPermission : distingue les actions sensibles (ventes.annuler,
-- caisse.fermer, stock.ajuster…) d'une écriture read/write normale.
-- Deny-by-default : toute ligne absente = action refusée pour ce rôle×métier.
-- PATRON/GERANT/ADMIN sont toujours autorisés (gérés en code PermissionGuard).

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE "ActionPermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "metier" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActionPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActionPermission_role_metier_action_key" ON "ActionPermission"("role", "metier", "action");
CREATE INDEX "ActionPermission_action_idx" ON "ActionPermission"("action");

-- ── Seed rétro-compatible (matrice GesTock) ─────────────────────────────────
-- Sans ce seed, deny-by-default retirerait aux CAISSIER/MAGASINIER des
-- capacités qu'ils avaient avant (ouvrir/fermer caisse, transferts, pertes).
-- Les actions « ⚠️ contrôlé » (ventes.annuler, stock.ajuster) restent
-- volontairement NON seedées : elles doivent être accordées explicitement.

-- CAISSIER : ouvre et ferme sa caisse, enregistre ses mouvements.
INSERT INTO "ActionPermission" ("id", "role", "metier", "action", "allowed")
SELECT md5(random()::text || clock_timestamp()::text || g.metier || 'CAISSIER' || a.action),
       'CAISSIER', g.metier, a.action, true
FROM (VALUES ('supermarche'), ('boutique'), ('depot')) AS g(metier)
CROSS JOIN (VALUES ('caisse.ouvrir'), ('caisse.fermer'), ('caisse.mouvement')) AS a(action)
ON CONFLICT ("role", "metier", "action") DO NOTHING;

-- MAGASINIER : transferts et signalement de pertes/avaries.
-- stock.ajuster (⚠️ contrôlé) n'est PAS accordé par défaut.
INSERT INTO "ActionPermission" ("id", "role", "metier", "action", "allowed")
SELECT md5(random()::text || clock_timestamp()::text || g.metier || 'MAGASINIER' || a.action),
       'MAGASINIER', g.metier, a.action, true
FROM (VALUES ('supermarche'), ('boutique'), ('depot')) AS g(metier)
CROSS JOIN (VALUES ('stock.transferer'), ('stock.avarie')) AS a(action)
ON CONFLICT ("role", "metier", "action") DO NOTHING;
