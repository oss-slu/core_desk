CREATE TABLE "JobAssignment" (
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("jobId", "userId")
);

CREATE INDEX "JobAssignment_userId_idx" ON "JobAssignment"("userId");

ALTER TABLE "JobAssignment"
ADD CONSTRAINT "JobAssignment_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobAssignment"
ADD CONSTRAINT "JobAssignment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
