-- DropForeignKey
ALTER TABLE `Material` DROP FOREIGN KEY `Material_printer3dTypeId_fkey`;

-- AlterTable
ALTER TABLE `Material` ADD COLUMN `costPerUnit` DOUBLE NULL,
    ADD COLUMN `costPublic` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `unitDescriptor` VARCHAR(191) NULL,
    MODIFY `printer3dTypeId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_printer3dTypeId_fkey` FOREIGN KEY (`printer3dTypeId`) REFERENCES `Printer3dType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
