const CALCULATED_DEFAULT_CRITERIA = [
  {
    key: "RESOURCE_TIME",
    label: "Resource Time",
    enabled: true,
    displayOrder: 0,
  },
  {
    key: "PROCESSING_TIME",
    label: "Processing Time",
    enabled: true,
    displayOrder: 1,
  },
  {
    key: "UNIT_RUNS",
    label: "Unit runs",
    enabled: true,
    displayOrder: 2,
  },
  {
    key: "PRIMARY_MATERIAL",
    label: "Material quantity",
    enabled: true,
    displayOrder: 3,
  },
  {
    key: "SECONDARY_MATERIAL",
    label: "Secondary Material quantity",
    enabled: false,
    displayOrder: 4,
  },
];

const RAW_VALUE_DEFAULT_CRITERIA = [
  {
    key: "RAW_VALUE",
    label: "Raw value",
    enabled: true,
    displayOrder: 0,
  },
];

export const getSupportedCostingCriteria = (resourceType) => {
  if (resourceType?.costingMode === "RAW_VALUE_ENTRY") {
    return RAW_VALUE_DEFAULT_CRITERIA.map((criterion) => ({ ...criterion }));
  }

  return CALCULATED_DEFAULT_CRITERIA.map((criterion) => ({ ...criterion }));
};

export const getEditableCostingCriteria = (resourceType) => {
  const supported = getSupportedCostingCriteria(resourceType);
  const existingCriteria = Array.isArray(resourceType?.costingCriteria)
    ? resourceType.costingCriteria
    : [];
  const existingByKey = new Map(
    existingCriteria.map((criterion) => [criterion.key, criterion])
  );

  const mergedCriteria = supported.map((criterion) => ({
    ...criterion,
    ...existingByKey.get(criterion.key),
  }));

  const enabledCriteria = mergedCriteria
    .filter((criterion) => criterion.enabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const disabledCriteria = mergedCriteria.filter((criterion) => !criterion.enabled);

  return [...enabledCriteria, ...disabledCriteria];
};

export const getEnabledCostingCriteria = (resourceType) =>
  getEditableCostingCriteria(resourceType).filter((criterion) => criterion.enabled);

export const isCriterionEnabled = (resourceType, key) =>
  getEnabledCostingCriteria(resourceType).some((criterion) => criterion.key === key);

export const isRawValueMode = (resourceType) =>
  resourceType?.costingMode === "RAW_VALUE_ENTRY";

export const needsResourceSelection = (resourceType) =>
  ["RESOURCE_TIME", "PROCESSING_TIME", "UNIT_RUNS"].some((key) =>
    isCriterionEnabled(resourceType, key)
  );

export const needsPrimaryMaterialSelection = (resourceType) =>
  isCriterionEnabled(resourceType, "PRIMARY_MATERIAL");

export const needsSecondaryMaterialSelection = (resourceType) =>
  isCriterionEnabled(resourceType, "SECONDARY_MATERIAL");

export const calculateCriterionCost = (item, criterionKey) => {
  switch (criterionKey) {
    case "RAW_VALUE":
      return item.rawValue || 0;
    case "RESOURCE_TIME":
      return (item.timeQty || 0) * (item.resource?.costPerTime || 0);
    case "PROCESSING_TIME":
      return (
        (item.processingTimeQty || 0) *
        (item.resource?.costPerProcessingTime || 0)
      );
    case "UNIT_RUNS":
      return (item.unitQty || 0) * (item.resource?.costPerUnit || 0);
    case "PRIMARY_MATERIAL":
      return (item.materialQty || 0) * (item.material?.costPerUnit || 0);
    case "SECONDARY_MATERIAL":
      return (
        (item.secondaryMaterialQty || 0) *
        (item.secondaryMaterial?.costPerUnit || 0)
      );
    default:
      return 0;
  }
};

export const calculateConfiguredSubtotal = (item) => {
  if (isRawValueMode(item?.resourceType)) {
    return calculateCriterionCost(item, "RAW_VALUE");
  }

  return getEnabledCostingCriteria(item?.resourceType).reduce(
    (total, criterion) => total + calculateCriterionCost(item, criterion.key),
    0
  );
};

export const hasRequiredCostingSelections = (item) => {
  if (!item?.resourceTypeId) return false;
  if (isRawValueMode(item?.resourceType)) return true;
  if (needsResourceSelection(item?.resourceType) && !item?.resourceId) return false;
  if (
    needsPrimaryMaterialSelection(item?.resourceType) &&
    !item?.materialId
  ) {
    return false;
  }
  if (
    needsSecondaryMaterialSelection(item?.resourceType) &&
    !item?.secondaryMaterialId
  ) {
    return false;
  }

  return true;
};

export const moveArrayItem = (items, fromIndex, toIndex) => {
  if (toIndex < 0 || toIndex >= items.length) return items;

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
};
