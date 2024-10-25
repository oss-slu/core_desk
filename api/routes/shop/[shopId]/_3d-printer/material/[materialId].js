import { LogType } from "@prisma/client";
import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { materialId } = req.params;
    const { shopId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
      },
    });

    res.json({ material });
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: req.params.shopId,
        active: true,
      },
    });

    if (!userShop || !userShop.accountType === "ADMIN" || !req.user.admin) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const { materialId } = req.params;

    const updatedMaterial = await prisma.material.update({
      where: {
        id: materialId,
      },
      data: {
        active: false,
      },
    });

    const materials = await prisma.material.findMany({
      where: {
        active: true,
        printer3dType: {
          active: true,
          id: req.query.type,
        },
      },
      include: {
        printer3dType: true,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.user.id,
        type: LogType.PRINTER_3D_MATERIAL_DELETED,
        materialId: materialId,
        printer3dTypeId: updatedMaterial.printer3dTypeId,
        shopId: req.params.shopId,
      },
    });

    res.json({ materials });
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const { materialId } = req.params;
    const { type, description } = req.body;
    const { shopId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    if (!userShop || !userShop.accountType === "ADMIN" || !req.user.admin) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const originalMaterial = await prisma.material.findFirst({
      where: {
        id: materialId,
      },
    });

    const updatedMaterial = await prisma.material.update({
      where: {
        id: materialId,
      },
      data: {
        type,
        description,
      },
    });

    const materials = await prisma.material.findMany({
      where: {
        active: true,
        printer3dType: {
          active: true,
          id: req.query.type,
        },
      },
      include: {
        printer3dType: true,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.user.id,
        type: LogType.PRINTER_3D_MATERIAL_MODIFIED,
        materialId: materialId,
        printer3dTypeId: updatedMaterial.printer3dTypeId,
        shopId: req.params.shopId,
        from: JSON.stringify(originalMaterial),
        to: JSON.stringify(updatedMaterial),
      },
    });

    res.json({ materials });
  },
];
