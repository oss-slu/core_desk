-- AlterTable
ALTER TABLE `logs` ADD COLUMN `resourceId` VARCHAR(191) NULL,
    ADD COLUMN `resourceImageId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Resource` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` MEDIUMTEXT NULL,
    `primaryCategory` VARCHAR(191) NULL,
    `secondaryCategory` VARCHAR(191) NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `costPerUnit` DOUBLE NULL,
    `fixedCost` DOUBLE NULL,
    `costPerTime` DOUBLE NULL,
    `costPerMaterial` DOUBLE NULL,
    `costPerProcessingTime` DOUBLE NULL,
    `userSuppliedMaterial` ENUM('ALWAYS', 'SOMETIMES', 'NEVER', 'SPECIAL') NOT NULL DEFAULT 'NEVER',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResourceImage` (
    `id` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `resourceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_resourceImageId_fkey` FOREIGN KEY (`resourceImageId`) REFERENCES `ResourceImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResourceImage` ADD CONSTRAINT `ResourceImage_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
