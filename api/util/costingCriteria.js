import { CostingCriterionKey, CostingMode } from "#prisma-client";

export const RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE = {
  costingCriteria: {
    select: {
      id: true,
      key: true,
      label: true,
      enabled: true,
      displayOrder: true,
    },
    orderBy: {
      displayOrder: "asc",
    },
  },
};

const CALCULATED_DEFAULT_CRITERIA = [
  {
    key: CostingCriterionKey.RESOURCE_TIME,
    label: "Resource Time",
    enabled: true,
    displayOrder: 0,
  },
  {
    key: CostingCriterionKey.PROCESSING_TIME,
    label: "Processing Time",
    enabled: true,
    displayOrder: 1,
  },
  {
    key: CostingCriterionKey.UNIT_RUNS,
    label: "Unit runs",
    enabled: true,
    displayOrder: 2,
  },
  {
    key: CostingCriterionKey.PRIMARY_MATERIAL,
    label: "Material quantity",
    enabled: true,
    displayOrder: 3,
  },
  {
    key: CostingCriterionKey.SECONDARY_MATERIAL,
    label: "Secondary Material quantity",
    enabled: false,
    displayOrder: 4,
  },
];

const RAW_VALUE_DEFAULT_CRITERIA = [
  {
    key: CostingCriterionKey.RAW_VALUE,
    label: "Raw value",
    enabled: true,
    displayOrder: 0,
  },
];

export const getDefaultCostingCriteria = (costingMode) => {
  if (costingMode === CostingMode.RAW_VALUE_ENTRY) {
    return RAW_VALUE_DEFAULT_CRITERIA.map((criterion) => ({ ...criterion }));
  }

  return CALCULATED_DEFAULT_CRITERIA.map((criterion) => ({ ...criterion }));
};

export const validateCostingCriteria = (criteria, costingMode) => {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return "At least one criterion is required";
  }

  const seenKeys = new Set();
  let enabledCount = 0;

  for (const criterion of criteria) {
    if (seenKeys.has(criterion.key)) {
      return "Criterion keys must be unique per resource type";
    }

    seenKeys.add(criterion.key);

    if (criterion.enabled) {
      enabledCount += 1;
    }

    if (
      costingMode === CostingMode.RAW_VALUE_ENTRY &&
      criterion.key !== CostingCriterionKey.RAW_VALUE
    ) {
      return "Raw-value resource types only allow RAW_VALUE";
    }

    if (
      costingMode !== CostingMode.RAW_VALUE_ENTRY &&
      criterion.key === CostingCriterionKey.RAW_VALUE
    ) {
      return "Calculated resource types cannot include RAW_VALUE";
    }

    if (
      costingMode === CostingMode.RAW_VALUE_ENTRY &&
      [
        CostingCriterionKey.PRIMARY_MATERIAL,
        CostingCriterionKey.SECONDARY_MATERIAL,
      ].includes(criterion.key)
    ) {
      return "Material criteria are only valid for calculated resource types";
    }
  }

  if (enabledCount === 0) {
    return "At least one criterion must be enabled";
  }

  return null;
};

export const isCostingCriterionEnabled = (resourceType, key) => {
  if (!resourceType) return false;

  if (
    !Array.isArray(resourceType.costingCriteria) ||
    resourceType.costingCriteria.length === 0
  ) {
    return resourceType.costingMode
      ? resourceType.costingMode === CostingMode.RAW_VALUE_ENTRY
        ? key === CostingCriterionKey.RAW_VALUE
        : [
            CostingCriterionKey.RESOURCE_TIME,
            CostingCriterionKey.PROCESSING_TIME,
            CostingCriterionKey.UNIT_RUNS,
            CostingCriterionKey.PRIMARY_MATERIAL,
            CostingCriterionKey.SECONDARY_MATERIAL,
          ].includes(key)
      : false;
  }

  return resourceType.costingCriteria.some(
    (criterion) => criterion.key === key && criterion.enabled
  );
};

const COSTING_VALUE_FIELDS_BY_KEY = {
  [CostingCriterionKey.RAW_VALUE]: ["rawValue"],
  [CostingCriterionKey.RESOURCE_TIME]: ["timeQty"],
  [CostingCriterionKey.PROCESSING_TIME]: ["processingTimeQty"],
  [CostingCriterionKey.UNIT_RUNS]: ["unitQty"],
  [CostingCriterionKey.PRIMARY_MATERIAL]: ["materialQty"],
  [CostingCriterionKey.SECONDARY_MATERIAL]: ["secondaryMaterialQty"],
};

export const sanitizeCostingInputForResourceType = (input, resourceType) => {
  if (!resourceType || !input || typeof input !== "object") {
    return input;
  }

  const sanitized = { ...input };

  Object.entries(COSTING_VALUE_FIELDS_BY_KEY).forEach(
    ([criterionKey, fields]) => {
      const enabled = isCostingCriterionEnabled(resourceType, criterionKey);

      if (enabled) return;

      fields.forEach((field) => {
        delete sanitized[field];
      });
    }
  );

  if (resourceType.costingMode === CostingMode.RAW_VALUE_ENTRY) {
    delete sanitized.resourceId;
    delete sanitized.materialId;
    delete sanitized.secondaryMaterialId;
  }

  return sanitized;
};
