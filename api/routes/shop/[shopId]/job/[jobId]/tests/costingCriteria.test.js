import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";
import { LogType } from "#prisma-client";
import * as invoiceUtil from "../../../../../../util/docgen/invoice.js";

const createCalculatedBundle = async ({
  criteria,
  resourceCostPerUnit = 5,
  resourceCostPerTime = 10,
  resourceCostPerProcessingTime = 3,
  materialCostPerUnit = 2,
  secondaryMaterialCostPerUnit = 7,
} = {}) => {
  const resourceType = await prisma.resourceType.create({
    data: {
      title: "Configured Type",
      shopId: tc.shop.id,
      costingMode: "CALCULATE_WITH_RESOURCE_AND_MATERIAL",
      costingCriteria: criteria
        ? {
            createMany: {
              data: criteria,
            },
          }
        : undefined,
    },
    include: {
      costingCriteria: true,
    },
  });

  const resource = await prisma.resource.create({
    data: {
      title: "Configured Resource",
      shopId: tc.shop.id,
      resourceTypeId: resourceType.id,
      costPerUnit: resourceCostPerUnit,
      costPerTime: resourceCostPerTime,
      costPerProcessingTime: resourceCostPerProcessingTime,
    },
  });

  const material = await prisma.material.create({
    data: {
      title: "Configured Material",
      shopId: tc.shop.id,
      resourceTypeId: resourceType.id,
      costPerUnit: materialCostPerUnit,
    },
  });

  const secondaryMaterial = await prisma.material.create({
    data: {
      title: "Secondary Material",
      shopId: tc.shop.id,
      resourceTypeId: resourceType.id,
      costPerUnit: secondaryMaterialCostPerUnit,
    },
  });

  return { resourceType, resource, material, secondaryMaterial };
};

