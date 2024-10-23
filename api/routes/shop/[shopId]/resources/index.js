import { LogType } from "@prisma/client";
import { prisma } from "../../../../util/prisma.js";
import { verifyAuth } from "../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      // Make sure the user exists on the shop
      const { shopId } = req.params;
      const userId = req.user.id;
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

      let resources;

      if (userShop.accountType === "CUSTOMER" && !req.user.admin) {
        resources = await prisma.resource.findMany({
          where: {
            shopId,
            public: true,
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
      } else {
        resources = await prisma.resource.findMany({
          where: {
            shopId,
            active: true,
          },
          include: {
            images: {
              where: {
                active: true,
              },
            },
            // logs: true,
          },
        });
      }

      resources = resources.map((resource) => {
        if (
          req.user.admin ||
          userShop.accountType === "ADMIN" ||
          userShop.accountType === "OPERATOR"
        ) {
          return resource;
        }

        if (resource.quantityPublic) delete resource.quantity;

        if (resource.costingPublic) {
          delete resource.costPerMaterial;
          delete resource.costPerProcessingTime;
          delete resource.costPerTime;
          delete resource.costPerUnit;
          delete resource.fixedCost;
        }

        return resource;
      });

      res.json({ resources });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "An error occurred",
      });
    }
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;

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
        return res.status(403).send("You are not an admin of this shop");
      }

      const { title } = req.body;

      if (!title) {
        return res.status(400).send("Title is required");
      }

      const resource = await prisma.resource.create({
        data: {
          title: title,
          shopId,
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          resourceId: resource.id,
          type: LogType.RESOURCE_CREATED,
        },
      });

      res.json({ resource });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "An error occurred",
      });
    }
  },
];
