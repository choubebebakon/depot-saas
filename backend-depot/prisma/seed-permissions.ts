import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type PermissionSeed = {
  role: Role;
  metier: 'supermarche' | 'boutique' | 'depot';
  sousModule: string;
  canRead: boolean;
  canWrite: boolean;
};

const permissions: PermissionSeed[] = [
  // Supermarche
  { role: Role.MAGASINIER, metier: 'supermarche', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.MAGASINIER, metier: 'supermarche', sousModule: 'stock', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'supermarche', sousModule: 'rayons', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'supermarche', sousModule: 'fournisseurs', canRead: true, canWrite: false },
  { role: Role.MAGASINIER, metier: 'supermarche', sousModule: 'receptions', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'supermarche', sousModule: 'inventaire', canRead: true, canWrite: true },
  { role: Role.CAISSIER, metier: 'supermarche', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.CAISSIER, metier: 'supermarche', sousModule: 'pos_caisse', canRead: true, canWrite: true },
  { role: Role.CAISSIER, metier: 'supermarche', sousModule: 'clients', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'supermarche', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'supermarche', sousModule: 'stock', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'supermarche', sousModule: 'fournisseurs', canRead: true, canWrite: true },
  { role: Role.COMPTABLE, metier: 'supermarche', sousModule: 'receptions', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'supermarche', sousModule: 'inventaire', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'supermarche', sousModule: 'depenses', canRead: true, canWrite: true },
  { role: Role.COMPTABLE, metier: 'supermarche', sousModule: 'rapports', canRead: true, canWrite: true },
  { role: Role.COMMERCIAL, metier: 'supermarche', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.COMMERCIAL, metier: 'supermarche', sousModule: 'promotions', canRead: true, canWrite: true },
  { role: Role.COMMERCIAL, metier: 'supermarche', sousModule: 'clients', canRead: true, canWrite: true },
  { role: Role.COMMERCIAL, metier: 'supermarche', sousModule: 'rapports', canRead: true, canWrite: false },

  // Boutique
  { role: Role.MAGASINIER, metier: 'boutique', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.MAGASINIER, metier: 'boutique', sousModule: 'ventes', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'boutique', sousModule: 'stock', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'boutique', sousModule: 'inventaire', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'boutique', sousModule: 'clients', canRead: true, canWrite: false },
  { role: Role.MAGASINIER, metier: 'boutique', sousModule: 'categories', canRead: true, canWrite: true },
  { role: Role.CAISSIER, metier: 'boutique', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.CAISSIER, metier: 'boutique', sousModule: 'ventes', canRead: true, canWrite: true },
  { role: Role.CAISSIER, metier: 'boutique', sousModule: 'clients', canRead: true, canWrite: false },
  { role: Role.CAISSIER, metier: 'boutique', sousModule: 'caisse', canRead: true, canWrite: true },
  { role: Role.CAISSIER, metier: 'boutique', sousModule: 'factures', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'boutique', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'boutique', sousModule: 'stock', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'boutique', sousModule: 'inventaire', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'boutique', sousModule: 'factures', canRead: true, canWrite: true },
  { role: Role.COMPTABLE, metier: 'boutique', sousModule: 'fournisseurs', canRead: true, canWrite: true },
  { role: Role.COMPTABLE, metier: 'boutique', sousModule: 'depenses', canRead: true, canWrite: true },
  { role: Role.COMPTABLE, metier: 'boutique', sousModule: 'rapports', canRead: true, canWrite: true },
  { role: Role.COMMERCIAL, metier: 'boutique', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.COMMERCIAL, metier: 'boutique', sousModule: 'ventes', canRead: true, canWrite: false },
  { role: Role.COMMERCIAL, metier: 'boutique', sousModule: 'clients', canRead: true, canWrite: true },
  { role: Role.COMMERCIAL, metier: 'boutique', sousModule: 'promotions', canRead: true, canWrite: true },
  { role: Role.COMMERCIAL, metier: 'boutique', sousModule: 'rapports', canRead: true, canWrite: false },

  // Depot boissons
  { role: Role.MAGASINIER, metier: 'depot', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.MAGASINIER, metier: 'depot', sousModule: 'stock_articles', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'depot', sousModule: 'inventaire', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'depot', sousModule: 'consignes', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'depot', sousModule: 'livraisons', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'depot', sousModule: 'tournees', canRead: true, canWrite: true },
  { role: Role.MAGASINIER, metier: 'depot', sousModule: 'fournisseurs', canRead: true, canWrite: false },
  { role: Role.CAISSIER, metier: 'depot', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.CAISSIER, metier: 'depot', sousModule: 'consignes', canRead: true, canWrite: false },
  { role: Role.CAISSIER, metier: 'depot', sousModule: 'clients', canRead: true, canWrite: false },
  { role: Role.CAISSIER, metier: 'depot', sousModule: 'ventes', canRead: true, canWrite: true },
  { role: Role.CAISSIER, metier: 'depot', sousModule: 'caisse', canRead: true, canWrite: true },
  { role: Role.COMPTABLE, metier: 'depot', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'depot', sousModule: 'stock_articles', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'depot', sousModule: 'inventaire', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'depot', sousModule: 'consignes', canRead: true, canWrite: false },
  { role: Role.COMPTABLE, metier: 'depot', sousModule: 'fournisseurs', canRead: true, canWrite: true },
  { role: Role.COMPTABLE, metier: 'depot', sousModule: 'depenses', canRead: true, canWrite: true },
  { role: Role.COMPTABLE, metier: 'depot', sousModule: 'rapports', canRead: true, canWrite: true },
  { role: Role.COMMERCIAL, metier: 'depot', sousModule: 'dashboard', canRead: true, canWrite: false },
  { role: Role.COMMERCIAL, metier: 'depot', sousModule: 'clients', canRead: true, canWrite: true },
  { role: Role.COMMERCIAL, metier: 'depot', sousModule: 'ventes', canRead: true, canWrite: false },
  { role: Role.COMMERCIAL, metier: 'depot', sousModule: 'rapports', canRead: true, canWrite: false },
];

async function main() {
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

  console.log(`${permissions.length} permissions granularisees inserees.`);
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
