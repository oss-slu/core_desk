import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, resourceTypeId } = req.params;

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

    const resourceType = await prisma.resourceType.findFirst({
      where: {
        id: resourceTypeId,
        shopId,
        active: shouldLoadAll ? undefined : true,
      },
    });

    if (!resourceType) {
      return res.status(404).json({
        message: "Resource type not found",
      });
    }

    const resources = await prisma.resource.findMany({
      where: {
        shopId: shopId,
        resourceTypeId: resourceTypeId,
        active: true,
      },
    });

    res.json({ resources, resourceType });
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const { shopId, resourceTypeId } = req.params;

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
      return res.status(400).json({
        message: "Unauthorized",
      });
    }

    const resourceType = await prisma.resourceType.findFirst({
      where: {
        id: resourceTypeId,
        shopId,
      },
    });

    if (!resourceType) {
      return res.status(404).json({
        message: "Resource type not found",
      });
    }

    const updatedResourceType = await prisma.resourceType.update({
      where: {
        id: resourceTypeId,
      },
      data: req.body,
      include: {
        resources: true,
      },
    });

    const resources = updatedResourceType.resources;
    delete updatedResourceType.resources;

    await prisma.logs.create({
      data: {
        userId: req.user.id,
        shopId,
        type: LogType.RESOURCE_TYPE_MODIFIED,
        from: JSON.stringify(resourceType),
        to: JSON.stringify(updatedResourceType),
        resourceTypeId,
      },
    });

    res.json({ resourceType: updatedResourceType, resources });
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    const { shopId, resourceTypeId } = req.params;

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
      return res.status(400).json({
        message: "Unauthorized",
      });
    }

    const resourceType = await prisma.resourceType.findFirst({
      where: {
        id: resourceTypeId,
        shopId,
        active: true,
      },
    });

    if (!resourceType) {
      return res.status(404).json({
        message: "Resource type not found",
      });
    }

    await prisma.resourceType.update({
      where: {
        id: resourceTypeId,
      },
      data: {
        active: false,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.user.id,
        shopId,
        type: LogType.RESOURCE_TYPE_DELETED,
        resourceTypeId,
      },
    });

    res.json({ message: "Resource type deleted" });
  },
];
