-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceAmount" DOUBLE PRECISION NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformMetricSnapshot" (
    "id" TEXT NOT NULL,
    "totalMrr" DOUBLE PRECISION NOT NULL,
    "activeTenants" INTEGER NOT NULL,
    "trialTenants" INTEGER NOT NULL,
    "suspendedTenants" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
