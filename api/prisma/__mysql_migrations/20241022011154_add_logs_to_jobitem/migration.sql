-- AlterTable
ALTER TABLE `logs` ADD COLUMN `jobItemId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_jobItemId_fkey` FOREIGN KEY (`jobItemId`) REFERENCES `JobItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
