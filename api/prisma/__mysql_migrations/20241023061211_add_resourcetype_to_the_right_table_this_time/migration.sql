/*
  Warnings:

  - You are about to drop the column `resourceType` on the `ResourceImage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `resourceType` ENUM('OTHER', 'INSTRUMENT', 'TOOL', 'PRINTER', 'PRINTER_3D') NULL;

-- AlterTable
ALTER TABLE `ResourceImage` DROP COLUMN `resourceType`;
