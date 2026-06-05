import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- INSPECTION JOURNAL AUDIT ---');

  const total = await prisma.journalAudit.count();
  console.log(`Nombre total d'audits : ${total}`);

  const audits = await prisma.journalAudit.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  audits.forEach(a => {
    console.log(`[${a.createdAt.toISOString()}] ${a.action} - ${a.description} (Tenant: ${a.tenantId}, Depot: ${a.depotId})`);
  });

  console.log('--- FIN INSPECTION ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
