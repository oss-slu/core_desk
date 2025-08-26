import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";
import { z } from "zod";

// schema
const materialSchema = z.object({
  title: z.string().min(1, "Material must have Title"),
  description: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  costPerUnit: z.coerce.number().min(0, "Cost per unit must be a number"),
  unitDescriptor: z.string().optional().nullable(),
  costPublic: z.boolean().optional().nullable(),
  active: z.boolean().optional(),
});

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;
      const { materialId } = req.params;

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

      const material = await prisma.material.findFirst({
        where: {
          id: materialId,
          shopId,
          active: true,
        },
        include: {
          resourceType: true,
          tdsFile: true,
          msdsFile: true,
          images: {
            where: {
              active: true,
            },
            include: {
              file: true,
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

      res.json({ material });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;
    const { materialId } = req.params;

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

    const { data, success, error } = materialSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        error: "Invalid data",
        issues: error.format(),
      });
    }

    const material = await prisma.material.update({
      where: {
        id: materialId,
      },
      data,
      include: {
        resourceType: true,
        images: {
          where: {
            active: true,
          },
        },
      },
    });

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        type: LogType.MATERIAL_MODIFIED,
        materialId: material.id,
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

    res.json({ material });
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;
    const { materialId } = req.params;

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

    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        active: false,
      },
    });

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        type: LogType.MATERIAL_DELETED,
        materialId: material.id,
        resourceTypeId: material.resourceTypeId,
      },
    });

    res.json({ message: "Material deleted" });
  },
];
