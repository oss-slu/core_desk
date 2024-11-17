-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `printer3dTypeId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Printer3dType` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_printer3dTypeId_fkey` FOREIGN KEY (`printer3dTypeId`) REFERENCES `Printer3dType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
