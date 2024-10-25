/*
  Warnings:

  - You are about to drop the column `resourceType` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `resourceType` on the `Resource` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `JobItem` DROP COLUMN `resourceType`,
    ADD COLUMN `resourceTypeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Printer3dType` ADD COLUMN `resourceTypeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Resource` DROP COLUMN `resourceType`,
    ADD COLUMN `resourceTypeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `logs` ADD COLUMN `resourceTypeId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ResourceType` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `shopId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Printer3dType` ADD CONSTRAINT `Printer3dType_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResourceType` ADD CONSTRAINT `ResourceType_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobItem` ADD CONSTRAINT `JobItem_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
