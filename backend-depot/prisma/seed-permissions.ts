import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
// Source unique de verite des sous-modules d'administration tenant (§23).
import { ADMINISTRATION_SUBMODULES } from '../src/auth/permissions.config';
// Source unique de verite de la matrice de permissions (§11/§21/§23) : le meme
// fichier alimente les tests `src/auth/rbac-matrix.spec.ts`.
import { PERMISSION_SEED } from '../src/auth/seed-permissions.data';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const permissions = PERMISSION_SEED;

async function main() {
  // Upsert : corrige aussi les flags (ex. MAGASINIER boutique 'ventes' passe de
  // canWrite=true a canWrite=false -> consultation seule).
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        role_metier_sousModule: {
          role: permission.role,
          metier: permission.metier,
          sousModule: permission.sousModule,
        },
      },
      update: {
        canRead: permission.canRead,
        canWrite: permission.canWrite,
      },
      create: permission,
    });
  }

  // §10 — purge des anciennes lignes 'rapports' (financier, monolithique) des
  // roles qui ne doivent plus y acceder : MAGASINIER -> rapports_stock,
  // COMMERCIAL -> rapports_performance. Sans cette purge, la granularite
  // resterait inoperante pour les bases deja seedees.
  const removedRapports = await prisma.permission.deleteMany({
    where: {
      role: { in: [Role.CAISSIER, Role.MAGASINIER, Role.COMMERCIAL] },
      sousModule: 'rapports',
    },
  });

  // §23 — 'utilisateurs', 'depots', 'abonnement', 'parametres' et
  // 'administration' sont des sous-modules d'ADMINISTRATION_TENANT :
  // PermissionService les refuse d'office a tout role autre que PATRON (regle
  // en code). On purge les lignes residuelles pour qu'aucune autorisation
  // d'administration tenant fantome ne subsiste en base (no-op fonctionnel :
  // la garde refusait deja ces lignes).
  const removedAdminTenant = await prisma.permission.deleteMany({
    where: {
      role: { not: Role.PATRON },
      sousModule: { in: [...ADMINISTRATION_SUBMODULES] },
    },
  });

  console.log(`${permissions.length} permissions granularisees inserees.`);
  console.log(
    `${removedRapports.count} anciennes lignes 'rapports' retirees (§10).`,
  );
  console.log(
    `${removedAdminTenant.count} lignes d'administration tenant retirees (§23).`,
  );
}

main()
  .catch((error) => {
    console.error('Erreur seed permissions:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
