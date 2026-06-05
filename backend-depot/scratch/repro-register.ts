import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function testRegister() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const email = 'test' + Date.now() + '@example.com';
    const password = await bcrypt.hash('password123', 12);

    console.log('Attempting register transaction...');
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: 'Test Tenant',
          plan: 'TRIAL',
          status: 'ACTIVE',
          maxDepots: 1,
          subscriptionEnd: new Date(),
        },
      });
      console.log('Tenant created:', tenant.id);

      await tx.depot.create({
        data: {
          name: 'Depot principal',
          tenantId: tenant.id,
        },
      });
      console.log('Depot created');

      const user = await tx.user.create({
        data: {
          email,
          password,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });
      console.log('User created:', user.id);
    });
    console.log('Register successful!');
  } catch (error: any) {
    console.error('Register Error:', error);
    if (error.code) console.error('Error Code:', error.code);
    if (error.meta) console.error('Error Meta:', JSON.stringify(error.meta, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testRegister();
