import { LogType } from "@prisma/client";
import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: req.params.shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ error: "Unauthorized" });
    }

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
    res.json({ materials });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const { type, description, manufacturer, printerTypeId } = req.body;
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

    const material = await prisma.material.create({
      data: {
        type,
        description,
        manufacturer,
        printer3dTypeId: printerTypeId,
        shopId: req.params.shopId,
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
        type: LogType.PRINTER_3D_MATERIAL_CREATED,
        materialId: material.id,
        printer3dTypeId: printerTypeId,
        shopId: req.params.shopId,
      },
    });

    res.json({ materials });
  },
];
