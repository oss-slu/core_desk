import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, resourceTypeId } = req.params;
    const userId = req.user.id;

    const userShop = await prisma.userShop.findFirst({
      where: {
        shopId,
        userId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    let materials = await prisma.material.findMany({
      where: {
        shopId,
        active: true,
        resourceTypeId,
      },
      include: {
        resourceType: true,
        images: {
          where: {
            active: true,
          },
        },
      },
    });

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR"
    ) {
      materials = materials.map((material) => {
        if (!material.costPublic) {
          delete material.costPerUnit;
          delete material.unitDescriptor;
        }
        return material;
      });
    }

    res.json({ materials });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
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
      return res.status(400).json({ message: "Unauthorized" });
    }

    if (!req.user.admin || !userShop.accountType === "ADMIN") {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const title = req.body.title;
    const manufacturer = req.body.manufacturer;
    const resourceTypeId = req.body.resourceTypeId;
    const costPerUnit = parseFloat(req.body.costPerUnit);
    const unitDescriptor = req.body.unitDescriptor;

    const material = await prisma.material.create({
      data: {
        title,
        manufacturer,
        resourceTypeId,
        costPerUnit,
        unitDescriptor,
        shopId,
      },
      include: {
        resourceType: true,
        images: {
          where: {
            active: true,
          },
        },
      },
    });

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR"
    ) {
      if (!material.costPublic) {
        delete material.costPerUnit;
        delete material.unitDescriptor;
      }
    }

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        type: LogType.MATERIAL_CREATED,
        materialId: material.id,
        resourceTypeId: material.resourceTypeId,
      },
    });

    res.json({ material });
  },
];
