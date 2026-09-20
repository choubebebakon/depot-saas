const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
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
  console.log('\n=== All Depots ===');
  depots.forEach(d => console.log(JSON.stringify(d)));

  console.log('\n=== Depot access check for each PATRON ===');
  for (const u of users) {
    if (u.depotId) {
      const depot = await p.depot.findFirst({ where: { id: u.depotId } });
      if (!depot) {
        console.log(`PROBLEM: PATRON ${u.email} has depotId=${u.depotId} but depot NOT FOUND!`);
      } else if (depot.isArchived) {
        console.log(`PROBLEM: PATRON ${u.email} has depotId=${u.depotId} but depot IS ARCHIVED!`);
      } else {
        console.log(`OK: PATRON ${u.email} -> depot "${depot.nom}" (active)`);
      }
    } else {
      // PATRON has no depotId in DB - check if depots exist for tenant
      const tenantDepots = await p.depot.findMany({
        where: { tenantId: u.tenantId },
        select: { id: true, nom: true, isArchived: true }
      });
      console.log(`INFO: PATRON ${u.email} has NO depotId. Tenant depots: ${JSON.stringify(tenantDepots)}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
