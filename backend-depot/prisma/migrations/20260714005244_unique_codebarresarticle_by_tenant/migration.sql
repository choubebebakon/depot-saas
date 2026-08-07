/*
  Warnings:

  - Made the column `billingCycle` on table `Tenant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SubscriptionAlert" DROP CONSTRAINT "SubscriptionAlert_tenantId_fkey";

-- AlterTable
ALTER TABLE "SubscriptionAlert" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "billingCycle" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SubscriptionAlert" ADD CONSTRAINT "SubscriptionAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
