-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('USER_LOGIN', 'USER_CREATED', 'SHOP_CREATED', 'USER_CONNECTED_TO_SHOP', 'USER_DISCONNECTED_FROM_SHOP', 'USER_SHOP_ROLE_CHANGED', 'USER_PROMOTED_TO_ADMIN', 'USER_DEMOTED_FROM_ADMIN', 'USER_SUSPENSION_APPLIED', 'USER_SUSPENSION_REMOVED', 'USER_SUSPENSION_CHANGED', 'JOB_CREATED', 'JOB_MODIFIED', 'JOB_DELETED', 'JOB_STATUS_CHANGED', 'JOB_ITEM_CREATED', 'JOB_ITEM_DELETED', 'JOB_ITEM_MODIFIED', 'JOB_ITEM_STATUS_CHANGED', 'JOB_FINALIZED', 'JOB_INVOICE_GENERATED', 'RESOURCE_CREATED', 'RESOURCE_MODIFIED', 'RESOURCE_DELETED', 'RESOURCE_IMAGE_CREATED', 'RESOURCE_IMAGE_MODIFIED', 'RESOURCE_IMAGE_DELETED', 'RESOURCE_TYPE_CREATED', 'RESOURCE_TYPE_MODIFIED', 'RESOURCE_TYPE_DELETED', 'MATERIAL_CREATED', 'MATERIAL_MODIFIED', 'MATERIAL_DELETED', 'MATERIAL_MSDS_UPLOADED', 'MATERIAL_TDS_UPLOADED', 'MATERIAL_IMAGE_CREATED', 'MATERIAL_IMAGE_MODIFIED', 'MATERIAL_IMAGE_DELETED', 'COMMENT_CREATED', 'LEDGER_ITEM_CREATED', 'LEDGER_ITEM_CREATED_MANUALLY', 'BILLING_GROUP_CREATED', 'BILLING_GROUP_MODIFIED', 'BILLING_GROUP_DELETED', 'USER_ADDED_TO_BILLING_GROUP', 'USER_REMOVED_FROM_BILLING_GROUP', 'USER_BILLING_GROUP_ROLE_CHANGED', 'BILLING_GROUP_PROJECT_CREATED', 'BILLING_GROUP_PROJECT_MODIFIED', 'BILLING_GROUP_PROJECT_DELETED', 'BILLING_GROUP_PROJECT_FILE_UPLOADED', 'BILLING_GROUP_INVITATION_LINK_CREATED', 'BILLING_GROUP_INVITATION_LINK_DELETED', 'BILLING_GROUP_INVITATION_LINK_MODIFIED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CUSTOMER', 'OPERATOR', 'ADMIN', 'GROUP_ADMIN');

-- CreateEnum
CREATE TYPE "SuppliedMaterialLevels" AS ENUM ('ALWAYS', 'SOMETIMES', 'NEVER', 'SPECIAL');

-- CreateEnum
CREATE TYPE "Color" AS ENUM ('RED', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'TEAL');

-- CreateEnum
CREATE TYPE "LedgerItemType" AS ENUM ('INITIAL', 'JOB', 'AUTOMATED_TOPUP', 'AUTOMATED_DEPOSIT', 'MANUAL_TOPUP', 'MANUAL_DEPOSIT', 'MANUAL_REDUCTION', 'FUNDS_PURCHASED', 'REFUND');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'WAITING_FOR_PICKUP', 'WAITING_FOR_PAYMENT', 'CANCELLED', 'WONT_DO', 'WAITING');

