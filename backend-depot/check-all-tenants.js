require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.user.findMany({
  select: { email: true, tenant: { select: { id: true, name: true, status: true, statutAbonnement: true, planType: true } } }
})
  .then(r => { console.log(JSON.stringify(r, null, 2)); return prisma.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
