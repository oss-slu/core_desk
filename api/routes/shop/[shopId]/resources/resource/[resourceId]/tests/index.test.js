import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma as mockPrisma } from "#mock-prisma";
import { prisma } from "#prisma";
import { tc } from "#setup";

const setup = async (options) => {
  const resourceOptions = options?.resource || {};
  const resourceTypeOptions = options?.resourceType || {};

  const resourceType = await prisma.resourceType.create({
    data: {
      title: "TestResourceType",
      shopId: tc.shop.id,
      ...resourceTypeOptions,
    },
  });

  const resource = await prisma.resource.create({
    data: {
      title: "TestResource",
      shopId: tc.shop.id,
      resourceTypeId: resourceType.id,
      ...resourceOptions,
    },
  });
  return { resourceType, resource };
};

describe("/shop/[shopId]/resources/resource/[resourceId]", () => {
  describe("GET", async () => {
    it("returns a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.resource).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        resourceTypeId: expect.any(String),
        shopId: expect.any(String),
      });
    });

    it("returns 403 when the user is not a member of the shop", async () => {
      const { resource } = await setup();
      const user = await prisma.user.create({
        data: {
          firstName: "TestFirstName",
          lastName: "TestLastName",
          email: "test1@email.com",
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ user })))
        .send();

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("returns 404 when the resource does not exist", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/12345`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Resource not found");
    });

    it("does not return the quantity if the resourceQuantity is not public and the user is a customer", async () => {
      const { resource } = await setup({
        resource: {
          quantityPublic: false,
          quantity: 6,
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send();

      expect(res.body.resource.quantity).toBe(undefined);

      expect(res.status).toBe(200);
      expect(res.body.resource).toMatchSnapshot({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        resourceTypeId: expect.any(String),
        shopId: expect.any(String),
      });
    });

    it("returns the quantity if the resourceQuantity is not public but the user is a global admin", async () => {
      const { resource } = await setup({
        resource: {
          quantityPublic: false,
          quantity: 6,
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.resource.quantity).toBe(6);
    });

    it("returns the quantity if the resourceQuantity is not public and the user is a shop-level admin", async () => {
      const { resource } = await setup({
        resource: {
          quantityPublic: false,
          quantity: 6,
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.resource.quantity).toBe(6);
    });

    it("returns the quantity if the resourceQuantity is not public and the user is an operator", async () => {
      const { resource } = await setup({
        resource: {
          quantityPublic: false,
          quantity: 6,
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.resource.quantity).toBe(6);
    });

    it("returns the quantity if the resourceQuantity is not public and the user is a group admin", async () => {
      const { resource } = await setup({
        resource: {
          quantityPublic: false,
          quantity: 6,
        },
      });

      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.resource.quantity).toBe(6);
    });

    it("gracefully handles an error", async () => {
      const res = await request(app)
        .get(`/api/shop/${tc.shop.id}/resources/resource/12345`)
        .set(...(await gt({ ga: true })))
        .set({ forceError: true })
        .send();

      expect(res.status).toBe(500);
    });
  });
});