describe("/shop/[shopId]/job/[jobId] costing criteria", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("job item totals ignore disabled criteria", async () => {
    const { resourceType, resource, material, secondaryMaterial } =
      await createCalculatedBundle({
        criteria: [
          {
            costingCriterionType: "RESOURCE_TIME",
            label: "Resource Time",
            enabled: false,
            displayOrder: 0,
          },
          {
            costingCriterionType: "UNIT_RUNS",
            label: "Unit runs",
            enabled: true,
            displayOrder: 1,
          },
          {
            costingCriterionType: "PRIMARY_MATERIAL",
            label: "Material quantity",
            enabled: true,
            displayOrder: 2,
          },
          {
            costingCriterionType: "SECONDARY_MATERIAL",
            label: "Secondary Material quantity",
            enabled: false,
            displayOrder: 3,
          },
        ],
      });

    const job = await prisma.job.create({
      data: {
        title: "Configured Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    await prisma.jobItem.create({
      data: {
        title: "Configured Item",
        jobId: job.id,
        resourceTypeId: resourceType.id,
        resourceId: resource.id,
        materialId: material.id,
        secondaryMaterialId: secondaryMaterial.id,
        qty: 1,
        timeQty: 9,
        unitQty: 2,
        materialQty: 3,
        secondaryMaterialQty: 4,
      },
    });

    const res = await request(app)
      .get(`/api/shop/${tc.shop.id}/job`)
      .set(...(await gt({ sat: "ADMIN" })));

    expect(res.status).toBe(200);
    const found = res.body.jobs.find((candidate) => candidate.id === job.id);
    expect(found.totalCost).toBe(16);
  });

  it("additional line item totals ignore disabled criteria", async () => {
    const { resourceType, resource, material, secondaryMaterial } =
      await createCalculatedBundle({
        criteria: [
          {
            costingCriterionType: "PROCESSING_TIME",
            label: "Processing Time",
            enabled: false,
            displayOrder: 0,
          },
          {
            costingCriterionType: "UNIT_RUNS",
            label: "Unit runs",
            enabled: true,
            displayOrder: 1,
          },
          {
            costingCriterionType: "PRIMARY_MATERIAL",
            label: "Material quantity",
            enabled: true,
            displayOrder: 2,
          },
          {
            costingCriterionType: "SECONDARY_MATERIAL",
            label: "Secondary Material quantity",
            enabled: false,
            displayOrder: 3,
          },
        ],
      });

    const job = await prisma.job.create({
      data: {
        title: "Additional Cost Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    await prisma.additionalCostLineItem.create({
      data: {
        jobId: job.id,
        resourceTypeId: resourceType.id,
        resourceId: resource.id,
        materialId: material.id,
        secondaryMaterialId: secondaryMaterial.id,
        processingTimeQty: 10,
        unitQty: 2,
        materialQty: 3,
        secondaryMaterialQty: 5,
      },
    });

    const res = await request(app)
      .get(`/api/shop/${tc.shop.id}/job`)
      .set(...(await gt({ sat: "ADMIN" })));

    expect(res.status).toBe(200);
    const found = res.body.jobs.find((candidate) => candidate.id === job.id);
    expect(found.totalCost).toBe(16);
  });

  it("raw-value types only use RAW_VALUE", async () => {
    const resourceType = await prisma.resourceType.create({
      data: {
        title: "Raw Service",
        shopId: tc.shop.id,
        costingMode: "RAW_VALUE_ENTRY",
        costingCriteria: {
          createMany: {
            data: [
              {
                costingCriterionType: "RAW_VALUE",
                label: "Raw value",
                enabled: true,
                displayOrder: 0,
              },
            ],
          },
        },
      },
    });

    const resource = await prisma.resource.create({
      data: {
        title: "Ignored Resource",
        shopId: tc.shop.id,
        resourceTypeId: resourceType.id,
        costPerUnit: 999,
        costPerTime: 999,
      },
    });

    const material = await prisma.material.create({
      data: {
        title: "Ignored Material",
        shopId: tc.shop.id,
        resourceTypeId: resourceType.id,
        costPerUnit: 999,
      },
    });

    const job = await prisma.job.create({
      data: {
        title: "Raw Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    await prisma.jobItem.create({
      data: {
        title: "Raw Item",
        jobId: job.id,
        resourceTypeId: resourceType.id,
        resourceId: resource.id,
        materialId: material.id,
        qty: 2,
        rawValue: 15,
        timeQty: 8,
        unitQty: 9,
        materialQty: 10,
      },
    });

    const res = await request(app)
      .get(`/api/shop/${tc.shop.id}/job`)
      .set(...(await gt({ sat: "ADMIN" })));

    const found = res.body.jobs.find((candidate) => candidate.id === job.id);
    expect(found.totalCost).toBe(30);
  });

  it("calculated types never use RAW_VALUE", async () => {
    const { resourceType, resource, material } = await createCalculatedBundle({
      criteria: [
        {
          costingCriterionType: "UNIT_RUNS",
          label: "Unit runs",
          enabled: true,
          displayOrder: 0,
        },
      ],
      resourceCostPerUnit: 4,
      materialCostPerUnit: 1,
    });

    const job = await prisma.job.create({
      data: {
        title: "Calculated Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    await prisma.jobItem.create({
      data: {
        title: "Calculated Item",
        jobId: job.id,
        resourceTypeId: resourceType.id,
        resourceId: resource.id,
        materialId: material.id,
        qty: 2,
        rawValue: 999,
        unitQty: 3,
      },
    });

    const res = await request(app)
      .get(`/api/shop/${tc.shop.id}/job`)
      .set(...(await gt({ sat: "ADMIN" })));

    const found = res.body.jobs.find((candidate) => candidate.id === job.id);
    expect(found.totalCost).toBe(24);
  });

  it("stores the costing snapshot when finalizing invoices", async () => {
    const job = await prisma.job.create({
      data: {
        title: "Finalize Snapshot Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    const snapshot = [
      {
        resourceTypeId: "rt_1",
        criteria: [
          {
            costingCriterionType: "UNIT_RUNS",
            label: "Build plates",
            displayOrder: 0,
          },
        ],
      },
    ];

    const log = await prisma.logs.create({
      data: {
        type: LogType.JOB_INVOICE_GENERATED,
        userId: tc.user.id,
        shopId: tc.shop.id,
        jobId: job.id,
      },
    });

    vi.spyOn(invoiceUtil, "generateInvoice").mockResolvedValue({
      url: "https://example.com/invoice.pdf",
      key: "invoice-key",
      value: 42,
      costingCriteriaSnapshot: snapshot,
      log,
    });

    const res = await request(app)
      .put(`/api/shop/${tc.shop.id}/job/${job.id}`)
      .set(...(await gt({ sat: "ADMIN" })))
      .send({ finalized: true });

    expect(res.status).toBe(200);

    const ledgerItem = await prisma.ledgerItem.findUnique({
      where: {
        jobId: job.id,
      },
    });

    expect(ledgerItem.costingCriteriaSnapshot).toEqual(snapshot);
  });

  it("preserves stored snapshots for historical finalized invoices after criteria changes", async () => {
    const job = await prisma.job.create({
      data: {
        title: "Historical Snapshot Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
        finalized: true,
        finalizedAt: new Date(),
      },
    });

    const storedSnapshot = [
      {
        resourceTypeId: "rt_1",
        criteria: [
          {
            costingCriterionType: "UNIT_RUNS",
            label: "Original Label",
            displayOrder: 0,
          },
        ],
      },
    ];

    await prisma.ledgerItem.create({
      data: {
        shopId: tc.shop.id,
        jobId: job.id,
        userId: tc.user.id,
        invoiceUrl: "https://example.com/original.pdf",
        invoiceKey: "original-key",
        value: -33,
        type: "JOB",
        costingCriteriaSnapshot: storedSnapshot,
      },
    });

    const log = await prisma.logs.create({
      data: {
        type: LogType.JOB_INVOICE_GENERATED,
        userId: tc.user.id,
        shopId: tc.shop.id,
        jobId: job.id,
      },
    });

    vi.spyOn(invoiceUtil, "generateInvoice").mockResolvedValue({
      url: "https://example.com/new.pdf",
      key: "new-key",
      value: 99,
      costingCriteriaSnapshot: [
        {
          resourceTypeId: "rt_1",
          criteria: [
            {
              costingCriterionType: "UNIT_RUNS",
              label: "Changed Label",
              displayOrder: 0,
            },
          ],
        },
      ],
      log,
    });

    const res = await request(app)
      .post(`/api/shop/${tc.shop.id}/job/${job.id}/regenerate-invoice`)
      .set(...(await gt({ sat: "ADMIN" })));

    expect(res.status).toBe(200);

    const ledgerItem = await prisma.ledgerItem.findUnique({
      where: {
        jobId: job.id,
      },
    });

    expect(ledgerItem.costingCriteriaSnapshot).toEqual(storedSnapshot);
    expect(ledgerItem.value).toBe(-33);
  });

  it("legacy resource types without manual criteria edits still behave like the old defaults", async () => {
    const { resourceType, resource, material, secondaryMaterial } =
      await createCalculatedBundle({
        criteria: null,
        resourceCostPerUnit: 2,
        resourceCostPerTime: 10,
        resourceCostPerProcessingTime: 3,
        materialCostPerUnit: 5,
        secondaryMaterialCostPerUnit: 7,
      });

    const job = await prisma.job.create({
      data: {
        title: "Legacy Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    await prisma.jobItem.create({
      data: {
        title: "Legacy Item",
        jobId: job.id,
        resourceTypeId: resourceType.id,
        resourceId: resource.id,
        materialId: material.id,
        secondaryMaterialId: secondaryMaterial.id,
        qty: 1,
        timeQty: 1,
        processingTimeQty: 2,
        unitQty: 3,
        materialQty: 4,
        secondaryMaterialQty: 5,
      },
    });

    const res = await request(app)
      .get(`/api/shop/${tc.shop.id}/job`)
      .set(...(await gt({ sat: "ADMIN" })));

    const found = res.body.jobs.find((candidate) => candidate.id === job.id);
    expect(found.totalCost).toBe(77);
  });
});
