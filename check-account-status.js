require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.user.findUnique({ where: { email: 'choubebebakon@gmail.com' }, select: { email: true, isActive: true, role: true, isSuperAdmin: true, tenantId: true } })
  .then(r => { console.log(r); return prisma.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
