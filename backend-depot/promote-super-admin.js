require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const email = process.argv[2];
if (!email) {
  console.error('Usage: node promote-super-admin.js <email>');
  process.exit(1);
}

prisma.user.update({ where: { email }, data: { isSuperAdmin: true } })
  .then(u => { console.log(`✅ ${u.email} est maintenant SUPER_ADMIN`); return prisma.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
