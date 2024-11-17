-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `quantity` INTEGER NULL,
    ADD COLUMN `quantityPublic` BOOLEAN NOT NULL DEFAULT true;
