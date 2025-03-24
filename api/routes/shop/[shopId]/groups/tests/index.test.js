import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { tc } from "#setup";
import { prisma } from "#prisma";

const setup = async () => {
  const { shop, user } = tc;

  await prisma.billingGroup.create({
    data: {
      shopId: shop.id,
      title: "TestGroupWithoutAccess",
    },
  });

  await prisma.billingGroup.create({
    data: {
      shopId: shop.id,
      title: "TestGroupWithAccess",
      users: {
        create: {
          userId: user.id,
          role: "MEMBER",
        },
      },
    },
  });

  await prisma.billingGroup.create({
    data: {
      shopId: shop.id,
      title: "TestGroupWithAdmin",
      users: {
        create: {
          userId: user.id,
          role: "ADMIN",
        },
      },
    },
  });
};

describe("/shop/[shopId]", () => {
  describe("GET", () => {
    it("returns a list of billing groups that the non-privileged user is a member of", async () => {
      await setup();

      const req = await request(app)
        .get(`/api/shop/${tc.shop.id}/groups`)
        .set(...(await gt()))
        .send();

      expect(req.status).toBe(200);
      expect(req.body.groups).toHaveLength(2);

      const accessGroup = req.body.groups.find(
        (group) => group.title === "TestGroupWithAccess"
      );

      expect(accessGroup.title).toBe("TestGroupWithAccess");
      expect(accessGroup.userHasPermissionToCreateJobsOnBillingGroup).toBe(
        false
      );

      const adminGroup = req.body.groups.find(
        (group) => group.title === "TestGroupWithAdmin"
      );

      expect(adminGroup.title).toBe("TestGroupWithAdmin");
      expect(adminGroup.userHasPermissionToCreateJobsOnBillingGroup).toBe(true);
    });

    it("returns 400 if a shop id is not provided", async () => {
      const req = await request(app)
        .get(`/api/shop/${null}/groups`)
        .set(...(await gt()))
        .send();

      expect(req.status).toBe(400);
    });

    it("allows a shop-level admin to get a list of all groups", async () => {
      await setup();

      const req = await request(app)
        .get(`/api/shop/${tc.shop.id}/groups`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(req.status).toBe(200);
      expect(req.body.groups).toHaveLength(3);
    });

    it("allows a shop-level operator to get a list of all groups", async () => {
      await setup();

      const req = await request(app)
        .get(`/api/shop/${tc.shop.id}/groups`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send();

      expect(req.status).toBe(200);
      expect(req.body.groups).toHaveLength(3);
    });

    it("allows a global admin to get a list of all groups", async () => {
      await setup();

      const req = await request(app)
        .get(`/api/shop/${tc.shop.id}/groups`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(req.status).toBe(200);
      expect(req.body.groups).toHaveLength(3);
    });
  });

  describe("POST", () => {
    it("creates a new billing group", async () => {
      const req = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups`)
        .set(
          ...(await gt({
            sat: "ADMIN",
          }))
        )
        .send({
          title: "TestCreationGroup",
          adminUserId: tc.user.id,
        });

      expect(req.status).toBe(200);
      expect(req.body.groups[0].title).toBe("TestCreationGroup");

      const foundGroup = await prisma.billingGroup.findFirst({
        where: {
          title: "TestCreationGroup",
        },
      });

      expect(foundGroup).toBeDefined();
    });

    it("gives the admin user permissions", async () => {
      const req = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups`)
        .set(
          ...(await gt({
            sat: "ADMIN",
          }))
        )
        .send({
          title: "TestCreationGroup",
          adminUserId: tc.user.id,
        });

      expect(req.status).toBe(200);
      expect(req.body.groups[0].adminUsers[0].id).toBe(tc.user.id);

      const req2 = await request(app)
        .get(`/api/shop/${tc.shop.id}/groups`)
        .set(...(await gt()))
        .send();

      expect(req2.status).toBe(200);
      expect(req2.body.groups[0].id).toBe(req.body.groups[0].id);
    });

    it("does not allow a non-admin user to create a group", async () => {
      const req = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups`)
        .set(...(await gt()))
        .send({
          title: "TestCreationGroup",
          adminUserId: tc.user.id,
        });

      expect(req.status).toBe(400);
    });

    it("allows a global admin to create a group", async () => {
      const req = await request(app)
        .post(`/api/shop/${tc.shop.id}/groups`)
        .set(...(await gt({ ga: true })))
        .send({
          title: "TestCreationGroup",
          adminUserId: tc.user.id,
        });

      expect(req.status).toBe(200);
      expect(req.body.groups[0].title).toBe("TestCreationGroup");
    });
  });
});
