-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "metier" TEXT NOT NULL,
    "sousModule" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_role_metier_sousModule_key" ON "Permission"("role", "metier", "sousModule");
