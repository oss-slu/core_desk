import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";
import { LedgerItemType, LogType } from "@prisma/client";
import { prisma as mockPrisma } from "#mock-prisma";

describe("/shop/[shopId]/user/[userId]", () => {
  describe("GET", () => {
    it("returns a user's shop information to admins", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.userShop).toMatchSnapshot({
        id: expect.any(String),
        userId: expect.any(String),
        shopId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        user: {
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          isMe: true,
        },
      });
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
        .get(`/api/shop/${userShop.shopId}/user/${userShop.userId}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.userShop.user.jobCounts).toMatchObject({
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
        .get(`/api/shop/${userShop.shopId}/user/${userShop.userId}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.userShop.user.balance).toBe(140);
    });

    it("returns 403 if the requesting user is not a member of the shop", async () => {
      await prisma.userShop.deleteMany();

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${tc.globalUser.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 if the user is a customer", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 if the user is a group admin", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "GROUP_ADMIN",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns a user's shop information to workshop admins", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.userShop).toMatchSnapshot({
        id: expect.any(String),
        userId: expect.any(String),
        shopId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        user: {
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it("returns a user's shop information to workshop operators", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send();

      expect(res.status).toBe(200);

      expect(res.body.userShop).toMatchSnapshot({
        id: expect.any(String),
        userId: expect.any(String),
        shopId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        user: {
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it("returns 404 when the user is not active in the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: false,
            },
          },
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User is not active in shop" });
    });
  });

  describe("POST", () => {
    it("allows global admins to connect a user to a shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });
    });

    it("allows workshop admins to connect a user to a shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });
    });

    it("returns 403 when the user is not an admin", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 when the user is an operator", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 when the user is a group admin", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 400 when the user is already connected to the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      await prisma.userShop.create({
        data: {
          userId: user.id,
          shopId: tc.shop.id,
          accountType: "CUSTOMER",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "User is already connected to shop",
      });
    });

    it("re-activates a user that was previously removed from a shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const us = await prisma.userShop.create({
        data: {
          userId: user.id,
          shopId: tc.shop.id,
          accountType: "CUSTOMER",
          active: false,
        },
      });

      const numberOfUserShops = await prisma.userShop.count();

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          id: us.id,
        },
      });

      expect(updatedUserShop.active).toBe(true);

      const updatedNumberOfUserShops = await prisma.userShop.count();

      expect(updatedNumberOfUserShops).toBe(numberOfUserShops);
    });

    it("returns 404 when the user does not exist", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/12345`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });

    it("returns 404 when the shop does not exist", async () => {
      const res = await request(app)
        .post(`/api/shop/12345/user/${tc.globalUser.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Shop not found" });
    });

    it("registers a log entry when the user is added to the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });

      const logs = await prisma.logs.findMany({
        where: {
          shopId: tc.shop.id,
          userId: user.id,
          type: LogType.USER_CONNECTED_TO_SHOP,
        },
      });

      expect(logs).toHaveLength(1);

      expect(logs[0]).toMatchObject({
        shopId: tc.shop.id,
        userId: user.id,
        type: LogType.USER_CONNECTED_TO_SHOP,
      });
    });

    it("applies a starting balance if one is configured", async () => {
      const user = await prisma.user.create({
        data: {
          email: "john@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      await prisma.shop.update({
        where: {
          id: tc.shop.id,
        },
        data: {
          startingDeposit: 100,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);

      const ledgerItems = await prisma.ledgerItem.findMany({
        where: {
          shopId: tc.shop.id,
          userId: user.id,
        },
      });

      expect(ledgerItems.length).toBe(1);
      expect(ledgerItems[0].value).toBe(100);

      const userRes = await request(app)
        .get(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })));

      expect(userRes.status).toBe(200);
      expect(userRes.body.userShop.user.balance).toBe(100);
    });
  });

  describe("DEL", () => {
    it("allows global admins to disconnect a user from a shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
            },
          },
        },
      });

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.active).toBe(false);
    });

    it("allows workshop admins to disconnect a user from a shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
            },
          },
        },
      });

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.active).toBe(false);
    });

    it("returns 404 when the user does not exist", async () => {
      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/user/1234`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });

    it("returns 404 when the shop does not exist", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .delete(`/api/shop/1234/user/${user.id}`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Shop not found" });
    });

    it("returns 400 when the user is not connected to the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "User is not connected to shop" });
    });

    it("returns 403 when the user is not an admin", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.active).toBe(true);
    });

    it("returns 403 when the user is an operator", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.active).toBe(true);
    });

    it("returns 403 when the user is a group admin", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.active).toBe(true);
    });

    it("registers a log when the user is removed from the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "john@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      await request(app)
        .delete(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      const logs = await prisma.logs.findMany({
        where: {
          shopId: tc.shop.id,
          userId: user.id,
          type: LogType.USER_DISCONNECTED_FROM_SHOP,
        },
      });

      expect(logs).toHaveLength(1);

      expect(logs[0]).toMatchObject({
        shopId: tc.shop.id,
        userId: user.id,
        type: LogType.USER_DISCONNECTED_FROM_SHOP,
      });
    });
  });

  describe("PUT", () => {
    it("allows global admins to change the role of a user", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "ADMIN",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          role: "CUSTOMER",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.accountType).toBe("CUSTOMER");
    });

    it("allows workspace admins to change the role of a user", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              accountType: "CUSTOMER",
              shopId: tc.shop.id,
              active: true,
            },
          },
        },
      });

      await request(app)
        .put(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          role: "GROUP_ADMIN",
        });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.accountType).toBe("GROUP_ADMIN");
    });

    it("returns 403 when the user is not an admin", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "ADMIN",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt()))
        .send({
          role: "CUSTOMER",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.accountType).toBe("ADMIN");
    });

    it("returns 400 when the role is invalid", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "ADMIN",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          role: "INVALID_ROLE",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid role" });

      const updatedUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
        },
      });

      expect(updatedUserShop.accountType).toBe("ADMIN");
    });

    it("returns 404 when the target user does not exist", async () => {
      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/user/99999`)
        .set(...(await gt({ ga: true })))
        .send({
          role: "CUSTOMER",
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });

    it("returns 404 when the target shop does not exist", async () => {
      const res = await request(app)
        .put(`/api/shop/99999/user/${tc.globalUser.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          role: "CUSTOMER",
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Shop not found" });
    });

    it("returns 400 when the user is not connected to the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
        },
      });

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          role: "CUSTOMER",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "User is not connected to shop" });
    });

    it("returns 400 when the user's connection to the shop is inactive", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "ADMIN",
              active: false,
            },
          },
        },
      });

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          role: "CUSTOMER",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "User is not connected to shop" });
    });

    it("creates a log entry when a user's role is updated", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      await request(app)
        .put(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          role: "ADMIN",
        });

      const log = await prisma.logs.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
          type: LogType.USER_SHOP_ROLE_CHANGED,
        },
      });

      expect(log).not.toBeNull();
      expect(log.message).toContain(
        "Updated user role in the shop to an admin"
      );
    });

    it("does not create a log if the role remains unchanged", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "John",
          lastName: "Doe",
          shops: {
            create: {
              shopId: tc.shop.id,
              accountType: "CUSTOMER",
              active: true,
            },
          },
        },
      });

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/user/${user.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          role: "CUSTOMER",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "success" });

      const log = await prisma.logs.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
          type: LogType.USER_SHOP_ROLE_CHANGED,
        },
      });

      expect(log).toBeNull();
      expect(mockPrisma.userShop.update).not.toHaveBeenCalled();
    });
  });
});
