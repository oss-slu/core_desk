import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";

const connectUserToShop = async (userId) =>
  prisma.userShop.create({
    data: {
      userId,
      shopId: tc.shop.id,
      accountType: "CUSTOMER",
    },
  });

const createGroup = async (title = "Ledger Group") =>
  prisma.billingGroup.create({
    data: {
      shopId: tc.shop.id,
      title,
      users: {
        create: {
          userId: tc.user.id,
          role: "MEMBER",
        },
      },
    },
  });

describe("/shop/[shopId]/ledger", () => {
  describe("GET", () => {
    it("returns positive owed values including debt and funds purchased", async () => {
      await connectUserToShop(tc.targetUser.id);
      const group = await createGroup("Ledger Group A");

      await prisma.ledgerItem.createMany({
        data: [
          {
            shopId: tc.shop.id,
            userId: tc.user.id,
            type: "JOB",
            value: -120,
          },
          {
            shopId: tc.shop.id,
            userId: tc.user.id,
            type: "FUNDS_PURCHASED",
            value: 30,
          },
          {
            shopId: tc.shop.id,
            userId: tc.targetUser.id,
            type: "MANUAL_DEPOSIT",
            value: 50,
          },
          {
            shopId: tc.shop.id,
            userId: tc.targetUser.id,
            type: "FUNDS_PURCHASED",
            value: 20,
          },
          {
            shopId: tc.shop.id,
            billingGroupId: group.id,
            type: "JOB",
            value: -60,
          },
          {
            shopId: tc.shop.id,
            billingGroupId: group.id,
            type: "FUNDS_PURCHASED",
            value: 40,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/ledger`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.rows).toHaveLength(3);

      const byPayer = Object.fromEntries(
        res.body.rows.map((row) => [row.payer, row])
      );

      expect(byPayer["TestFirstName TestLastName"]).toMatchObject({
        targetType: "USER",
        targetId: tc.user.id,
        value: 120,
      });
      expect(byPayer["TARGET_TestFirstName TARGET_TestLastName"]).toMatchObject(
        {
          targetType: "USER",
          targetId: tc.targetUser.id,
          value: 20,
        }
      );
      expect(byPayer["Ledger Group A"]).toMatchObject({
        targetType: "GROUP",
        targetId: group.id,
        value: 60,
      });

      for (const row of res.body.rows) {
        expect(row.value).toBeGreaterThan(0);
      }
    });

    it("forbids non-staff users", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/ledger`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /rectify", () => {
    it("rectifies a user balance and writes rectified logs", async () => {
      await prisma.ledgerItem.createMany({
        data: [
          {
            shopId: tc.shop.id,
            userId: tc.user.id,
            type: "JOB",
            value: -100,
          },
          {
            shopId: tc.shop.id,
            userId: tc.user.id,
            type: "FUNDS_PURCHASED",
            value: 25,
          },
        ],
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/ledger/rectify`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          targetType: "USER",
          targetId: tc.user.id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, created: 2 });

      const posted = await prisma.ledgerItem.findMany({
        where: {
          shopId: tc.shop.id,
          userId: tc.user.id,
          OR: [
            {
              type: "MANUAL_DEPOSIT",
              value: 125,
            },
            {
              type: "FUNDS_PURCHASED",
              value: -25,
            },
          ],
        },
      });
      expect(posted).toHaveLength(2);

      const logs = await prisma.logs.findMany({
        where: {
          shopId: tc.shop.id,
          ledgerItemId: {
            in: posted.map((item) => item.id),
          },
        },
      });

      expect(logs).toHaveLength(2);
      for (const log of logs) {
        expect(log.type).toBe("LEDGER_ITEM_RECTIFIED");
      }

      const summary = await request(app)
        .get(`/api/shop/${tc.shop.id}/ledger`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();
      expect(summary.status).toBe(200);
      expect(
        summary.body.rows.find(
          (row) => row.targetType === "USER" && row.targetId === tc.user.id
        )
      ).toBeFalsy();
    });

    it("forbids non-staff users", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/ledger/rectify`)
        .set(...(await gt()))
        .send({
          targetType: "USER",
          targetId: tc.user.id,
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("rectifies a billing group balance", async () => {
      const group = await createGroup("Rectify Group");
      await prisma.ledgerItem.create({
        data: {
          shopId: tc.shop.id,
          billingGroupId: group.id,
          type: "JOB",
          value: -40,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/ledger/rectify`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send({
          targetType: "GROUP",
          targetId: group.id,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, created: 1 });

      const posted = await prisma.ledgerItem.findMany({
        where: {
          shopId: tc.shop.id,
          billingGroupId: group.id,
          type: "MANUAL_DEPOSIT",
          value: 40,
        },
      });
      expect(posted).toHaveLength(1);

      const summary = await request(app)
        .get(`/api/shop/${tc.shop.id}/ledger`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();
      expect(summary.status).toBe(200);
      expect(
        summary.body.rows.find(
          (row) => row.targetType === "GROUP" && row.targetId === group.id
        )
      ).toBeFalsy();
    });

    it("returns 400 for invalid targets", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/ledger/rectify`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          targetType: "INVALID",
          targetId: tc.user.id,
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid target" });
    });
  });
});
