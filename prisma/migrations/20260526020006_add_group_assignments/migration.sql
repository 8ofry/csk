/*
  Warnings:

  - You are about to drop the column `internId` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `levelBand` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `primaryCoachId` on the `Group` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_internId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_primaryCoachId_fkey";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "internId",
DROP COLUMN "levelBand",
DROP COLUMN "primaryCoachId",
ADD COLUMN     "levelBands" "LevelBand"[];

-- CreateTable
CREATE TABLE "GroupCoachAssignment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "levels" "LevelBand"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupCoachAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupInternAssignment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupInternAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupCoachAssignment_coachId_idx" ON "GroupCoachAssignment"("coachId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupCoachAssignment_groupId_coachId_key" ON "GroupCoachAssignment"("groupId", "coachId");

-- CreateIndex
CREATE INDEX "GroupInternAssignment_internId_idx" ON "GroupInternAssignment"("internId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInternAssignment_groupId_internId_key" ON "GroupInternAssignment"("groupId", "internId");

-- AddForeignKey
ALTER TABLE "GroupCoachAssignment" ADD CONSTRAINT "GroupCoachAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupCoachAssignment" ADD CONSTRAINT "GroupCoachAssignment_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInternAssignment" ADD CONSTRAINT "GroupInternAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInternAssignment" ADD CONSTRAINT "GroupInternAssignment_internId_fkey" FOREIGN KEY ("internId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
