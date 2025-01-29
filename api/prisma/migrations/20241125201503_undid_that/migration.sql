/*
  Warnings:

  - You are about to drop the column `fileEncryptedIv` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileEncryptedKey` on the `JobItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobItem" DROP COLUMN "fileEncryptedIv",
DROP COLUMN "fileEncryptedKey";
