-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "messageFin" TEXT DEFAULT 'Merci de votre fidélité !',
ADD COLUMN     "slogan" TEXT;
