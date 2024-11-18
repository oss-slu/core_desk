/*
  Warnings:

  - You are about to drop the column `type` on the `Material` table. All the data in the column will be lost.
  - Added the required column `title` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Material` DROP COLUMN `type`,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;
