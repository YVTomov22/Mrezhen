-- AlterTable
ALTER TABLE "User" ADD COLUMN     "region" TEXT NOT NULL DEFAULT 'global';

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE INDEX "User_score_idx" ON "User"("score" DESC);

-- CreateIndex
CREATE INDEX "User_region_score_idx" ON "User"("region", "score" DESC);

-- CreateIndex
CREATE INDEX "User_isDeactivated_score_idx" ON "User"("isDeactivated", "score" DESC);
