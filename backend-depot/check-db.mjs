import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

try {
  const users = await p.user.findMany({
    where: { role: 'PATRON' },
    select: { id: true, email: true, role: true, depotId: true, tenantId: true },
    take: 10
  });
  console.log('=== PATRON users ===');
  users.forEach(u => console.log(JSON.stringify(u)));

  const depots = await p.depot.findMany({
    select: { id: true, nom: true, isArchived: true, tenantId: true },
    take: 10
  });
  console.log('=== Depots ===');
  depots.forEach(d => console.log(JSON.stringify(d)));

  // Check if any PATRON user has a depotId that is archived or doesn't exist
  for (const u of users) {
    if (u.depotId) {
      const depot = await p.depot.findFirst({ where: { id: u.depotId } });
      if (!depot) {
        console.log(`PROBLEM: PATRON ${u.email} has depotId ${u.depotId} but depot NOT FOUND in DB!`);
      } else if (depot.isArchived) {
        console.log(`PROBLEM: PATRON ${u.email} has depotId ${u.depotId} but depot IS ARCHIVED!`);
      } else {
        console.log(`OK: PATRON ${u.email} -> depot "${depot.nom}" (active, tenantId=${depot.tenantId})`);
      }
    } else {
      console.log(`INFO: PATRON ${u.email} has NO depotId (null)`);
    }
  }
} finally {
  await p.$disconnect();
}
