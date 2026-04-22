/*
  Warnings:

  - You are about to drop the column `key` on the `ResourceTypeCostingCriterion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resourceTypeId,criterionType]` on the table `ResourceTypeCostingCriterion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `criterionType` to the `ResourceTypeCostingCriterion` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ResourceTypeCostingCriterion_resourceTypeId_key_key";

-- AlterTable
ALTER TABLE "ResourceTypeCostingCriterion" DROP COLUMN "key",
ADD COLUMN     "criterionType" "CostingCriterionType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTypeCostingCriterion_resourceTypeId_criterionType_key" ON "ResourceTypeCostingCriterion"("resourceTypeId", "criterionType");
