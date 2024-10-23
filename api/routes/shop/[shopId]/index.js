import { prisma } from "../../../util/prisma.js";
import { verifyAuth } from "../../../util/verifyAuth.js";
import { SHOP_SELECT } from "../shared.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const shop = await prisma.shop.findUnique({
        where: {
          id: req.params.shopId,
          users: {
            some: {
              userId: req.user.id,
              active: true,
            },
          },
        },
        select: SHOP_SELECT,
      });

      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId: shop.id,
        },
        select: {
          accountType: true,
          accountTitle: true,
        },
      });

      res.json({ shop, userShop });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const shop = await prisma.shop.findUnique({
        where: {
          id: req.params.shopId,
          users: {
            some: {
              userId: req.user.id,
              active: true,
            },
          },
        },
      });

      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId: shop.id,
        },
      });

      if (!userShop.active) {
        return res.status(403).json({ error: "User is not active in shop" });
      }

      if (userShop.accountType !== "ADMIN" && !req.user.admin) {
        return res.status(403).json({ error: "User is not an admin" });
      }

      const updatedShop = await prisma.shop.update({
        where: {
          id: shop.id,
        },
        data: req.body,
        select: SHOP_SELECT,
      });

      res.json({ shop: updatedShop });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];
