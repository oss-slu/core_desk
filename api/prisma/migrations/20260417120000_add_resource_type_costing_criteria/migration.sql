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

-- AlterTable
ALTER TABLE "LedgerItem"
ADD COLUMN "costingCriteriaSnapshot" JSONB;

-- Seed defaults for existing calculated resource types
INSERT INTO "ResourceTypeCostingCriterion" (
    "id",
    "resourceTypeId",
    "key",
    "label",
    "enabled",
    "displayOrder",
    "createdAt",
    "updatedAt"
)
SELECT
    md5("ResourceType"."id" || ':' || seeded."key"::text),
    "ResourceType"."id",
    seeded."key",
    seeded."label",
    seeded."enabled",
    seeded."displayOrder",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "ResourceType"
JOIN (
    VALUES
        ('RESOURCE_TIME'::"CostingCriterionKey", 'Resource Time', true, 0),
        ('PROCESSING_TIME'::"CostingCriterionKey", 'Processing Time', true, 1),
        ('UNIT_RUNS'::"CostingCriterionKey", 'Unit runs', true, 2),
        ('PRIMARY_MATERIAL'::"CostingCriterionKey", 'Material quantity', true, 3),
        ('SECONDARY_MATERIAL'::"CostingCriterionKey", 'Secondary Material quantity', false, 4)
) AS seeded("key", "label", "enabled", "displayOrder")
    ON true
WHERE "ResourceType"."costingMode" = 'CALCULATE_WITH_RESOURCE_AND_MATERIAL'
ON CONFLICT ("resourceTypeId", "key") DO NOTHING;

-- Seed defaults for existing raw-value resource types
INSERT INTO "ResourceTypeCostingCriterion" (
    "id",
    "resourceTypeId",
    "key",
    "label",
    "enabled",
    "displayOrder",
    "createdAt",
    "updatedAt"
)
SELECT
    md5("ResourceType"."id" || ':RAW_VALUE'),
    "ResourceType"."id",
    'RAW_VALUE'::"CostingCriterionKey",
    'Raw value',
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "ResourceType"
WHERE "ResourceType"."costingMode" = 'RAW_VALUE_ENTRY'
ON CONFLICT ("resourceTypeId", "key") DO NOTHING;
