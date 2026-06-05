import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const tenants = await prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    console.log('Recent Tenants:', JSON.stringify(tenants, null, 2));

    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    console.log('Recent Users:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Prisma Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
