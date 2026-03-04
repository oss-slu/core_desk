import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";
import { LogType } from "#prisma-client";
import * as invoiceUtil from "../../../../../../util/docgen/invoice.js";

describe("/shop/[shopId]/job/[jobId]", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockInvoiceForJob = async (jobId, value = 42) => {
    const log = await prisma.logs.create({
      data: {
        type: LogType.JOB_INVOICE_GENERATED,
        userId: tc.user.id,
        shopId: tc.shop.id,
        jobId,
      },
    });

    vi.spyOn(invoiceUtil, "generateInvoice").mockResolvedValue({
      url: "https://example.com/invoice.pdf",
      key: "invoice-key",
      value,
      log,
    });

    return log;
  };

  it("finalizes a grouped job by charging the billing group, not the user", async () => {
    const group = await prisma.billingGroup.create({
      data: {
        shopId: tc.shop.id,
        title: "Group For Finalize Test",
      },
    });

    const job = await prisma.job.create({
      data: {
        title: "Grouped Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
        groupId: group.id,
      },
    });

    const invoiceLog = await mockInvoiceForJob(job.id, 55);

    const res = await request(app)
      .put(`/api/shop/${tc.shop.id}/job/${job.id}`)
      .set(...(await gt({ sat: "ADMIN" })))
      .send({ finalized: true });

    expect(res.status).toBe(200);
    expect(res.body.job.finalized).toBe(true);
    expect(res.body.job.billingAccount.type).toBe("GROUP");
    expect(res.body.job.billingAccount.id).toBe(group.id);

    const ledgerItem = await prisma.ledgerItem.findUnique({
      where: {
        jobId: job.id,
      },
    });

    expect(ledgerItem).toBeDefined();
    expect(ledgerItem.userId).toBeNull();
    expect(ledgerItem.billingGroupId).toBe(group.id);
    expect(ledgerItem.value).toBe(-55);
    expect(ledgerItem.type).toBe("JOB");

    const userOwnedChargeCount = await prisma.ledgerItem.count({
      where: {
        jobId: job.id,
        userId: {
          not: null,
        },
      },
    });
    expect(userOwnedChargeCount).toBe(0);

    const updatedInvoiceLog = await prisma.logs.findUnique({
      where: {
        id: invoiceLog.id,
      },
    });
    expect(updatedInvoiceLog.ledgerItemId).toBe(ledgerItem.id);
  });

  it("finalizes a non-grouped job by charging the user account", async () => {
    const job = await prisma.job.create({
      data: {
        title: "Individual Job",
        shopId: tc.shop.id,
        userId: tc.user.id,
      },
    });

    await mockInvoiceForJob(job.id, 33);

    const res = await request(app)
      .put(`/api/shop/${tc.shop.id}/job/${job.id}`)
      .set(...(await gt({ sat: "ADMIN" })))
      .send({ finalized: true });

    expect(res.status).toBe(200);
    expect(res.body.job.billingAccount.type).toBe("USER");
    expect(res.body.job.billingAccount.id).toBe(tc.user.id);

    const ledgerItem = await prisma.ledgerItem.findUnique({
      where: {
        jobId: job.id,
      },
    });

    expect(ledgerItem).toBeDefined();
    expect(ledgerItem.userId).toBe(tc.user.id);
    expect(ledgerItem.billingGroupId).toBeNull();
    expect(ledgerItem.value).toBe(-33);
    expect(ledgerItem.type).toBe("JOB");
  });
});
