/*
  Warnings:

  - You are about to drop the column `printer3dMaterialId` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `costPerMaterial` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `printer3dMaterialId` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the `Printer3dMaterial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `JobItem` DROP FOREIGN KEY `JobItem_printer3dMaterialId_fkey`;

-- DropForeignKey
ALTER TABLE `Printer3dMaterial` DROP FOREIGN KEY `Printer3dMaterial_printer3dTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `Printer3dMaterial` DROP FOREIGN KEY `Printer3dMaterial_shopId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_printer3dMaterialId_fkey`;

-- AlterTable
ALTER TABLE `JobItem` DROP COLUMN `printer3dMaterialId`,
    ADD COLUMN `materialId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Resource` DROP COLUMN `costPerMaterial`;

-- AlterTable
ALTER TABLE `logs` DROP COLUMN `printer3dMaterialId`,
    ADD COLUMN `materialId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Printer3dMaterial`;

-- CreateTable
CREATE TABLE `Material` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` MEDIUMTEXT NULL,
    `manufacturer` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `printer3dTypeId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_printer3dTypeId_fkey` FOREIGN KEY (`printer3dTypeId`) REFERENCES `Printer3dType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobItem` ADD CONSTRAINT `JobItem_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
