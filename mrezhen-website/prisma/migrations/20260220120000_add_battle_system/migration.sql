-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DECLINED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "challengedId" TEXT NOT NULL,
    "challengerMilestoneId" TEXT,
    "challengedMilestoneId" TEXT,
    "goalDescription" TEXT NOT NULL,
    "status" "BattleStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "challengerXP" INTEGER NOT NULL DEFAULT 0,
    "challengedXP" INTEGER NOT NULL DEFAULT 0,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleDailyQuest" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "proofText" TEXT,
    "proofImageUrl" TEXT,
    "verification" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattleDailyQuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Battle_challengerId_idx" ON "Battle"("challengerId");

-- CreateIndex
CREATE INDEX "Battle_challengedId_idx" ON "Battle"("challengedId");

-- CreateIndex
CREATE INDEX "Battle_status_idx" ON "Battle"("status");

-- CreateIndex
CREATE INDEX "Battle_endDate_idx" ON "Battle"("endDate");

-- CreateIndex
CREATE INDEX "Battle_challengerId_challengedId_idx" ON "Battle"("challengerId", "challengedId");

-- CreateIndex
CREATE UNIQUE INDEX "BattleDailyQuest_battleId_userId_day_key" ON "BattleDailyQuest"("battleId", "userId", "day");

-- CreateIndex
CREATE INDEX "BattleDailyQuest_battleId_idx" ON "BattleDailyQuest"("battleId");

-- CreateIndex
CREATE INDEX "BattleDailyQuest_userId_idx" ON "BattleDailyQuest"("userId");

-- CreateIndex
CREATE INDEX "BattleDailyQuest_battleId_userId_idx" ON "BattleDailyQuest"("battleId", "userId");

-- CreateIndex
CREATE INDEX "BattleDailyQuest_verification_idx" ON "BattleDailyQuest"("verification");

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_challengedId_fkey" FOREIGN KEY ("challengedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_challengerMilestoneId_fkey" FOREIGN KEY ("challengerMilestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_challengedMilestoneId_fkey" FOREIGN KEY ("challengedMilestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleDailyQuest" ADD CONSTRAINT "BattleDailyQuest_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleDailyQuest" ADD CONSTRAINT "BattleDailyQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
