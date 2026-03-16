-- AlterTable
ALTER TABLE "LedgerItem" ADD COLUMN     "billingGroupId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "LedgerItem_shopId_userId_idx" ON "LedgerItem"("shopId", "userId");

-- CreateIndex
CREATE INDEX "LedgerItem_shopId_billingGroupId_idx" ON "LedgerItem"("shopId", "billingGroupId");

-- AddForeignKey
ALTER TABLE "LedgerItem" ADD CONSTRAINT "LedgerItem_billingGroupId_fkey" FOREIGN KEY ("billingGroupId") REFERENCES "BillingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
