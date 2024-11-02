-- AlterTable
ALTER TABLE `JobItem` ADD COLUMN `stlBoundingBoxX` DOUBLE NULL,
    ADD COLUMN `stlBoundingBoxY` DOUBLE NULL,
    ADD COLUMN `stlBoundingBoxZ` DOUBLE NULL,
    ADD COLUMN `stlIsWatertight` BOOLEAN NULL,
    ADD COLUMN `stlVolume` DOUBLE NULL;
