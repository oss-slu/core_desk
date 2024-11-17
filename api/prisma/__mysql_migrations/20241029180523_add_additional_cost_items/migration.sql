/*
  Warnings:

  - You are about to drop the column `extraCost` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `processingTimeQty` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `timeQty` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `unitQty` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the `MaterialQty` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `MaterialQty` DROP FOREIGN KEY `MaterialQty_jobId_fkey`;

-- DropForeignKey
ALTER TABLE `MaterialQty` DROP FOREIGN KEY `MaterialQty_materialId_fkey`;

-- AlterTable
ALTER TABLE `Job` DROP COLUMN `extraCost`,
    DROP COLUMN `processingTimeQty`,
    DROP COLUMN `timeQty`,
    DROP COLUMN `unitQty`;

-- DropTable
DROP TABLE `MaterialQty`;

-- CreateTable
CREATE TABLE `AdditionalCostLineItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` MEDIUMTEXT NULL,
    `resourceTypeId` VARCHAR(191) NULL,
    `resourceId` VARCHAR(191) NULL,
    `materialId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdditionalCostLineItem` ADD CONSTRAINT `AdditionalCostLineItem_resourceTypeId_fkey` FOREIGN KEY (`resourceTypeId`) REFERENCES `ResourceType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdditionalCostLineItem` ADD CONSTRAINT `AdditionalCostLineItem_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdditionalCostLineItem` ADD CONSTRAINT `AdditionalCostLineItem_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdditionalCostLineItem` ADD CONSTRAINT `AdditionalCostLineItem_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
