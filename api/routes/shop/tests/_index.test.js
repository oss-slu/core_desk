import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma as mockPrisma } from "#mock-prisma";
import { prisma } from "#prisma";
import { LedgerItemType, LogType } from "@prisma/client";

describe("/shop", () => {
  describe("GET", () => {
    it("provides a list of all shops to global admins", async () => {
      await prisma.shop.create({
        data: {
          name: "TestShopWithoutUser",
        },
      });

      const res = await request(app)
        .get("/api/shop")
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.shops).toHaveLength(2);
      expect(res.body.shops[0]).toMatchSnapshot({
        id: expect.any(String),
      });
    });
    it("provides a list of shops that the user is a member of", async () => {
      const shopWithoutUser = await prisma.shop.create({
        data: {
          name: "TestShopWithoutUser",
        },
      });

      const res = await request(app)
        .get("/api/shop")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.shops).toHaveLength(1);
      expect(res.body.shops[0].id).not.toBe(shopWithoutUser.id);

      expect(res.body.shops[0]).toMatchSnapshot({
        id: expect.any(String),
      });
    });
  });
  describe("POST", () => {
    it("should return 403 if user is not a global admin", async () => {
      const res = await request(app)
        .post("/api/shop")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
      expect(mockPrisma.shop.create).not.toHaveBeenCalled();
    });

    it("should return 400 if the name is not provided", async () => {
      const res = await request(app)
        .post("/api/shop")
        .set(...(await gt({ ga: true })))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Name is required",
      });
      expect(mockPrisma.shop.create).not.toHaveBeenCalled();
    });

    it("should return the created shop", async () => {
      const res = await request(app)
        .post("/api/shop")
        .set(...(await gt({ ga: true })))
        .send({
          name: "NewTestShop",
        });

      expect(res.status).toBe(200);
      expect(res.body.shop).toMatchSnapshot({
        id: expect.any(String),
      });
    });

    it("should add the current user as an admin of the shop", async () => {
      const res = await request(app)
        .post("/api/shop")
        .set(...(await gt({ ga: true })))
        .send({
          name: "NewTestShop",
        });

      const shop = await prisma.shop.findFirst({
        where: {
          id: res.body.shop.id,
        },
        include: {
          users: {
            where: {
              user: {
                email: "test@email.com",
              },
              accountType: "ADMIN",
            },
          },
        },
      });

      expect(shop.users).toHaveLength(1);
    });

    it("should post the initial deposit to the user", async () => {
      const res = await request(app)
        .post("/api/shop")
        .set(...(await gt({ ga: true })))
        .send({
          name: "NewTestShop",
          startingDeposit: 100,
        });

      const user = await prisma.user.findFirst({
        where: {
          email: "test@email.com",
        },
        include: {
          ledgerItems: {
            where: {
              type: LedgerItemType.INITIAL,
            },
          },
        },
      });

      expect(user.ledgerItems).toHaveLength(1);
      expect(user.ledgerItems[0].value).toBe(100);

      const userRes = await request(app)
        .get(`/api/shop/${res.body.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(userRes.body.userShop.user.balance).toBe(100);
    });

    it("should convert floaty starting deposits to floats and add them", async () => {
      await request(app)
        .post("/api/shop")
        .set(...(await gt({ ga: true })))
        .send({
          name: "NewTestShop",
          startingDeposit: "100.5",
        });

      const shop = await prisma.shop.findFirst({
        where: {
          name: "NewTestShop",
        },
      });

      expect(shop.startingDeposit).toBe(100.5);
    });

    it("should return 400 if the deposit is not a float or cannot be parsed to a float", async () => {
      const res = await request(app)
        .post("/api/shop")
        .set(...(await gt({ ga: true })))
        .send({
          name: "NewTestShop",
          startingDeposit: "asdf",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "startingDeposit must be floaty",
      });
    });

    it("should log the initial deposit", async () => {
      const res = await request(app)
        .post("/api/shop")
        .set(...(await gt({ ga: true })))
        .send({
          name: "NewTestShop",
          startingDeposit: 100,
        });

      expect(res.status).toBe(200);

      const user = await prisma.user.findFirst({
        where: {
          email: "test@email.com",
        },
        include: {
          logs: {
            where: {
              type: LogType.LEDGER_ITEM_CREATED,
            },
          },
        },
      });

      expect(user.logs).toHaveLength(1);
      expect(user.logs[0]).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        ledgerItemId: expect.any(String),
        shopId: expect.any(String),
        userId: expect.any(String),
      });
    });

    it("should not post initial deposit if initial deposit is not set", async () => {
      await request(app)
        .post("/api/shop")
        .set(...(await gt({ ga: true })))
        .send({
          name: "NewTestShop",
        });

      const user = await prisma.user.findFirst({
        where: {
          email: "test@email.com",
        },
        include: {
          ledgerItems: {
            where: {
              type: LedgerItemType.INITIAL,
            },
          },
        },
      });

      expect(user.ledgerItems).toHaveLength(0);
    });
  });
});
