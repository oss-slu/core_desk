-- AlterTable
ALTER TABLE "JobItem" ADD COLUMN     "fileEncryptedIv" BYTEA,
ADD COLUMN     "fileEncryptedKey" BYTEA;
