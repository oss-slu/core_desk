import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";
import { LedgerItemType, LogType } from "@prisma/client";

describe("/shop/[shopId]", () => {
  describe("GET", () => {
    it("returns a shop and a user's membership in said shop", async () => {
      const shop = await prisma.shop.findFirst({});

      const res = await request(app)
        .get(`/api/shop/${shop.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.shop).toMatchSnapshot({
        id: expect.any(String),
      });
      expect(res.body.userShop).toMatchSnapshot();
    });

    it("returns a shop and a user's membership in said shop with users when the user is a global admin", async () => {
      const shop = await prisma.shop.findFirst({});

      const res = await request(app)
        .get(`/api/shop/${shop.id}?includeUsers=true`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0]).toMatchSnapshot({
        createdAt: expect.any(String),
        id: expect.any(String),
        shopId: expect.any(String),
        updatedAt: expect.any(String),
        userId: expect.any(String),
        user: {
          createdAt: expect.any(String),
          id: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it("returns a shop and a user's membership in said shop with users when the user is a shop-level admin", async () => {
      const userShop = await prisma.userShop.findFirst({
        where: {
          user: {
            email: "test@email.com",
          },
        },
      });

      await prisma.userShop.updateMany({
        where: {
          id: userShop.id,
        },
        data: {
          accountType: "ADMIN",
        },
      });

      const res = await request(app)
        .get(`/api/shop/${userShop.shopId}?includeUsers=true`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0]).toMatchSnapshot({
        id: expect.any(String),
        userId: expect.any(String),
        createdAt: expect.any(String),
        shopId: expect.any(String),
        updatedAt: expect.any(String),
        user: {
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it("returns a shop and a user's membership in said shop with users when the user is an operator", async () => {
      const userShop = await prisma.userShop.findFirst({
        where: {
          user: {
            email: "test@email.com",
          },
        },
      });

      await prisma.userShop.updateMany({
        where: {
          id: userShop.id,
        },
        data: {
          accountType: "OPERATOR",
        },
      });

      const res = await request(app)
        .get(`/api/shop/${userShop.shopId}?includeUsers=true`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0]).toMatchSnapshot({
        createdAt: expect.any(String),
        id: expect.any(String),
        shopId: expect.any(String),
        updatedAt: expect.any(String),
        userId: expect.any(String),
        user: {
          createdAt: expect.any(String),
          id: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it("returns 403 when the user is not an admin (customer) but requests users", async () => {
      const userShop = await prisma.userShop.findFirst({
        where: {
          user: {
            email: "test@email.com",
          },
        },
      });

      await prisma.userShop.updateMany({
        where: {
          id: userShop.id,
        },
        data: {
          accountType: "CUSTOMER",
        },
      });

      const res = await request(app)
        .get(`/api/shop/${userShop.shopId}?includeUsers=true`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("returns 403 when the user is not an admin (group admin) but requests users", async () => {
      const userShop = await prisma.userShop.findFirst({
        where: {
          user: {
            email: "test@email.com",
          },
        },
      });

      await prisma.userShop.updateMany({
        where: {
          id: userShop.id,
        },
        data: {
          accountType: "GROUP_ADMIN",
        },
      });

      const res = await request(app)
        .get(`/api/shop/${userShop.shopId}?includeUsers=true`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("properly aggregates the user's job counts", async () => {
      const userShop = await prisma.userShop.findFirst({
        where: {
          user: {
            email: "test@email.com",
          },
        },
      });

      await prisma.job.createMany({
        data: [
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 1",
            status: "COMPLETED",
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 2",
            status: "COMPLETED",
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 3",
            status: "NOT_STARTED",
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 4",
            status: "IN_PROGRESS",
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 5",
            status: "WAITING",
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 6",
            status: "CANCELLED",
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 7",
            status: "WONT_DO",
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 8",
            status: "WAITING_FOR_PICKUP",
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            title: "Test Job 9",
            status: "WAITING_FOR_PAYMENT",
          },
        ],
      });

      const res = await request(app)
        .get(`/api/shop/${userShop.shopId}?includeUsers=true`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.users[0].user.jobCounts).toMatchObject({
        completedCount: 2,
        inProgressCount: 1,
        notStartedCount: 1,
        excludedCount: 5,
      });
    });

    it("prperly aggregates the user's balance", async () => {
      const userShop = await prisma.userShop.findFirst({
        where: {
          user: {
            email: "test@email.com",
          },
        },
      });

      await prisma.ledgerItem.createMany({
        data: [
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            type: LedgerItemType.INITIAL,
            value: 100,
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            type: LedgerItemType.JOB,
            value: -10,
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            type: LedgerItemType.JOB,
            value: -20,
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            type: LedgerItemType.AUTOMATED_TOPUP,
            value: 30,
          },
          {
            userId: userShop.userId,
            shopId: userShop.shopId,
            type: LedgerItemType.MANUAL_TOPUP,
            value: 40,
          },
        ],
      });

      const res = await request(app)
        .get(`/api/shop/${userShop.shopId}?includeUsers=true`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.users[0].user.balance).toBe(140);
    });

    it("returns 404 if the shop does not exist", async () => {
      const res = await request(app)
        .get(`/api/shop/12345`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Shop not found" });
    });
  });

  describe("PUT", () => {
    it("updates the shop", async () => {
      const shop = await prisma.shop.findFirst({});

      const res = await request(app)
        .put(`/api/shop/${shop.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          name: "TestShop2",
          description: "TestShop2 description",
          imageUrl: "https://example.com/image.png",
          color: "BLUE",
        });

      expect(res.status).toBe(200);

      const updatedShop = await prisma.shop.findFirst({
        where: {
          id: shop.id,
        },
      });

      expect(updatedShop.name).toBe("TestShop2");
      expect(updatedShop.description).toBe("TestShop2 description");
      expect(updatedShop.imageUrl).toBe("https://example.com/image.png");
      expect(updatedShop.color).toBe("BLUE");
    });

    it("returns 400 when the supplied data is invalid", async () => {
      const shop = await prisma.shop.findFirst({});

      const res = await request(app)
        .put(`/api/shop/${shop.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          name: 7,
        });

      expect(res.status).toBe(400);
    });

    it("forces a floaty starting deposit to be a float", async () => {
      const shop = await prisma.shop.findFirst({});

      const res = await request(app)
        .put(`/api/shop/${shop.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          name: "TestShop2",
          startingDeposit: "100.5",
        });

      expect(res.status).toBe(200);

      const updatedShop = await prisma.shop.findFirst({
        where: {
          id: shop.id,
        },
      });

      expect(updatedShop.startingDeposit).toBe(100.5);
    });

    it("ignores erroneous keys", async () => {
      const shop = await prisma.shop.findFirst({});

      const res = await request(app)
        .put(`/api/shop/${shop.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          name: "TestShop2",
          description: "TestShop2 description",
          imageUrl: "https://example.com/image.png",
          color: "BLUE",
          invalidKey: "invalidValue",
        });

      expect(res.status).toBe(200);

      const updatedShop = await prisma.shop.findFirst({
        where: {
          id: shop.id,
        },
      });

      expect(updatedShop.name).toBe("TestShop2");
      expect(updatedShop.description).toBe("TestShop2 description");
      expect(updatedShop.imageUrl).toBe("https://example.com/image.png");
      expect(updatedShop.color).toBe("BLUE");
    });

    it("logs the shop update", async () => {
      const shop = await prisma.shop.findFirst({});

      const res = await request(app)
        .put(`/api/shop/${shop.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          name: "TestShop2",
          description: "TestShop2 description",
          imageUrl: "https://example.com/image.png",
          color: "BLUE",
        });

      expect(res.status).toBe(200);

      const log = await prisma.logs.findFirst({
        where: {
          type: LogType.SHOP_MODIFIED,
          shopId: shop.id,
        },
      });

      expect(log).toBeDefined();
    });

    it("returns 404 if the shop does not exist", async () => {
      const res = await request(app)
        .put(`/api/shop/12345`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Shop not found" });
    });

    it("returns 403 if the user is not an admin", async () => {
      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });
  });
});
