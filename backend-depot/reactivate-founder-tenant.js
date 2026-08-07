require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.tenant.update({
  where: { id: '5b68ac88-03d2-4b80-87fa-5614187edab0' },
  data: {
    status: 'ACTIVE',
    statutAbonnement: 'ACTIVE',
    estActif: true,
    planType: 'ENTERPRISE',
    subscriptionEnd: new Date('2030-01-01'),
    dateExpiration: new Date('2030-01-01'),
  }
})
  .then(r => { console.log('Tenant réactivé:', r); return prisma.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
