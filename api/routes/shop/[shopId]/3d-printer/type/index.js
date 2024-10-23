import { LogType } from "@prisma/client";
import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    console.log(userShop, req.user.admin);

    if (!userShop && !req.user.admin) {
      return res.status(400).json({ error: "Unauthorized" });
    }

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
    res.json({ types });
  },
];

export const post = [
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

    const { type, description } = req.body;

    const printer3dType = await prisma.printer3dType.create({
      data: {
        type,
        description,
        shopId: req.params.shopId,
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
        type: LogType.PRINTER_3D_TYPE_CREATED,
        printer3dTypeId: printer3dType.id,
        shopId: req.params.shopId,
      },
    });

    res.json({ types });
  },
];
