import { LogType } from "@prisma/client";
import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { typeId } = req.params;
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

    const type = await prisma.printer3dType.findFirst({
      where: {
        id: typeId,
      },
    });

    res.json({ type });
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

    const { typeId } = req.params;

    await prisma.printer3dType.update({
      where: {
        id: typeId,
      },
      data: {
        active: false,
      },
    });

    // Update all materials to inactive

    await prisma.printer3dMaterial.updateMany({
      where: {
        printer3dTypeId: typeId,
      },
      data: {
        active: false,
      },
    });

    const types = await prisma.printer3dType.findMany({
      where: {
        active: true,
      },
      include: {
        materials: {
          where: {
            active: true,
          },
        },
        _count: {
          select: {
            materials: {
              where: {
                active: true,
              },
            },
          },
        },
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.user.id,
        type: LogType.PRINTER_3D_TYPE_DELETED,
        printer3dTypeId: typeId,
        shopId: req.params.shopId,
      },
    });

    res.json({ types });
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const { typeId } = req.params;
    const { type, description } = req.body;
    const { shopId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    if (!userShop || userShop.accountType !== "ADMIN" || !req.user.admin) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const originalPrinterType = await prisma.printer3dType.findFirst({
      where: {
        id: typeId,
      },
    });

    const updatedPrinterType = await prisma.printer3dType.update({
      where: {
        id: typeId,
      },
      data: {
        type,
        description,
      },
    });

    const types = await prisma.printer3dType.findMany({
      where: {
        active: true,
      },
      include: {
        materials: {
          where: {
            active: true,
          },
        },
        _count: {
          select: {
            materials: {
              where: {
                active: true,
              },
            },
          },
        },
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.user.id,
        type: LogType.PRINTER_3D_TYPE_UPDATED,
        printer3dTypeId: typeId,
        shopId,
        original: originalPrinterType,
        updated: updatedPrinterType,
      },
    });

    res.json({ types });
  },
];
