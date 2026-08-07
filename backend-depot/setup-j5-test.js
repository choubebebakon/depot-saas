require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const inFiveDays = new Date();
inFiveDays.setDate(inFiveDays.getDate() + 5);

prisma.tenant.update({
  where: { id: '30f6bac0-56c1-4941-861c-6a03523cb6cd' },
  data: { 
    status: 'TRIAL',
    statutAbonnement: 'TRIAL',
    dateEssaiFin: inFiveDays,
    lastAlertSentAt: null
  }
})
  .then(r => { console.log('Tenant configure pour test J-5, expiration:', r.dateEssaiFin); return prisma.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
