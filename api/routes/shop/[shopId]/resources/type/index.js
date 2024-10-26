import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;

    const userShop = prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: shopId,
        active: true,
      },
    });

    if (!userShop) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    const shouldLoadAll =
      req.user.admin ||
      userShop.accountType === "ADMIN" ||
      userShop.accountType === "OPERATOR";

    const resourceTypes = await prisma.resourceType.findMany({
      where: {
        shopId: shopId,
        active: shouldLoadAll ? undefined : true,
      },
      include: {
        resources: {
          where: {
            active: true,
          },
          include: {
            images: {
              where: {
                active: true,
              },
            },
          },
        },
      },
    });

    res.json({ resourceTypes });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;

    const userShop = prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: shopId,
        active: true,
      },
    });

    if (!userShop) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR"
    ) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    const { title } = req.body;

    const resourceType = await prisma.resourceType.create({
      data: {
        title,
        shopId,
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.RESOURCE_TYPE_CREATED,
        userId: req.user.id,
        shopId,
        resourceTypeId: resourceType.id,
        to: JSON.stringify(resourceType),
      },
    });

    res.json({ resourceType });
  },
];
