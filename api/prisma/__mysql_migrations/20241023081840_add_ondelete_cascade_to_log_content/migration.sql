-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_jobId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_jobItemId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_printer3dMaterialId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_printer3dTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_resourceId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_resourceImageId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_shopId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_userId_fkey`;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_jobItemId_fkey` FOREIGN KEY (`jobItemId`) REFERENCES `JobItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_resourceImageId_fkey` FOREIGN KEY (`resourceImageId`) REFERENCES `ResourceImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_printer3dTypeId_fkey` FOREIGN KEY (`printer3dTypeId`) REFERENCES `Printer3dType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_printer3dMaterialId_fkey` FOREIGN KEY (`printer3dMaterialId`) REFERENCES `Printer3dMaterial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
