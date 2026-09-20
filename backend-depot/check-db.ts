import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    where: { role: 'PATRON' as any },
    select: { id: true, email: true, depotId: true, tenantId: true },
    take: 10
  });
  console.log('PATRON users:', JSON.stringify(users, null, 2));

  const depots = await p.depot.findMany({
    select: { id: true, nom: true, isArchived: true, tenantId: true },
    take: 10
  });
  console.log('Depots:', JSON.stringify(depots, null, 2));
}

main().finally(() => p.$disconnect());
