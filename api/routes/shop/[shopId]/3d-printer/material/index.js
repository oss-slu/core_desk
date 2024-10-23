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
      return res.status(401).json({ error: "Unauthorized" });
    }

    const materials = await prisma.printer3dMaterial.findMany({
      where: {
        active: true,
        printer3dType: {
          active: true,
          type: req.query.type,
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

    if (!userShop || !userShop.accountType === "admin" || !req.user.admin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const printer3dMaterial = await prisma.printer3dMaterial.create({
      data: {
        type,
        description,
        manufacturer,
        printer3dTypeId: printerTypeId,
        shopId: req.params.shopId,
      },
    });

    const materials = await prisma.printer3dMaterial.findMany({
      where: {
        active: true,
        printer3dType: {
          active: true,
          type: req.query.type,
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
        printer3dMaterialId: printer3dMaterial.id,
        printer3dTypeId: printerTypeId,
        shopId: req.params.shopId,
      },
    });

    res.json({ materials });
  },
];
