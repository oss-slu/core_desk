const ejs = require("ejs");
const fs = require("fs");

const calculateTotalCostOfJob = (data) => {
  let totalCost = 0;

  // First, add up the additional line items
  data.additionalCosts.forEach((cost) => {
    if (!cost.resource || !cost.material) return;

    totalCost += (cost.unitQty || 0) * (cost.resource.costPerUnit || 0);
    totalCost += (cost.timeQty || 0) * (cost.resource.costPerTime || 0);
    totalCost +=
      (cost.processingTimeQty || 0) *
      (cost.resource.costPerProcessingTime || 0);
    totalCost += (cost.materialQty || 0) * (cost.material.costPerUnit || 0);
  });

  // if additionalCostOverride is true, return totalCost
  if (data.additionalCostOverride) return totalCost;

  // Next, add up the item costs
  data.items.forEach((item) => {
    if (!item.resource || !item.material) return;

    totalCost += (item.timeQty || 0) * (item.resource.costPerTime || 0);
    totalCost +=
      (item.processingTimeQty || 0) *
      (item.resource.costPerProcessingTime || 0);
    totalCost += (item.unitQty || 0) * (item.resource.costPerUnit || 0);
    totalCost += (item.materialQty || 0) * (item.material.costPerUnit || 0);
  });

  return totalCost;
};

