/*
  Warnings:

  - Added the required column `resourceTypeId` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Material` ADD COLUMN `resourceTypeId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
