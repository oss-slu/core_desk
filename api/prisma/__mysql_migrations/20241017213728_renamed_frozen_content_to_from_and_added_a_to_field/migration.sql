/*
  Warnings:

  - You are about to drop the column `frozenContent` on the `logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `logs` DROP COLUMN `frozenContent`,
    ADD COLUMN `from` MEDIUMTEXT NULL,
    ADD COLUMN `to` MEDIUMTEXT NULL;
