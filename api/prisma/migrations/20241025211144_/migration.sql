/*
  Warnings:

  - You are about to drop the column `printer3dTypeId` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `printer3dTypeId` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `printer3dTypeId` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `printer3dTypeId` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the `Printer3dType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `JobItem` DROP FOREIGN KEY `JobItem_printer3dTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `Material` DROP FOREIGN KEY `Material_printer3dTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `Printer3dType` DROP FOREIGN KEY `Printer3dType_resourceTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `Printer3dType` DROP FOREIGN KEY `Printer3dType_shopId_fkey`;

-- DropForeignKey
ALTER TABLE `Resource` DROP FOREIGN KEY `Resource_printer3dTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `logs` DROP FOREIGN KEY `logs_printer3dTypeId_fkey`;

-- AlterTable
ALTER TABLE `JobItem` DROP COLUMN `printer3dTypeId`;

-- AlterTable
ALTER TABLE `Material` DROP COLUMN `printer3dTypeId`;

-- AlterTable
ALTER TABLE `Resource` DROP COLUMN `printer3dTypeId`;

-- AlterTable
ALTER TABLE `logs` DROP COLUMN `printer3dTypeId`;

-- DropTable
DROP TABLE `Printer3dType`;