-- CreateEnum
CREATE TYPE "UserBillingGroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "admin" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "type" "LogType" NOT NULL,
    "message" TEXT,
    "from" TEXT,
    "to" TEXT,
    "userId" TEXT,
    "shopId" TEXT,
    "jobId" TEXT,
    "jobItemId" TEXT,
    "resourceId" TEXT,
    "resourceImageId" TEXT,
    "materialId" TEXT,
    "materialImageId" TEXT,
    "resourceTypeId" TEXT,
    "commentId" TEXT,
    "ledgerItemId" TEXT,
    "billingGroupId" TEXT,
    "userBillingGroupId" TEXT,
    "billingGroupInvitationLinkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserShop" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL DEFAULT 'CUSTOMER',
    "accountTitle" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserShop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "logoUrl" TEXT,
    "logoKey" TEXT,
    "logoName" TEXT,
    "color" "Color",
    "startingDeposit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "primaryCategory" TEXT,
    "secondaryCategory" TEXT,
    "resourceTypeId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER,
    "quantityPublic" BOOLEAN NOT NULL DEFAULT true,
    "costPerUnit" DOUBLE PRECISION,
    "fixedCost" DOUBLE PRECISION,
    "costPerTime" DOUBLE PRECISION,
    "materialLabel" TEXT,
    "costPerProcessingTime" DOUBLE PRECISION,
    "costingPublic" BOOLEAN NOT NULL DEFAULT true,
    "userSuppliedMaterial" "SuppliedMaterialLevels" NOT NULL DEFAULT 'NEVER',

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "manufacturer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "shopId" TEXT NOT NULL,
    "costPerUnit" DOUBLE PRECISION,
    "unitDescriptor" TEXT,
    "costPublic" BOOLEAN NOT NULL DEFAULT true,
    "resourceTypeId" TEXT NOT NULL,
    "msdsFileKey" TEXT,
    "msdsFileUrl" TEXT,
    "msdsFileName" TEXT,
    "msdsFileType" TEXT,
    "tdsFileKey" TEXT,
    "tdsFileUrl" TEXT,
    "tdsFileName" TEXT,
    "tdsFileType" TEXT,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialImage" (
    "id" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "materialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceImage" (
    "id" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "resourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceType" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "shopId" TEXT NOT NULL,

    CONSTRAINT "ResourceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialId" TEXT,
    "resourceTypeId" TEXT,
    "resourceId" TEXT,
    "groupId" TEXT,
    "dueDate" TIMESTAMP(3),
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "additionalCostOverride" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "jobId" TEXT,
    "type" "LedgerItemType" NOT NULL,
    "invoiceUrl" TEXT,
    "invoiceKey" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobComment" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "JobComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalCostLineItem" (
    "id" TEXT NOT NULL,
    "resourceTypeId" TEXT,
    "resourceId" TEXT,
    "materialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unitQty" DOUBLE PRECISION,
    "timeQty" DOUBLE PRECISION,
    "materialQty" DOUBLE PRECISION,
    "processingTimeQty" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "AdditionalCostLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "qty" DOUBLE PRECISION,
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileThumbnailKey" TEXT,
    "fileThumbnailUrl" TEXT,
    "fileThumbnailName" TEXT,
    "stlVolume" DOUBLE PRECISION,
    "stlBoundingBoxX" DOUBLE PRECISION,
    "stlBoundingBoxY" DOUBLE PRECISION,
    "stlBoundingBoxZ" DOUBLE PRECISION,
    "stlIsWatertight" BOOLEAN,
    "resourceId" TEXT,
    "resourceTypeId" TEXT,
    "materialId" TEXT,
    "userId" TEXT,
    "approved" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "processingTimeQty" DOUBLE PRECISION,
    "timeQty" DOUBLE PRECISION,
    "unitQty" DOUBLE PRECISION,
    "materialQty" DOUBLE PRECISION,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "JobItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "shopId" TEXT NOT NULL,
    "membersCanCreateJobs" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BillingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingGroupInvitationLink" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expires" TIMESTAMP(3),
    "billingGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingGroupInvitationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBillingGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billingGroupId" TEXT NOT NULL,
    "role" "UserBillingGroupRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserBillingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerItem_jobId_key" ON "LedgerItem"("jobId");

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_jobItemId_fkey" FOREIGN KEY ("jobItemId") REFERENCES "JobItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_resourceImageId_fkey" FOREIGN KEY ("resourceImageId") REFERENCES "ResourceImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_materialImageId_fkey" FOREIGN KEY ("materialImageId") REFERENCES "MaterialImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "JobComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_ledgerItemId_fkey" FOREIGN KEY ("ledgerItemId") REFERENCES "LedgerItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_billingGroupId_fkey" FOREIGN KEY ("billingGroupId") REFERENCES "BillingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_userBillingGroupId_fkey" FOREIGN KEY ("userBillingGroupId") REFERENCES "UserBillingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_billingGroupInvitationLinkId_fkey" FOREIGN KEY ("billingGroupInvitationLinkId") REFERENCES "BillingGroupInvitationLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShop" ADD CONSTRAINT "UserShop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShop" ADD CONSTRAINT "UserShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialImage" ADD CONSTRAINT "MaterialImage_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceImage" ADD CONSTRAINT "ResourceImage_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceType" ADD CONSTRAINT "ResourceType_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BillingGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerItem" ADD CONSTRAINT "LedgerItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerItem" ADD CONSTRAINT "LedgerItem_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerItem" ADD CONSTRAINT "LedgerItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobComment" ADD CONSTRAINT "JobComment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobComment" ADD CONSTRAINT "JobComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalCostLineItem" ADD CONSTRAINT "AdditionalCostLineItem_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalCostLineItem" ADD CONSTRAINT "AdditionalCostLineItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalCostLineItem" ADD CONSTRAINT "AdditionalCostLineItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalCostLineItem" ADD CONSTRAINT "AdditionalCostLineItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingGroup" ADD CONSTRAINT "BillingGroup_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingGroupInvitationLink" ADD CONSTRAINT "BillingGroupInvitationLink_billingGroupId_fkey" FOREIGN KEY ("billingGroupId") REFERENCES "BillingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBillingGroup" ADD CONSTRAINT "UserBillingGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBillingGroup" ADD CONSTRAINT "UserBillingGroup_billingGroupId_fkey" FOREIGN KEY ("billingGroupId") REFERENCES "BillingGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
