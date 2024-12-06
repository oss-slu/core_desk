import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";

const populate = async () => {
  const resourceType = await prisma.resourceType.create({
    data: {
      shopId: tc.shop.id,
      title: "TestResourceType",
    },
  });
  await prisma.resource.createMany({
    data: [
      {
        shopId: tc.shop.id,
        title: "TestResource",
        description: "TestResourceDescription",
        resourceTypeId: resourceType.id,
        public: true,
      },
      {
        shopId: tc.shop.id,
        title: "TestResource2",
        description: "TestResourceDescription2",
        resourceTypeId: resourceType.id,
        public: true,
      },
      {
        shopId: tc.shop.id,
        title: "HiddenTestResource",
        description: "TestResourceDescription",
        resourceTypeId: resourceType.id,
        public: false,
      },
    ],
  });
  return { resourceType };
};

describe("/api/shop/[shopId]/resources", () => {
  describe("GET", () => {
    it("returns a list of resources in the shop", async () => {
      await populate();

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.resources).toHaveLength(3);
      expect(res.body.resources[0]).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        resourceTypeId: expect.any(String),
        shopId: expect.any(String),
      });
    });

    it("only returns a list of public resources in the shop for customers", async () => {
      await populate();

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.resources).toHaveLength(2);
      expect(res.body.resources[0]).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        resourceTypeId: expect.any(String),
        shopId: expect.any(String),
      });
    });

    it("returns a 403 if the user is not a member of the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test1@email.com",
          firstName: "Test",
          lastName: "User",
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ user })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      expect(res.body.resources).toBeUndefined();
    });

    it("returns a 404 if the shop does not exist", async () => {
      const res = await request(app)
        .get(`/api/shop/12345/resources`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Not found" });
    });

    it("returns a 500 if something goes wrong", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ sat: "ADMIN" })))
        .set({ forceError: true })
        .send();

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal Server Error" });
    });
  });

  describe("POST", () => {
    it("creates a new resource for global admins", async () => {
      const resourceType = await prisma.resourceType.create({
        data: {
          shopId: tc.shop.id,
          title: "TestResourceType",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ ga: true })))
        .send({
          title: "TestResource",
          resourceTypeId: resourceType.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.resource).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        resourceTypeId: expect.any(String),
        shopId: expect.any(String),
        title: "TestResource",
      });
    });

    it("creates a new resource for shop admins", async () => {
      const resourceType = await prisma.resourceType.create({
        data: {
          shopId: tc.shop.id,
          title: "TestResourceType",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          title: "TestResource",
          resourceTypeId: resourceType.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.resource).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        resourceTypeId: expect.any(String),
        shopId: expect.any(String),
        title: "TestResource",
      });
    });

    it("returns 403 if the user is not a member of the shop", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test1@email.com",
          firstName: "Test",
          lastName: "User",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ user })))
        .send({
          title: "TestResource",
          resourceTypeId: "",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 when the user is not an admin (operator)", async () => {
      const resourceType = await prisma.resourceType.create({
        data: {
          title: "TestResourceType",
          shopId: tc.shop.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(
          ...(await gt({
            sat: "OPERATOR",
          }))
        )
        .send({
          title: "TestResource",
          resourceTypeId: resourceType.id,
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 when the user is not an admin (customer)", async () => {
      const resourceType = await prisma.resourceType.create({
        data: {
          title: "TestResourceType",
          shopId: tc.shop.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(
          ...(await gt({
            sat: "CUSTOMER",
          }))
        )
        .send({
          title: "TestResource",
          resourceTypeId: resourceType.id,
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 403 when the user is not an admin (group admin)", async () => {
      const resourceType = await prisma.resourceType.create({
        data: {
          title: "TestResourceType",
          shopId: tc.shop.id,
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(
          ...(await gt({
            sat: "GROUP_ADMIN",
          }))
        )
        .send({
          title: "TestResource",
          resourceTypeId: resourceType.id,
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns an error if a title is not provided", async () => {
      const resourceType = await prisma.resourceType.create({
        data: {
          shopId: tc.shop.id,
          title: "TestResourceType",
        },
      });

      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          title: "",
          resourceTypeId: resourceType.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Title is required");
    });

    it("returns an error if a resource type id is not provided", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          title: "TestResource",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Resource Type is required");
    });

    it("returns a 500 if something goes wrong", async () => {
      const res = await request(app)
        .post(`/api/shop/${tc.shop.id}/resources`)
        .set(...(await gt({ sat: "ADMIN" })))
        .set({ forceError: true })
        .send({
          title: "TestResource",
          resourceTypeId: "__",
        });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal Server Error" });
    });
  });
});
