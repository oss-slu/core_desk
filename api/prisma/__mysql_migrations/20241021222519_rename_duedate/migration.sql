/*
  Warnings:

  - You are about to drop the column `duedate` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Job` DROP COLUMN `duedate`,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    MODIFY `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'WONT_DO', 'WAITING') NOT NULL DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE `JobItems` MODIFY `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'WONT_DO', 'WAITING') NOT NULL DEFAULT 'NOT_STARTED';
