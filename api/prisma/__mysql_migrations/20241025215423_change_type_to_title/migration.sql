/*
  Warnings:

  - You are about to drop the column `type` on the `ResourceType` table. All the data in the column will be lost.
  - Added the required column `title` to the `ResourceType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ResourceType`
CHANGE COLUMN `type` `title` VARCHAR(191) NOT NULL;