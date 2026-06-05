const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = "Admin123!";
  const hashedPassword = await bcrypt.hash(password, 12);
  const email = "admin@gestock.com";

  console.log('⏳ Création des données initiales...');

  // 1. Créer le Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "GeStock SARL",
      nomEntreprise: "GeStock SARL",
      emailPatron: email,
      status: "ACTIVE",
      statutAbonnement: "ACTIVE",
      plan: "PREMIUM",
      planType: "PREMIUM",
    },
  });

  console.log('✅ Tenant créé:', tenant.id);

  // 2. Créer le Dépôt par défaut
  const depot = await prisma.depot.create({
    data: {
      nom: "Dépôt Principal",
      adresse: "Douala, Cameroun",
      emplacement: "Zone Industrielle",
      tenantId: tenant.id,
    },
  });

  console.log('✅ Dépôt créé:', depot.id);

  // 3. Créer l'utilisateur PATRON
  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      role: "PATRON",
      nom: "Administrateur",
      tenantId: tenant.id,
      depotId: depot.id,
    },
  });

  console.log('✅ Utilisateur Admin créé:', user.email);
  console.log('🚀 Login: admin@gestock.com / Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
