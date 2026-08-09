require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Corrige le desync estActif vs status/statutAbonnement :
 * remet estActif=true pour tout tenant dont status/statutAbonnement
 * n'est PAS EXPIRED (donc ne devrait pas etre bloque a la connexion).
 * N'affecte AUCUN tenant reellement EXPIRED.
 */
async function main() {
  const result = await prisma.tenant.updateMany({
    where: {
      estActif: false,
      status: { not: 'EXPIRED' },
      statutAbonnement: { not: 'EXPIRED' },
    },
    data: { estActif: true },
  });

  console.log(`Tenants corriges (estActif remis a true): ${result.count}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});