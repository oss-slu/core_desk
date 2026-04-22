import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";

describe("/shop/[shopId]/resources/type", () => {
  it("migration backfill seeds both costing modes with the expected defaults", async () => {
    const migration = await readFile(
      new URL(
        "../../../../../../prisma/migrations/20260417120000_add_resource_type_costing_criteria/migration.sql",
        import.meta.url
      ),
      "utf8"
    );

    expect(migration).toContain(
      `"ResourceType"."costingMode" = 'CALCULATE_WITH_RESOURCE_AND_MATERIAL'`
    );
    expect(migration).toContain(`'RESOURCE_TIME'::"CostingCriterionType"`);
    expect(migration).toContain(`'PROCESSING_TIME'::"CostingCriterionType"`);
    expect(migration).toContain(`'UNIT_RUNS'::"CostingCriterionType"`);
    expect(migration).toContain(`'PRIMARY_MATERIAL'::"CostingCriterionType"`);
    expect(migration).toContain(`'SECONDARY_MATERIAL'::"CostingCriterionType"`);
    expect(migration).toContain(`'Raw value'`);
    expect(migration).toContain(
      `"ResourceType"."costingMode" = 'RAW_VALUE_ENTRY'`
    );
  });

  it("auto-seeds calculated resource types with default costing criteria", async () => {
    const res = await request(app)
      .post(`/api/shop/${tc.shop.id}/resources/type`)
      .set(...(await gt({ sat: "ADMIN" })))
      .send({
        title: "Laser Cutter",
        shopId: tc.shop.id,
        costingMode: "CALCULATE_WITH_RESOURCE_AND_MATERIAL",
      });

    expect(res.status).toBe(200);
    expect(res.body.resourceType.costingCriteria).toEqual([
      expect.objectContaining({
        criteronType: "RESOURCE_TIME",
        label: "Resource Time",
        enabled: true,
        displayOrder: 0,
      }),
      expect.objectContaining({
        criteronType: "PROCESSING_TIME",
        label: "Processing Time",
        enabled: true,
        displayOrder: 1,
      }),
      expect.objectContaining({
        criteronType: "UNIT_RUNS",
        label: "Unit runs",
        enabled: true,
        displayOrder: 2,
      }),
      expect.objectContaining({
        criteronType: "PRIMARY_MATERIAL",
        label: "Material quantity",
        enabled: true,
        displayOrder: 3,
      }),
      expect.objectContaining({
        criteronType: "SECONDARY_MATERIAL",
        label: "Secondary Material quantity",
        enabled: false,
        displayOrder: 4,
      }),
    ]);
  });

  it("auto-seeds raw-value resource types with only RAW_VALUE", async () => {
    const res = await request(app)
      .post(`/api/shop/${tc.shop.id}/resources/type`)
      .set(...(await gt({ sat: "ADMIN" })))
      .send({
        title: "Manual Service",
        shopId: tc.shop.id,
        costingMode: "RAW_VALUE_ENTRY",
      });

    expect(res.status).toBe(200);
    expect(res.body.resourceType.costingCriteria).toEqual([
      expect.objectContaining({
        criteronType: "RAW_VALUE",
        label: "Raw value",
        enabled: true,
        displayOrder: 0,
      }),
    ]);
  });

  it("rejects invalid raw-value combinations", async () => {
    const resourceType = await prisma.resourceType.create({
      data: {
        title: "Manual Service",
        shopId: tc.shop.id,
        costingMode: "RAW_VALUE_ENTRY",
        costingCriteria: {
          createMany: {
            data: [
              {
                criteronType: "RAW_VALUE",
                label: "Raw value",
                enabled: true,
                displayOrder: 0,
              },
            ],
          },
        },
      },
    });

    const res = await request(app)
      .put(
        `/api/shop/${tc.shop.id}/resources/type/${resourceType.id}/costingCriteria`
      )
      .set(...(await gt({ sat: "ADMIN" })))
      .send({
        criteria: [
          {
            criteronType: "RAW_VALUE",
            label: "Raw value",
            enabled: true,
            displayOrder: 0,
          },
          {
            criteronType: "RESOURCE_TIME",
            label: "Resource Time",
            enabled: true,
            displayOrder: 1,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("RAW_VALUE");
  });

  it("rejects calculated criteria that include RAW_VALUE or disable everything", async () => {
    const resourceType = await prisma.resourceType.create({
      data: {
        title: "Printer",
        shopId: tc.shop.id,
        costingMode: "CALCULATE_WITH_RESOURCE_AND_MATERIAL",
        costingCriteria: {
          createMany: {
            data: [
              {
                criteronType: "UNIT_RUNS",
                label: "Unit runs",
                enabled: true,
                displayOrder: 0,
              },
            ],
          },
        },
      },
    });

    const rawRes = await request(app)
      .put(
        `/api/shop/${tc.shop.id}/resources/type/${resourceType.id}/costingCriteria`
      )
      .set(...(await gt({ sat: "ADMIN" })))
      .send({
        criteria: [
          {
            criteronType: "RAW_VALUE",
            label: "Raw value",
            enabled: true,
            displayOrder: 0,
          },
        ],
      });

    expect(rawRes.status).toBe(400);
    expect(rawRes.body.error).toContain("RAW_VALUE");

    const noneEnabledRes = await request(app)
      .put(
        `/api/shop/${tc.shop.id}/resources/type/${resourceType.id}/costingCriteria`
      )
      .set(...(await gt({ sat: "ADMIN" })))
      .send({
        criteria: [
          {
            criteronType: "UNIT_RUNS",
            label: "Unit runs",
            enabled: false,
            displayOrder: 0,
          },
        ],
      });

    expect(noneEnabledRes.status).toBe(400);
    expect(noneEnabledRes.body.error).toContain("enabled");
  });
});
