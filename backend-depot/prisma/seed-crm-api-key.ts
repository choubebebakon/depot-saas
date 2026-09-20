/**
 * Provisionnement d'une clé d'API CRM (usage unique en console).
 *
 * La clé brute n'est affichée qu'une seule fois : seule son empreinte
 * HMAC-SHA256 est persistée en base. Si elle est perdue, il faut en générer
 * une nouvelle et révoquer l'ancienne.
 *
 * Usage :
 *   npm run seed:crm-key -- <tenantId|emailPatron> ["Libellé de la clé"]
 *
 * Prérequis : CRM_API_KEY_PEPPER doit être défini (le script échoue sinon,
 * exactement comme l'application en production).
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { CrmApiKeyService } from '../src/crm/crm-api-key.service';
import { CrmLogger } from '../src/crm/crm-logger.service';
import type { PrismaService } from '../src/prisma.service';

dotenv.config();

async function main(): Promise<void> {
  const tenantRef = process.argv[2];
  const label = process.argv[3] ?? "Agent IA omnicanal GesTock";

  if (!tenantRef) {
    console.error(
      'Usage : npm run seed:crm-key -- <tenantId|emailPatron> ["Libellé"]',
    );
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const tenant = await prisma.tenant.findFirst({
      where: { OR: [{ id: tenantRef }, { emailPatron: tenantRef }] },
      select: { id: true, nomEntreprise: true },
    });

    if (!tenant) {
      console.error(`Aucun tenant trouvé pour « ${tenantRef} ».`);
      process.exitCode = 1;
      return;
    }

    // Le service n'accède qu'à `prisma.tenant` et `prisma.crmApiKey` : le client
    // brut suffit hors contexte NestJS (aucun scope dépôt n'est nécessaire ici).
    const service = new CrmApiKeyService(
      prisma as unknown as PrismaService,
      new CrmLogger(),
    );

    const created = await service.createApiKey({
      tenantId: tenant.id,
      label,
    });

    console.log('');
    console.log('Clé d’API CRM créée (affichée une seule fois) :');
    console.log(`  tenant   : ${tenant.nomEntreprise ?? tenant.id} (${tenant.id})`);
    console.log(`  libellé  : ${label}`);
    console.log(`  préfixe  : ${created.keyPrefix}`);
    console.log(`  clé      : ${created.raw}`);
    console.log('');
    console.log(
      'Transmettez cette clé à l’orchestrateur IA (en-tête x-api-key). Elle ne pourra plus être relue depuis la base.',
    );
    console.log('');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main().catch((error) => {
  console.error('Échec du provisionnement de la clé CRM :', error);
  process.exitCode = 1;
});