const data = {
  id: "cm2jl8hwj0001q4bxbfex38io",
  title: "Test Project",
  description:
    "A test project to throw new features at and to just mess around",
  imageUrl: null,
  createdAt: "2024-10-21T22:28:20.514Z",
  updatedAt: "2024-10-29T19:08:34.264Z",
  shopId: "cm2dz5xdz0002665mvd5j491p",
  userId: "cm2ceomc20000qrdmvld5p3s6",
  materialId: "cm2px4x4g00014hzawpbxoqc9",
  resourceTypeId: "cm2ntwfkj0000ily4t7dy7q3a",
  resourceId: "cm2kv71cv0001c8g2l2x0qjn1",
  dueDate: "2024-10-30T05:00:00.000Z",
  additionalCostOverride: false,
  status: "IN_PROGRESS",
  items: [
    {
      id: "cm2jrcmim0005biqemzhqrh8l",
      title: "Shark_single_color.stl",
      status: "COMPLETED",
      fileKey: "qugGCERsBT5egfL9KXHucQNHvS03KxXVhyU2DzJ9CgbPw5GF",
      fileUrl:
        "https://utfs.io/f/qugGCERsBT5egfL9KXHucQNHvS03KxXVhyU2DzJ9CgbPw5GF",
      fileName: "Shark_single_color.stl",
      fileType: "stl",
      resourceId: "cm2pqc4h80001p70fpinrf1un",
      resourceTypeId: "cm2ntwfkj0000ily4t7dy7q3a",
      materialId: "cm2px4x4g00014hzawpbxoqc9",
      createdAt: "2024-10-22T01:19:30.815Z",
      updatedAt: "2024-10-29T20:35:55.227Z",
      active: true,
      processingTimeQty: null,
      timeQty: 1,
      unitQty: null,
      materialQty: 73,
      jobId: "cm2jl8hwj0001q4bxbfex38io",
      resource: {
        costingPublic: true,
        costPerProcessingTime: null,
        costPerTime: null,
        costPerUnit: null,
      },
      material: {
        costPerUnit: 0.025,
        unitDescriptor: "gram",
      },
    },
    {
      id: "cm2jrr9im00016j23co1m2xn3",
      title: "B2_Simple Color_Light Background.png",
      status: "COMPLETED",
      fileKey: "qugGCERsBT5eIhHCPH8eMyL5EdUAK7RksmTrXzO1S6P4QoD0",
      fileUrl:
        "https://utfs.io/f/qugGCERsBT5eIhHCPH8eMyL5EdUAK7RksmTrXzO1S6P4QoD0",
      fileName: "B2_Simple Color_Light Background.png",
      fileType: "png",
      resourceId: "cm2kv71cv0001c8g2l2x0qjn1",
      resourceTypeId: "cm2ntwfkj0000ily4t7dy7q3a",
      materialId: "cm2px4x4g00014hzawpbxoqc9",
      createdAt: "2024-10-22T01:30:53.805Z",
      updatedAt: "2024-10-29T20:31:46.677Z",
      active: true,
      processingTimeQty: null,
      timeQty: null,
      unitQty: null,
      materialQty: null,
      jobId: "cm2jl8hwj0001q4bxbfex38io",
      resource: {
        costingPublic: true,
        costPerProcessingTime: 15,
        costPerTime: 5,
        costPerUnit: 10,
      },
      material: {
        costPerUnit: 0.025,
        unitDescriptor: "gram",
      },
    },
    {
      id: "cm2jw43ge0005ec7nz5urnp6j",
      title: "HexOrganizerFull.stl",
      status: "IN_PROGRESS",
      fileKey: "qugGCERsBT5eHrKBoPIiOekmV0fptrxuQUGq7LRNynKlv18h",
      fileUrl:
        "https://utfs.io/f/qugGCERsBT5eHrKBoPIiOekmV0fptrxuQUGq7LRNynKlv18h",
      fileName: "HexOrganizerFull.stl",
      fileType: "stl",
      resourceId: "cm2lnygnj0007g7fe7pjflogz",
      resourceTypeId: null,
      materialId: null,
      createdAt: "2024-10-22T03:32:50.941Z",
      updatedAt: "2024-10-23T12:14:31.749Z",
      active: true,
      processingTimeQty: null,
      timeQty: null,
      unitQty: null,
      materialQty: null,
      jobId: "cm2jl8hwj0001q4bxbfex38io",
      resource: {
        costingPublic: true,
        costPerProcessingTime: null,
        costPerTime: 2,
        costPerUnit: 5,
      },
      material: null,
    },
  ],
  resource: {
    id: "cm2kv71cv0001c8g2l2x0qjn1",
    title: "Bambu Lab X1 Carbon",
  },
  additionalCosts: [
    {
      id: "cm2uvilsf0009mcbcpem5cxqd",
      resourceTypeId: "cm2ntwfkj0000ily4t7dy7q3a",
      resourceId: "cm2kv71cv0001c8g2l2x0qjn1",
      materialId: "cm2px4x4g00014hzawpbxoqc9",
      createdAt: "2024-10-29T20:01:36.208Z",
      updatedAt: "2024-10-29T20:01:36.208Z",
      unitQty: 1,
      timeQty: null,
      materialQty: null,
      processingTimeQty: null,
      active: true,
      jobId: "cm2jl8hwj0001q4bxbfex38io",
      resource: {
        costPerProcessingTime: 15,
        costPerTime: 5,
        costPerUnit: 10,
      },
      material: {
        costPerUnit: 0.025,
      },
    },
    {
      id: "cm2uzz56r000dpjtlzny2x2h0",
      resourceTypeId: "cm2uzx97s0001pjtlrojv6y30",
      resourceId: "cm2uzxmoc0005pjtldg20tygi",
      materialId: "cm2uzy4nf0009pjtlcawv9uwg",
      createdAt: "2024-10-29T22:06:26.307Z",
      updatedAt: "2024-10-29T22:06:26.307Z",
      unitQty: null,
      timeQty: 1,
      materialQty: null,
      processingTimeQty: null,
      active: true,
      jobId: "cm2jl8hwj0001q4bxbfex38io",
      resource: {
        costPerProcessingTime: 0,
        costPerTime: 75,
        costPerUnit: 0,
      },
      material: {
        costPerUnit: 0,
      },
    },
  ],
};

console.log(calculateTotalCostOfJob(data));

ejs.renderFile(
  "./invoice.ejs",
  { ...data, data, calculateTotalCostOfJob },
  (err, html) => {
    if (err) throw err;
    fs.writeFileSync("invoice.html", html);
  }
);
