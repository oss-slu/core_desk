-- AlterTable
ALTER TABLE `logs` ADD COLUMN `billingGroupInvitationLinkId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_billingGroupInvitationLinkId_fkey` FOREIGN KEY (`billingGroupInvitationLinkId`) REFERENCES `BillingGroupInvitationLink`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
