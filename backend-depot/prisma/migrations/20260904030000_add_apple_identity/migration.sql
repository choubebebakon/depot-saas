CREATE TABLE "AppleIdentity" (
  "id" TEXT NOT NULL,
  "appleSub" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppleIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppleIdentity_appleSub_key" ON "AppleIdentity"("appleSub");
CREATE UNIQUE INDEX "AppleIdentity_userId_key" ON "AppleIdentity"("userId");
CREATE INDEX "AppleIdentity_userId_idx" ON "AppleIdentity"("userId");
