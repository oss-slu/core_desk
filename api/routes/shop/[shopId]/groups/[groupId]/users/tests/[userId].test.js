import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";

describe("/shop/[shopId]/groups/[groupId]/users/[userId]", () => {
  describe("GET", () => {
    let billingGroup;
    beforeEach(async () => {
      billingGroup = await prisma.billingGroup.create({
        data: {
          shopId: tc.shop.id,
          title: "TestGroup",
          users: {
            create: [
              {
                userId: tc.user.id,
                role: "ADMIN",
              },
              {
                userId: tc.targetUser.id,
                role: "MEMBER",
              },
            ],
          },
          membersCanCreateJobs: true,
        },
      });
    });

    it("returns a 400 if the user is not a member of the shop", async () => {
      const newShop = await prisma.shop.create({
        data: {
          name: "TestShop",
        },
      });

      const res = await request(app)
        .get(`/api/shop/${newShop.id}/groups/__/users/${tc.targetUser.id}`)
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Forbidden" });
    });

    it("allows a global admin who is not a member of the shop to get a user", async () => {
      const newShop = await prisma.shop.create({
        data: {
          name: "TestShop",
        },
      });

      const res = await request(app)
        .get(
          `/api/shop/${newShop.id}/groups/${billingGroup.id}/users/${tc.targetUser.id}`
        )
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.billingGroupUser).toMatchSnapshot({
        id: expect.any(String),
        billingGroupId: expect.any(String),
        userId: expect.any(String),
        updatedAt: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it("allows a shop admin to get a user", async () => {
      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/groups/${billingGroup.id}/users/${tc.targetUser.id}`
        )
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.billingGroupUser).toMatchSnapshot({
        id: expect.any(String),
        billingGroupId: expect.any(String),
        userId: expect.any(String),
        updatedAt: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it("allows a shop admin who is not a member of the shop to get a user", async () => {
      await prisma.userBillingGroup.deleteMany({
        where: {
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/groups/${billingGroup.id}/users/${tc.targetUser.id}`
        )
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
    });

    it("allows a shop operator to get a user", async () => {
      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/groups/${billingGroup.id}/users/${tc.targetUser.id}`
        )
        .set(...(await gt({ sat: "OPERATOR" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.billingGroupUser).toMatchSnapshot({
        id: expect.any(String),
        billingGroupId: expect.any(String),
        userId: expect.any(String),
        updatedAt: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it("allows a shop operator who is not a member of the shop to get a user", async () => {
      await prisma.userBillingGroup.deleteMany({
        where: {
          userId: tc.user.id,
        },
      });

      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/groups/${billingGroup.id}/users/${tc.targetUser.id}`
        )
        .set(...(await gt({ sat: "OPERATOR" })))
        .send();

      expect(res.status).toBe(200);
    });

    it("allows a billing group admin to get a user in their group", async () => {
      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/groups/${billingGroup.id}/users/${tc.targetUser.id}`
        )
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.billingGroupUser).toMatchSnapshot({
        id: expect.any(String),
        billingGroupId: expect.any(String),
        userId: expect.any(String),
        updatedAt: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it("does not allow a user of a billing group to view another user", async () => {
      await prisma.userBillingGroup.updateMany({
        where: {
          userId: tc.user.id,
        },
        data: {
          role: "MEMBER",
        },
      });

      const res = await request(app)
        .get(
          `/api/shop/${tc.shop.id}/groups/${billingGroup.id}/users/${tc.targetUser.id}`
        )
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Forbidden" });
    });
  });
});
