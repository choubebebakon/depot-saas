require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, client_encoding: 'UTF8' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * SCRIPT DE PREVISUALISATION - AUCUNE ECRITURE EN BASE.
 * Calcule le subscriptionStatus/trialEndsAt/currentPeriodEnd cible pour
 * chaque tenant selon la regle de precedence validee, et affiche un
 * tableau avant/apres pour revue manuelle avant tout backfill reel.
 */

function computeTarget(tenant, hasSuccessPayment) {
  const now = new Date();
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
  let trialEndsAt = tenant.trialEndsAt ?? tenant.dateEssaiFin ?? null;
  let currentPeriodEnd =
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
      planType: true,
    },
  });

  const paymentCounts = await prisma.payment.groupBy({
    by: ['tenantId'],
    where: { status: 'SUCCESS' },
    _count: { _all: true },
  });
  const tenantsWithPayment = new Set(paymentCounts.map((p) => p.tenantId));

  const rows = [];
  let conflicts = 0;

  for (const tenant of tenants) {
    const hasPayment = tenantsWithPayment.has(tenant.id);
    const target = computeTarget(tenant, hasPayment);

    const isConflict = tenant.subscriptionStatus !== target.subscriptionStatus;
    if (isConflict) conflicts++;

    rows.push({
      tenant: tenant.nomEntreprise || tenant.name || tenant.id,
      id: tenant.id,
      '--- ANCIEN ---': '',
      status: tenant.status,
      statutAbonnement: tenant.statutAbonnement,
      estActif: tenant.estActif,
      subscriptionStatus_actuel: tenant.subscriptionStatus,
      '--- CIBLE ---': '',
      subscriptionStatus_cible: target.subscriptionStatus,
      trialEndsAt_cible: target.trialEndsAt,
      currentPeriodEnd_cible: target.currentPeriodEnd,
      CONFLIT: isConflict ? '⚠️  OUI' : 'non',
    });
  }

  console.table(rows);
  console.log(`\nTotal tenants: ${tenants.length}`);
  console.log(`Conflits (subscriptionStatus actuel ≠ cible calculée): ${conflicts}`);
  console.log('\nAucune écriture effectuée — ceci est un aperçu uniquement.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});