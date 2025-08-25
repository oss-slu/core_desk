/*
  Warnings:

  - You are about to drop the column `msdsFileKey` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `msdsFileName` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `msdsFileType` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `msdsFileUrl` on the `Material` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Material" DROP COLUMN "msdsFileKey",
DROP COLUMN "msdsFileName",
DROP COLUMN "msdsFileType",
DROP COLUMN "msdsFileUrl";
