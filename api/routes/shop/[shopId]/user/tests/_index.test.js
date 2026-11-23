import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";
import { LedgerItemType } from "#prisma-client";

describe("/shop/[shopId]/user", () => {
  describe("GET", () => {
    it("returns a list of users for global admins", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0]).toMatchSnapshot({
        id: expect.any(String),
      });
    });

    it("returns a list of users for shop-level admins", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0]).toMatchSnapshot({
        id: expect.any(String),
      });
    });

    it("returns a list of users for operators", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0]).toMatchSnapshot({
        id: expect.any(String),
      });
    });

    it("returns a list of users for group admins", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0]).toMatchSnapshot({
        id: expect.any(String),
      });
    });

    it("returns 403 when the user is not an admin", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 when the user is not a member of the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "new@email.com",
          firstName: "TestFirstName",
          lastName: "TestLastName",
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/user`)
        .set(...(await gt({ user })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST", () => {
    it("deposits the starting balance when creating a user directly in a shop", async () => {
      await prisma.shop.update({
        where: { id: tc.shop.id },
        data: { startingDeposit: 75 },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/user`)
        .set(...(await gt({ ga: true })))
        .send({
          userEmail: "created-in-shop@example.com",
          userFirstName: "Created",
          userLastName: "In Shop",
        });

      expect(res.status).toBe(200);

      const user = await prisma.user.findFirst({
        where: { email: "created-in-shop@example.com" },
      });
      const ledgerItem = await prisma.ledgerItem.findFirst({
        where: {
          userId: user.id,
          shopId: tc.shop.id,
          type: LedgerItemType.INITIAL,
        },
      });

      expect(ledgerItem.value).toBe(75);
    });
  });
});
