-- CreateEnum
CREATE TYPE "FightClass" AS ENUM ('AMATEUR', 'SEMI_PRO', 'PROFESSIONAL');

-- AlterEnum
ALTER TYPE "ChampRegistrationStatus" ADD VALUE 'PENDING_VERIFICATION';

-- AlterTable
ALTER TABLE "ChampionshipRegistration" ADD COLUMN     "fightClass" "FightClass",
ADD COLUMN     "instapayRef" TEXT,
ADD COLUMN     "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentReceiptUrl" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "registrationNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "academyId" TEXT,
ADD COLUMN     "isExternal" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Academy" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Academy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "fighter1Id" TEXT NOT NULL,
    "fighter2Id" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "fightClass" "FightClass" NOT NULL,
    "weightClass" TEXT,
    "round" INTEGER,
    "outcome" "FightOutcome",
    "method" "FightMethod",
    "timeInRound" TEXT,
    "videoUrl" TEXT,
    "notes" TEXT,
    "winnerId" TEXT,
    "scheduledTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_championshipId_idx" ON "Match"("championshipId");

-- CreateIndex
CREATE INDEX "Match_fighter1Id_idx" ON "Match"("fighter1Id");

-- CreateIndex
CREATE INDEX "Match_fighter2Id_idx" ON "Match"("fighter2Id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_fighter1Id_fkey" FOREIGN KEY ("fighter1Id") REFERENCES "ChampionshipRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_fighter2Id_fkey" FOREIGN KEY ("fighter2Id") REFERENCES "ChampionshipRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "ChampionshipRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
