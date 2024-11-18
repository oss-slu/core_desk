/*
  Warnings:

  - You are about to drop the column `membersCanCreateProjects` on the `BillingGroup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `BillingGroup` DROP COLUMN `membersCanCreateProjects`,
    ADD COLUMN `membersCanCreateJobs` BOOLEAN NOT NULL DEFAULT false;
