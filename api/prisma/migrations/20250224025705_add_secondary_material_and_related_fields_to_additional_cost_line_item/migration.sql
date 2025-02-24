-- AlterTable
ALTER TABLE "AdditionalCostLineItem" ADD COLUMN     "secondaryMaterialId" TEXT,
ADD COLUMN     "secondaryMaterialQty" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "AdditionalCostLineItem" ADD CONSTRAINT "AdditionalCostLineItem_secondaryMaterialId_fkey" FOREIGN KEY ("secondaryMaterialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
