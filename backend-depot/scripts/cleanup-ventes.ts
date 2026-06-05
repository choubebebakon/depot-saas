import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DEBUT NETTOYAGE DES VENTES ---');

  const ventes = await prisma.vente.findMany({
    select: { id: true, reference: true, statut: true, tenantId: true, createurId: true }
  });

  console.log(`Nombre total de ventes : ${ventes.length}`);

  const aSupprimer = ventes.filter(v => v.statut !== 'PAYE');
  console.log(`Ventes à supprimer (non PAYE) : ${aSupprimer.length}`);

  for (const v of aSupprimer) {
    console.log(`Suppression de la vente ${v.reference} (Statut: ${v.statut}, Tenant: ${v.tenantId})`);
    await prisma.vente.delete({ where: { id: v.id } });
  }

  console.log('--- NETTOYAGE TERMINE ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
