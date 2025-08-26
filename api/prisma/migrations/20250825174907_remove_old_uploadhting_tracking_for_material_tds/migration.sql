/*
  Warnings:

  - You are about to drop the column `tdsFileKey` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `tdsFileName` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `tdsFileType` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `tdsFileUrl` on the `Material` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Material" DROP COLUMN "tdsFileKey",
DROP COLUMN "tdsFileName",
DROP COLUMN "tdsFileType",
DROP COLUMN "tdsFileUrl";
