/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `ResourceImage` table. All the data in the column will be lost.
  - Added the required column `fileKey` to the `ResourceImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `ResourceImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `ResourceImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `ResourceImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ResourceImage` DROP COLUMN `imageUrl`,
    ADD COLUMN `fileKey` VARCHAR(191) NOT NULL,
    ADD COLUMN `fileName` VARCHAR(191) NOT NULL,
    ADD COLUMN `fileType` VARCHAR(191) NOT NULL,
    ADD COLUMN `fileUrl` VARCHAR(191) NOT NULL;
