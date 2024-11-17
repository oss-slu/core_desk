/*
  Warnings:

  - Made the column `resourceTypeId` on table `Printer3dType` required. This step will fail if there are existing NULL values in that column.
  - Made the column `resourceTypeId` on table `Resource` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Printer3dType` DROP FOREIGN KEY `Printer3dType_resourceTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `Resource` DROP FOREIGN KEY `Resource_resourceTypeId_fkey`;

-- AlterTable
ALTER TABLE `Printer3dType` MODIFY `resourceTypeId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Resource` MODIFY `resourceTypeId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Printer3dType` ADD CONSTRAINT `Printer3dType_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
