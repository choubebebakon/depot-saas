import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function testTransaction() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is missing');
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Starting transaction test...');
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: 'Test Transaction Tenant',
          plan: 'TRIAL',
          status: 'ACTIVE',
          maxDepots: 1,
          subscriptionEnd: new Date(),
        },
      });
      console.log('Tenant created:', tenant.id);

      // Rollback intentionally to not mess up the DB
      throw new Error('INTENTIONAL_ROLLBACK');
    });
  } catch (error: any) {
    if (error.message === 'INTENTIONAL_ROLLBACK') {
      console.log('Transaction test successful (intentional rollback occurred)');
    } else {
      console.error('Transaction Error:', error);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testTransaction();
