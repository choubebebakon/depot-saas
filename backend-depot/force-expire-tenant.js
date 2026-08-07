require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const tenantId = process.argv[2];
if (!tenantId) { console.error('Usage: node force-expire-tenant.js <tenantId>'); process.exit(1); }

prisma.tenant.update({
  where: { id: tenantId },
  data: { status: 'EXPIRED', statutAbonnement: 'EXPIRED' }
})
  .then(r => { console.log('Tenant force EXPIRED:', r.name); return prisma.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
