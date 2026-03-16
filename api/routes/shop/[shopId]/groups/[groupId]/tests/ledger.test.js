import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";

const createGroup = async () =>
  prisma.billingGroup.create({
    data: {
      shopId: tc.shop.id,
      title: "Ledger Test Group",
      users: {
        create: {
          userId: tc.user.id,
          role: "MEMBER",
        },
      },
    },
  });

describe("/shop/[shopId]/groups/[groupId]/ledger", () => {
  describe("GET", () => {
    it("returns group ledger items and the balance for a group member", async () => {
      const group = await createGroup();

      await prisma.ledgerItem.createMany({
        data: [
          {
            shopId: tc.shop.id,
            billingGroupId: group.id,
            type: "MANUAL_DEPOSIT",
            value: 100,
          },
          {
            shopId: tc.shop.id,
            billingGroupId: group.id,
            type: "MANUAL_REDUCTION",
            value: -30,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/groups/${group.id}/ledger`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.ledgerItems).toHaveLength(2);
      expect(res.body.balance).toBe(70);
    });
  });

  describe("POST", () => {
    it("allows global admins to post group ledger items", async () => {
      const group = await createGroup();

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups/${group.id}/ledger`)
        .set(...(await gt({ ga: true })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 50,
        });

      expect(res.status).toBe(200);

      const posted = await prisma.ledgerItem.findFirst({
        where: {
          billingGroupId: group.id,
          shopId: tc.shop.id,
        },
      });

      expect(posted).toBeDefined();
      expect(posted.userId).toBeNull();
      expect(posted.billingGroupId).toBe(group.id);
      expect(posted.value).toBe(50);
      expect(posted.type).toBe("MANUAL_DEPOSIT");
    });

    it("allows shop admins and operators to post group ledger items", async () => {
      const group = await createGroup();

      const adminRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups/${group.id}/ledger`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 20,
        });
      expect(adminRes.status).toBe(200);

      const operatorRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups/${group.id}/ledger`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 10,
        });
      expect(operatorRes.status).toBe(200);
    });

    it("forbids customers and group admins from posting group ledger items", async () => {
      const group = await createGroup();

      const customerRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups/${group.id}/ledger`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 20,
        });
      expect(customerRes.status).toBe(403);

      const groupAdminRes = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups/${group.id}/ledger`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send({
          type: "MANUAL_DEPOSIT",
          value: 20,
        });
      expect(groupAdminRes.status).toBe(403);
    });

    it("applies topup math against the current group balance", async () => {
      const group = await createGroup();
      await prisma.ledgerItem.create({
        data: {
          shopId: tc.shop.id,
          billingGroupId: group.id,
          type: "MANUAL_DEPOSIT",
          value: 40,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups/${group.id}/ledger`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          type: "MANUAL_TOPUP",
          value: 100,
        });

      expect(res.status).toBe(200);
      const latest = res.body.ledgerItems[0];
      expect(latest.type).toBe("MANUAL_TOPUP");
      expect(latest.value).toBe(60);
      expect(res.body.balance).toBe(100);
    });
  });
});
