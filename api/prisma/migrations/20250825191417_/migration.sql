/*
  Warnings:

  - You are about to drop the column `fileKey` on the `ResourceImage` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `ResourceImage` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `ResourceImage` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `ResourceImage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ResourceImage" DROP COLUMN "fileKey",
DROP COLUMN "fileName",
DROP COLUMN "fileType",
DROP COLUMN "fileUrl";
