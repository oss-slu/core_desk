import { LogType } from "@prisma/client";
import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { resourceId, shopId } = req.params;

      const userShop = await prisma.userShop.findFirst({
        where: {
          shopId,
          userId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(403).send("You are not a member of this shop");
      }

      const resource = await prisma.resource.findFirst({
        where: {
          id: resourceId,
          shopId,
          active: true,
        },
        include: {
          images: {
            where: {
              active: true,
            },
          },
        },
      });

      if (!resource) {
        return res.status(404).send("Resource not found");
      }

      if (!resource.quantityPublic) {
        if (userShop.accountType === "CUSTOMER" && !req.user.admin) {
          delete resource.quantity;
        }
      }

      res.json({ resource });
    } catch (e) {
      console.error(e);
      res.status(500).send("An error occurred");
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { resourceId, shopId } = req.params;

      const userShop = await prisma.userShop.findFirst({
        where: {
          shopId,
          userId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(403).send("You are not a member of this shop");
      }

      if (userShop.accountType === "CUSTOMER" && !req.user.admin) {
        return res.status(403).send("You are not authorized to edit resources");
      }

      const resource = await prisma.resource.findFirst({
        where: {
          id: resourceId,
          shopId,
        },
      });

      if (!resource) {
        return res.status(404).send("Resource not found");
      }

      let data = req.body;

      delete data.images;
      delete data.id;
      delete data.shopId;
      delete data.createdAt;
      delete data.updatedAt;

      if (data.quantity) data.quantity = parseInt(data.quantity);
      if (data.costPerUnit) data.costPerUnit = parseFloat(data.costPerUnit);
      if (data.fixedCost) data.fixedCost = parseFloat(data.fixedCost);
      if (data.costPerTime) data.costPerTime = parseFloat(data.costPerTime);
      if (data.costPerProcessingTime)
        data.costPerProcessingTime = parseFloat(data.costPerProcessingTime);

      const updatedResource = await prisma.resource.update({
        where: {
          id: resourceId,
        },
        data,
        include: {
          images: {
            where: {
              active: true,
            },
          },
        },
      });

      const updatedResourceWithoutImages = { ...updatedResource };
      delete updatedResourceWithoutImages.images;
      updatedResourceWithoutImages.imagesLength = updatedResource.images.length;
      resource.imagesLength = resource.images.length;

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          type: LogType.RESOURCE_MODIFIED,
          from: JSON.stringify(resource),
          to: JSON.stringify(updatedResourceWithoutImages),
          resourceId: updatedResource.id,
        },
      });

      res.json({ resource: updatedResource });
    } catch (e) {
      console.error(e);
      res.status(500).send("An error occurred");
    }
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { resourceId, shopId } = req.params;

      const userShop = await prisma.userShop.findFirst({
        where: {
          shopId,
          userId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(403).send("You are not a member of this shop");
      }

      if (userShop.accountType !== "ADMIN" && !req.user.admin) {
        return res
          .status(403)
          .send("You are not authorized to delete resources");
      }

      const resource = await prisma.resource.findFirst({
        where: {
          id: resourceId,
          shopId,
        },
      });

      if (!resource) {
        return res.status(404).send("Resource not found");
      }

      if (resource.active === false) {
        return res.status(400).send("Resource already deleted");
      }

      await prisma.resource.update({
        where: {
          id: resourceId,
        },
        data: {
          active: false,
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          type: LogType.RESOURCE_DELETED,
          resourceId: resourceId,
        },
      });

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).send("An error occurred");
    }
  },
];
