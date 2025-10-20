/*
  Warnings:

  - You are about to drop the column `simple` on the `UserShop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserShop" DROP COLUMN "simple";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "simple" BOOLEAN NOT NULL DEFAULT true;
