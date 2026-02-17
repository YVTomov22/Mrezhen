-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoplayVideos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dataSaver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fontSize" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "highContrast" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "reduceMotion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "screenReader" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system';
