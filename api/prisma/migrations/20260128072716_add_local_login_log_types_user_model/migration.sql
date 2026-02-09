-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LogType" ADD VALUE 'USER_LOGIN_LOCAL';
ALTER TYPE "public"."LogType" ADD VALUE 'USER_PASSWORD_SET';
ALTER TYPE "public"."LogType" ADD VALUE 'USER_LOGIN_FAILURE';

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "password" TEXT,
ALTER COLUMN "simple" SET DEFAULT true;
