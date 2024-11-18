/*
  Warnings:

  - You are about to drop the column `file` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileId` on the `JobItem` table. All the data in the column will be lost.
  - Added the required column `fileKey` to the `JobItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `JobItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `JobItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `JobItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `JobItem` DROP COLUMN `file`,
    DROP COLUMN `fileId`,
    ADD COLUMN `fileKey` VARCHAR(191) NOT NULL,
    ADD COLUMN `fileName` VARCHAR(191) NOT NULL,
    ADD COLUMN `fileType` VARCHAR(191) NOT NULL,
    ADD COLUMN `fileUrl` VARCHAR(191) NOT NULL;
