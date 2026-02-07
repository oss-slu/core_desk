-- CreateEnum
CREATE TYPE "StlRenderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "simple" SET DEFAULT true;

-- CreateTable
CREATE TABLE "StlRenderTask" (
    "id" TEXT NOT NULL,
    "jobItemId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileKey" TEXT,
    "status" "StlRenderStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockExpiresAt" TIMESTAMP(3),
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StlRenderTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StlRenderTask" ADD CONSTRAINT "StlRenderTask_jobItemId_fkey" FOREIGN KEY ("jobItemId") REFERENCES "JobItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
