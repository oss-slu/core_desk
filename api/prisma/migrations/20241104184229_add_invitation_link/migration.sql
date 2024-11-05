-- CreateTable
CREATE TABLE `BillingGroupInvitationLink` (
    `id` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `expires` DATETIME(3) NOT NULL,
    `billingGroupId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BillingGroupInvitationLink` ADD CONSTRAINT `BillingGroupInvitationLink_billingGroupId_fkey` FOREIGN KEY (`billingGroupId`) REFERENCES `BillingGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
