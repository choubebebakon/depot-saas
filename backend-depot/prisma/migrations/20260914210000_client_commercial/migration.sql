-- S7 - Perimetre individuel du commercial : chaque client est rattache au
-- commercial qui la cree (mes clients). Les ventes tracent deja leur
-- createur via Vente.createurId (mes ventes).

ALTER TABLE "Client" ADD COLUMN "commercialId" TEXT;
CREATE INDEX "Client_commercialId_idx" ON "Client"("commercialId");
ALTER TABLE "Client" ADD CONSTRAINT "Client_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
