-- CreateEnum
CREATE TYPE "CostingCriterionKey" AS ENUM (
    'RAW_VALUE',
    'RESOURCE_TIME',
    'PROCESSING_TIME',
    'UNIT_RUNS',
    'PRIMARY_MATERIAL',
    'SECONDARY_MATERIAL'
);

-- CreateTable
CREATE TABLE "ResourceTypeCostingCriterion" (
    "id" TEXT NOT NULL,
    "resourceTypeId" TEXT NOT NULL,
    "key" "CostingCriterionKey" NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceTypeCostingCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTypeCostingCriterion_resourceTypeId_key_key"
ON "ResourceTypeCostingCriterion"("resourceTypeId", "key");

-- CreateIndex
CREATE INDEX "ResourceTypeCostingCriterion_resourceTypeId_displayOrder_idx"
ON "ResourceTypeCostingCriterion"("resourceTypeId", "displayOrder");

-- AddForeignKey
ALTER TABLE "ResourceTypeCostingCriterion"
ADD CONSTRAINT "ResourceTypeCostingCriterion_resourceTypeId_fkey"
FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
