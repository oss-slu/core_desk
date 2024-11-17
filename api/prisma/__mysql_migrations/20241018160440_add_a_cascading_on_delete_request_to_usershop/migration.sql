-- DropForeignKey
ALTER TABLE `UserShop` DROP FOREIGN KEY `UserShop_shopId_fkey`;

-- DropForeignKey
ALTER TABLE `UserShop` DROP FOREIGN KEY `UserShop_userId_fkey`;

-- AddForeignKey
ALTER TABLE `UserShop` ADD CONSTRAINT `UserShop_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserShop` ADD CONSTRAINT `UserShop_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
