-- AlterTable
ALTER TABLE `Job` ADD COLUMN `finalized` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `finalizedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `LedgerItem` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `invoiceUrl` VARCHAR(191) NULL,
    `invoiceKey` VARCHAR(191) NULL,
    `value` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LedgerItem_jobId_key`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LedgerItem` ADD CONSTRAINT `LedgerItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LedgerItem` ADD CONSTRAINT `LedgerItem_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LedgerItem` ADD CONSTRAINT `LedgerItem_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
