/*
  Warnings:

  - Added the required column `shopId` to the `Printer3dMaterial` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `Printer3dType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Printer3dMaterial` ADD COLUMN `shopId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Printer3dType` ADD COLUMN `shopId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Printer3dType` ADD CONSTRAINT `Printer3dType_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Printer3dMaterial` ADD CONSTRAINT `Printer3dMaterial_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
