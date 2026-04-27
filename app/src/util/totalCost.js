import { calculateConfiguredSubtotal } from "./costingCriteria";

export const calculateTotalCostOfJob = (data) => {
  let totalCost = 0;

  // First, add up the additional line items
  data.additionalCosts.forEach((cost) => {
    if (cost.resourceType?.costingMode === "RAW_VALUE_ENTRY") {
      totalCost += cost.rawValue || 0;
      return;
    }

    if (typeof cost.amount === "number") {
      totalCost += cost.amount;
      return;
    }

    totalCost += calculateConfiguredSubtotal(cost);
  });

  // if additionalCostOverride is true, return totalCost
  if (data.additionalCostOverride) return totalCost;

  // Next, add up the item costs
  data.items.forEach((item) => {
    if (item.resourceType?.costingMode === "RAW_VALUE_ENTRY") {
      totalCost += (item.rawValue || 0) * (item.qty ?? 1);
      return;
    }

    totalCost += calculateConfiguredSubtotal(item) * (item.qty ?? 1);
  });

  return totalCost;
};
