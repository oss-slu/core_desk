/*
  Warnings:

  - You are about to drop the column `logoKey` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `logoName` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "logoKey",
DROP COLUMN "logoName",
DROP COLUMN "logoUrl";
