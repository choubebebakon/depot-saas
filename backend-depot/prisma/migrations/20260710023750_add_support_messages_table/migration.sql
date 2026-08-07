-- CreateEnum
CREATE TYPE "TypeMessageSupport" AS ENUM ('BUG', 'SUGGESTION', 'QUESTION');

-- CreateEnum
CREATE TYPE "StatutMessageSupport" AS ENUM ('A_TRAITER', 'EN_COURS', 'RESOLU');

-- AlterTable
ALTER TABLE "Paiement" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TypeMessageSupport" NOT NULL,
    "statut" "StatutMessageSupport" NOT NULL DEFAULT 'A_TRAITER',
    "pageUrl" TEXT,
    "userAgent" TEXT,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportMessage_tenantId_idx" ON "SupportMessage"("tenantId");

-- CreateIndex
CREATE INDEX "SupportMessage_userId_idx" ON "SupportMessage"("userId");

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
