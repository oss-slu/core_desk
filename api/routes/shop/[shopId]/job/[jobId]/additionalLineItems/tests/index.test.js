import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";

describe("/shop/[shopId]/job/[jobId]/additionalLineItems", () => {
  it("creates amount-based additional cost items with safe defaults", async () => {
    const job = await prisma.job.create({
      data: {
        title: "Job for additional amount test",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    const res = await request(app)
      .post(`/api/shop/${tc.shop.id}/job/${job.id}/additionalLineItems`)
      .set(...(await gt({ sat: "OPERATOR" })))
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.newLineItem).toMatchObject({
      jobId: job.id,
      amount: 0,
      resourceTypeId: null,
      resourceId: null,
      materialId: null,
      secondaryMaterialId: null,
      timeQty: null,
      processingTimeQty: null,
      unitQty: null,
      materialQty: null,
      secondaryMaterialQty: null,
    });
    expect(res.body.lineItems).toHaveLength(1);
    expect(res.body.lineItems[0].id).toBe(res.body.newLineItem.id);
  });

  it("updates additional cost amount and clamps negatives to zero", async () => {
    const job = await prisma.job.create({
      data: {
        title: "Job for additional amount update test",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    const lineItem = await prisma.additionalCostLineItem.create({
      data: {
        jobId: job.id,
        amount: 5,
      },
    });

    const updateRes = await request(app)
      .put(
        `/api/shop/${tc.shop.id}/job/${job.id}/additionalLineItems/${lineItem.id}`
      )
      .set(...(await gt({ sat: "OPERATOR" })))
      .send({ amount: 12.34 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.lineItem.amount).toBe(12.34);

    const clampRes = await request(app)
      .put(
        `/api/shop/${tc.shop.id}/job/${job.id}/additionalLineItems/${lineItem.id}`
      )
      .set(...(await gt({ sat: "OPERATOR" })))
      .send({ amount: -10 });

    expect(clampRes.status).toBe(200);
    expect(clampRes.body.lineItem.amount).toBe(0);

    const dbLineItem = await prisma.additionalCostLineItem.findUnique({
      where: {
        id: lineItem.id,
      },
    });
    expect(dbLineItem.amount).toBe(0);
  });

  it("includes amount-based additional costs in job totalCost", async () => {
    const job = await prisma.job.create({
      data: {
        title: "Job for total cost amount test",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    await prisma.additionalCostLineItem.create({
      data: {
        jobId: job.id,
        amount: 17.25,
      },
    });

    const res = await request(app)
      .get(`/api/shop/${tc.shop.id}/job`)
      .set(...(await gt()));

    expect(res.status).toBe(200);

    const found = res.body.jobs.find((_) => _.id === job.id);
    expect(found).toBeDefined();
    expect(found.totalCost).toBe(17.25);
  });
});
