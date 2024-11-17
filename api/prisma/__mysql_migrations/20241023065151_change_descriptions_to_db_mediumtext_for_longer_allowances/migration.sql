-- AlterTable
ALTER TABLE `Job` MODIFY `description` MEDIUMTEXT NULL;

-- AlterTable
ALTER TABLE `Resource` MODIFY `resourceType` ENUM('OTHER', 'INSTRUMENT', 'TOOL', 'PRINTER', 'PRINTER_3D', 'LASER_CUTTER', 'CNC') NULL;

-- AlterTable
ALTER TABLE `Shop` MODIFY `description` MEDIUMTEXT NULL;
