require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ids = ['30f6bac0-56c1-4941-861c-6a03523cb6cd', '2ad774ea-6343-4314-80d3-165bfe57c3be', 'db8b58b3-b0fc-4e99-8b86-3ee8b7db05a9'];

prisma.tenant.updateMany({
  where: { id: { in: ids } },
  data: { status: 'TRIAL', statutAbonnement: 'TRIAL' }
})
  .then(r => { console.log('Tenants restaures:', r.count); return prisma.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
