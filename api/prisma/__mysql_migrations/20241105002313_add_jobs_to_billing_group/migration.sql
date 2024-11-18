/*
  Warnings:

  - You are about to drop the column `billingGroupProjectFileId` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the column `billingGroupProjectId` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the `BillingGroupProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BillingGroupProjectFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `BillingGroupProject` DROP FOREIGN KEY `BillingGroupProject_billingGroupId_fkey`;

-- DropForeignKey
ALTER TABLE `BillingGroupProjectFile` DROP FOREIGN KEY `BillingGroupProjectFile_BillingGroupProjectId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_billingGroupProjectFileId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_billingGroupProjectId_fkey`;

-- AlterTable
ALTER TABLE `BillingGroup` ADD COLUMN `membersCanCreateProjects` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Job` ADD COLUMN `groupId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `logs` DROP COLUMN `billingGroupProjectFileId`,
    DROP COLUMN `billingGroupProjectId`;

-- DropTable
DROP TABLE `BillingGroupProject`;

-- DropTable
DROP TABLE `BillingGroupProjectFile`;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `BillingGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
