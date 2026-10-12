CREATE SEQUENCE "Job_jobNumber_seq";

ALTER TABLE "Job" ADD COLUMN "jobNumber" INTEGER;

UPDATE "Job"
SET "jobNumber" = nextval('"Job_jobNumber_seq"')
WHERE "jobNumber" IS NULL;

ALTER TABLE "Job" ALTER COLUMN "jobNumber" SET NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "jobNumber" SET DEFAULT nextval('"Job_jobNumber_seq"'::regclass);

ALTER SEQUENCE "Job_jobNumber_seq" OWNED BY "Job"."jobNumber";

CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");
