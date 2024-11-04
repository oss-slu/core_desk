/*
  Warnings:

  - The values [INSTRUCTOR] on the enum `UserShop_accountType` will be removed. If these variants are still used in the database, this will fail.

*/
-- DropForeignKey
ALTER TABLE `AdditionalCostLineItem` DROP FOREIGN KEY `AdditionalCostLineItem_jobId_fkey`;

-- DropForeignKey
ALTER TABLE `JobComment` DROP FOREIGN KEY `JobComment_jobId_fkey`;

-- DropForeignKey
ALTER TABLE `JobItem` DROP FOREIGN KEY `JobItem_jobId_fkey`;

-- DropForeignKey
ALTER TABLE `LedgerItem` DROP FOREIGN KEY `LedgerItem_jobId_fkey`;

-- AlterTable
ALTER TABLE `UserShop` MODIFY `accountType` ENUM('CUSTOMER', 'OPERATOR', 'ADMIN', 'GROUP_ADMIN') NOT NULL DEFAULT 'CUSTOMER';

-- AddForeignKey
ALTER TABLE `LedgerItem` ADD CONSTRAINT `LedgerItem_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobComment` ADD CONSTRAINT `JobComment_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdditionalCostLineItem` ADD CONSTRAINT `AdditionalCostLineItem_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobItem` ADD CONSTRAINT `JobItem_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
