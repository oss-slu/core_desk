-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "secondaryMaterialId" TEXT;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_secondaryMaterialId_fkey" FOREIGN KEY ("secondaryMaterialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
