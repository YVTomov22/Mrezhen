-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN "category" TEXT;

-- CreateIndex
CREATE INDEX "Milestone_category_idx" ON "Milestone"("category");

-- CreateIndex
CREATE INDEX "Milestone_userId_category_idx" ON "Milestone"("userId", "category");
