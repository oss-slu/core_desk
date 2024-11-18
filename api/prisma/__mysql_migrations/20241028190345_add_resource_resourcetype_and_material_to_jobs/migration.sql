-- AlterTable
ALTER TABLE `Job` ADD COLUMN `materialId` VARCHAR(191) NULL,
    ADD COLUMN `resourceId` VARCHAR(191) NULL,
    ADD COLUMN `resourceTypeId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
