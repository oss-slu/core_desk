/*
  Warnings:

  - Made the column `active` on table `ResourceImage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ResourceImage` MODIFY `active` BOOLEAN NOT NULL DEFAULT true;
