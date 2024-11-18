-- AlterTable
ALTER TABLE `JobItem` ADD COLUMN `printer3dMaterialId` VARCHAR(191) NULL,
    ADD COLUMN `printer3dTypeId` VARCHAR(191) NULL,
    ADD COLUMN `resourceId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `JobItem` ADD CONSTRAINT `JobItem_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobItem` ADD CONSTRAINT `JobItem_printer3dTypeId_fkey` FOREIGN KEY (`printer3dTypeId`) REFERENCES `Printer3dType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobItem` ADD CONSTRAINT `JobItem_printer3dMaterialId_fkey` FOREIGN KEY (`printer3dMaterialId`) REFERENCES `Printer3dMaterial`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
