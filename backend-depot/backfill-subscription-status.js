require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * BACKFILL REEL - ECRIT EN BASE.
 * N'ecrit QUE les nouveaux champs (subscriptionStatus, trialEndsAt,
 * currentPeriodEnd) selon la regle validee en previsualisation.
 * Ne touche JAMAIS aux anciens champs (status, statutAbonnement,
 * estActif, etc.) - approche "expand-and-contract", on les supprimera
 * seulement une fois les guards migres et testes en prod stable.
 *
 * Securite : necessite --confirm en argument pour executer les writes.
 */

function computeTarget(tenant, hasSuccessPayment) {
  const isExpiredSignal =
    tenant.statutAbonnement === 'EXPIRED' ||
    tenant.status === 'EXPIRED' ||
    tenant.estActif === false;

  const isGraceSignal =
    tenant.status === 'GRACE' ||
    tenant.status === 'GRACE_PERIOD' ||
    tenant.statutAbonnement === 'GRACE';

  const isActiveSignal =
    tenant.status === 'ACTIVE' || tenant.statutAbonnement === 'ACTIVE';

  let subscriptionStatus;
  const trialEndsAt = tenant.trialEndsAt ?? tenant.dateEssaiFin ?? null;
  const currentPeriodEnd =
    tenant.currentPeriodEnd ?? tenant.subscriptionEnd ?? tenant.dateExpiration ?? null;

  if (isExpiredSignal) {
    subscriptionStatus = tenant.lastPaymentId || hasSuccessPayment ? 'CANCELED' : 'TRIAL_EXPIRED';
  } else if (isGraceSignal) {
    subscriptionStatus = 'PAST_DUE';
  } else if (hasSuccessPayment || isActiveSignal) {
    subscriptionStatus = 'ACTIVE';
  } else {
    subscriptionStatus = 'TRIALING';
  }

  return { subscriptionStatus, trialEndsAt, currentPeriodEnd };
}

async function main() {
  const confirmed = process.argv.includes('--confirm');
  if (!confirmed) {
    console.log('DRY-RUN (ajoute --confirm pour ecrire reellement en base).\n');
  }

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      nomEntreprise: true,
      status: true,
      statutAbonnement: true,
      subscriptionStatus: true,
      estActif: true,
      lastPaymentId: true,
      trialEndsAt: true,
      dateEssaiFin: true,
      currentPeriodEnd: true,
      subscriptionEnd: true,
      dateExpiration: true,
    },
  });

  const paymentCounts = await prisma.payment.groupBy({
    by: ['tenantId'],
    where: { status: 'SUCCESS' },
    _count: { _all: true },
  });
  const tenantsWithPayment = new Set(paymentCounts.map((p) => p.tenantId));

  let updated = 0;
  for (const tenant of tenants) {
    const hasPayment = tenantsWithPayment.has(tenant.id);
    const target = computeTarget(tenant, hasPayment);

    const label = tenant.nomEntreprise || tenant.name || tenant.id;
    console.log(
      `${label} (${tenant.id}) -> subscriptionStatus=${target.subscriptionStatus}, trialEndsAt=${target.trialEndsAt}, currentPeriodEnd=${target.currentPeriodEnd}`,
    );

    if (confirmed) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: target.subscriptionStatus,
          trialEndsAt: target.trialEndsAt,
          currentPeriodEnd: target.currentPeriodEnd,
        },
      });
      updated++;
    }
  }

  console.log(`\n${confirmed ? 'Tenants mis a jour' : 'Tenants qui seraient mis a jour'}: ${confirmed ? updated : tenants.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});