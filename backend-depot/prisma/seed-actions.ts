/**
 * Seed des actions fines (table ActionPermission) — cf. matrice GesTock.
 *
 * Le PermissionGuard est DENY-BY-DEFAULT pour les rôles CAISSIER,
 * MAGASINIER, COMMERCIAL et COMPTABLE (PATRON et GERANT sont autorisés
 * en code). Sans ce seed, ces rôles ne peuvent RIEN faire sur les
 * endpoints protégés par @RequireAction : caisse fermée pour le caissier,
 * transfert de stock impossible pour le magasinier, etc.
 *
 * Convention de la matrice :
 *  ✅  → allowed: true
 *  ❌ / ⚠️-par-défaut (annulation vente, ajustement à autoriser) → ligne
 *      créée avec allowed: false, activable à tout moment par le tenant
 *      (UPDATE ActionPermission SET allowed = true ...).
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Role } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const METIERS = ['supermarche', 'boutique', 'depot'] as const;

type ActionSeed = { role: Role; action: string; allowed: boolean };

/** true = accordé par la matrice ; false = refusé par défaut (activable). */
const ACTIONS: ActionSeed[] = [
  // ── 💰 CAISSIER ─────────────────────────────────────────────
  // Ouvrir caisse ✅ · Fermer sa caisse ✅ · Encaissement/mouvement de caisse ✅
  // Dépenses ❌ · Annuler vente ⚠️ (sur autorisation) · Stock ❌
  { role: Role.CAISSIER, action: 'caisse.ouvrir', allowed: true },
  { role: Role.CAISSIER, action: 'caisse.fermer', allowed: true },
  { role: Role.CAISSIER, action: 'caisse.mouvement', allowed: true },
  { role: Role.CAISSIER, action: 'caisse.depense', allowed: false },
  { role: Role.CAISSIER, action: 'ventes.annuler', allowed: false },
  { role: Role.CAISSIER, action: 'stock.ajuster', allowed: false },
  { role: Role.CAISSIER, action: 'stock.transferer', allowed: false },
  { role: Role.CAISSIER, action: 'stock.avarie', allowed: false },

  // ── 📦 MAGASINIER ───────────────────────────────────────────
  // Entrée/sortie/avarie ✅ · Ajustement ⚠️ contrôlé ✅ · Transfert ✅/⚠️ ✅
  // Caisse ❌ · Annuler vente ❌
  { role: Role.MAGASINIER, action: 'stock.ajuster', allowed: true },
  { role: Role.MAGASINIER, action: 'stock.transferer', allowed: true },
  { role: Role.MAGASINIER, action: 'stock.avarie', allowed: true },
  { role: Role.MAGASINIER, action: 'caisse.ouvrir', allowed: false },
  { role: Role.MAGASINIER, action: 'caisse.fermer', allowed: false },
  { role: Role.MAGASINIER, action: 'caisse.mouvement', allowed: false },
  { role: Role.MAGASINIER, action: 'caisse.depense', allowed: false },
  { role: Role.MAGASINIER, action: 'ventes.annuler', allowed: false },

  // ── 🧑‍💼 COMMERCIAL / VENDEUR ─────────────────────────────────
  // Vente/commande/devis ✅ (via permissions sous-modules) · Caisse ❌
  // Annuler vente ⚠️ · Stock ❌
  { role: Role.COMMERCIAL, action: 'ventes.annuler', allowed: false },
  { role: Role.COMMERCIAL, action: 'caisse.ouvrir', allowed: false },
  { role: Role.COMMERCIAL, action: 'caisse.fermer', allowed: false },
  { role: Role.COMMERCIAL, action: 'caisse.mouvement', allowed: false },
  { role: Role.COMMERCIAL, action: 'caisse.depense', allowed: false },
  { role: Role.COMMERCIAL, action: 'stock.ajuster', allowed: false },
  { role: Role.COMMERCIAL, action: 'stock.transferer', allowed: false },
  { role: Role.COMMERCIAL, action: 'stock.avarie', allowed: false },

  // ── 📊 COMPTABLE ────────────────────────────────────────────
  // Contrôle clôtures ✅ (fermer) · Dépenses ✅ · Caisse ouverture ❌
  // Stock (ajuster/transférer/avarie) ❌ · Annuler vente ❌
  { role: Role.COMPTABLE, action: 'caisse.depense', allowed: true },
  { role: Role.COMPTABLE, action: 'caisse.fermer', allowed: true },
  { role: Role.COMPTABLE, action: 'caisse.ouvrir', allowed: false },
  { role: Role.COMPTABLE, action: 'caisse.mouvement', allowed: false },
  { role: Role.COMPTABLE, action: 'ventes.annuler', allowed: false },
  { role: Role.COMPTABLE, action: 'stock.ajuster', allowed: false },
  { role: Role.COMPTABLE, action: 'stock.transferer', allowed: false },
  { role: Role.COMPTABLE, action: 'stock.avarie', allowed: false },
];

async function main() {
  let inserted = 0;
  for (const metier of METIERS) {
    for (const a of ACTIONS) {
      await prisma.actionPermission.upsert({
        where: {
          role_metier_action: { role: a.role, metier, action: a.action },
        },
        update: { allowed: a.allowed },
        create: { role: a.role, metier, action: a.action, allowed: a.allowed },
      });
      inserted += 1;
    }
  }
  console.log(
    `${inserted} actions seedées (${ACTIONS.length} actions × ${METIERS.length} métiers).`,
  );
  const refusees = await prisma.actionPermission.count({
    where: { allowed: false },
  });
  const accordees = await prisma.actionPermission.count({
    where: { allowed: true },
  });
  console.log(`→ ${accordees} accordées, ${refusees} refusées par défaut.`);
}

main()
  .catch((error) => {
    console.error('Erreur seed actions:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
