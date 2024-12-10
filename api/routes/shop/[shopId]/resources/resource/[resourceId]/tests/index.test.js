import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma } from "#prisma";
import { tc } from "#setup";
import { LogType } from "@prisma/client";

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
  describe("GET", () => {
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

  describe("PUT", () => {
    it("modifies a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(200);

      const updatedResource = await prisma.resource.findFirst({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.title).toBe("New Title");
    });

    it("returns 403 if the user is not a member of the shop", async () => {
      const { resource } = await setup();
      const user = await prisma.user.create({
        data: {
          firstName: "TestFirstName",
          lastName: "TestLastName",
          email: "test2@email.com",
        },
      });

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ user })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("allows a shop-level admin to update a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(200);
    });

    it("does not allow customers to update a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedResource = await prisma.resource.findUnique({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.title).toBe("TestResource");
    });

    it("does not allow operators to update a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedResource = await prisma.resource.findUnique({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.title).toBe("TestResource");
    });

    it("does not allow group admins to update a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedResource = await prisma.resource.findUnique({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.title).toBe("TestResource");
    });

    it("returns 404 when the resource does not exist", async () => {
      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/12345`)
        .set(...(await gt({ ga: true })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Resource not found" });
    });

    it("converts floaty values to floats and succeeds", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          quantity: "5",
          costPerUnit: "10.5",
          fixedCost: "20.5",
          costPerTime: "30.5",
          costPerProcessingTime: "40.5",
        });

      expect(res.status).toBe(200);

      const updatedResource = await prisma.resource.findUnique({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.costPerUnit).toBe(10.5);
      expect(updatedResource.fixedCost).toBe(20.5);
      expect(updatedResource.costPerTime).toBe(30.5);
      expect(updatedResource.costPerProcessingTime).toBe(40.5);
      expect(updatedResource.quantity).toBe(5);
    });

    it("gracefully handles an error", async () => {
      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/12345`)
        .set(...(await gt({ ga: true })))
        .set({ forceError: true })
        .send();

      expect(res.status).toBe(500);
    });

    it("logs the resource modification", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .put(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(200);

      const log = await prisma.logs.findFirst({
        where: {
          type: LogType.RESOURCE_MODIFIED,
          resourceId: resource.id,
        },
      });

      expect(log).toBeDefined();
      expect(JSON.parse(log.to).imagesLength).toBe(0);
    });
  });

  describe("DEL", () => {
    it("'deletes' a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ ga: true })))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedResource = await prisma.resource.findUnique({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.active).toBe(false);
    });

    it("returns 403 if the user is not a member of the shop", async () => {
      const { resource } = await setup();
      const user = await prisma.user.create({
        data: {
          firstName: "TestFirstName",
          lastName: "TestLastName",
          email: "test2@email.com",
        },
      });

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ user })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("allows a shop-level admin to update a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "ADMIN" })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(200);
    });

    it("does not allow customers to update a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "CUSTOMER" })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedResource = await prisma.resource.findUnique({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.title).toBe("TestResource");
    });

    it("does not allow operators to update a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "OPERATOR" })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedResource = await prisma.resource.findUnique({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.title).toBe("TestResource");
    });

    it("does not allow group admins to update a resource", async () => {
      const { resource } = await setup();

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ sat: "GROUP_ADMIN" })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });

      const updatedResource = await prisma.resource.findUnique({
        where: {
          id: resource.id,
        },
      });

      expect(updatedResource.title).toBe("TestResource");
    });

    it("returns 404 when the resource does not exist", async () => {
      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/12345`)
        .set(...(await gt({ ga: true })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Resource not found" });
    });

    it("returns 400 when a resource is already deleted", async () => {
      const { resource } = await setup({
        resource: {
          active: false,
        },
      });

      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/${resource.id}`)
        .set(...(await gt({ ga: true })))
        .send({
          title: "New Title",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Resource already deleted" });
    });

    it("gracefully handles an error", async () => {
      const res = await request(app)
        .delete(`/api/shop/${tc.shop.id}/resources/resource/12345`)
        .set(...(await gt({ ga: true })))
        .set({ forceError: true })
        .send();

      expect(res.status).toBe(500);
    });
  });
});
