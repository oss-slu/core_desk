-- AlterTable
ALTER TABLE `Job` ADD COLUMN `additionalCostOverride` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `extraCost` DOUBLE NULL,
    ADD COLUMN `processingTimeQty` DOUBLE NULL,
    ADD COLUMN `timeQty` DOUBLE NULL,
    ADD COLUMN `unitQty` DOUBLE NULL;

-- CreateTable
CREATE TABLE `MaterialQty` (
    `id` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `qty` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MaterialQty` ADD CONSTRAINT `MaterialQty_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialQty` ADD CONSTRAINT `MaterialQty_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
