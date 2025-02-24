export const calculateTotalCostOfJob = (data) => {
  let totalCost = 0;

  // First, add up the additional line items
  data.additionalCosts.forEach((cost) => {
    if (!cost.resource || !cost.material || !cost.secondaryMaterial) return;

    totalCost += (cost.unitQty || 0) * (cost.resource.costPerUnit || 0);
    totalCost += (cost.timeQty || 0) * (cost.resource.costPerTime || 0);
    totalCost +=
      (cost.processingTimeQty || 0) *
      (cost.resource.costPerProcessingTime || 0);
    totalCost += (cost.materialQty || 0) * (cost.material.costPerUnit || 0);
    totalCost += (cost.secondaryMaterialQty || 0) * (cost.secondaryMaterial.costPerUnit || 0);
  });

  // if additionalCostOverride is true, return totalCost
  if (data.additionalCostOverride) return totalCost;

  // Next, add up the item costs
  data.items.forEach((item) => {
    if (!item.resource || !item.material || !item.secondaryMaterial) return;

    let localTotalCost = 0;

    localTotalCost += (item.timeQty || 0) * (item.resource.costPerTime || 0);
    localTotalCost +=
      (item.processingTimeQty || 0) *
      (item.resource.costPerProcessingTime || 0);
    localTotalCost += (item.unitQty || 0) * (item.resource.costPerUnit || 0);
    localTotalCost +=
      (item.materialQty || 0) * (item.material.costPerUnit || 0);
    localTotalCost +=
      (item.secondaryMaterialQty || 0) * (item.secondaryMaterial.costPerUnit || 0);

    totalCost += localTotalCost * item.qty;
  });

  return totalCost;
};
