import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "#prisma-client";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: { userId, shopId, active: true },
      });
      if (!userShop) return res.status(403).json({ error: "Unauthorized" });

      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          calendarStartHour: true,
          calendarEndHour: true,
          calendarIncrement: true,
        },
      });

      res.json({ settings: shop });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;
      const { calendarStartHour, 
              calendarEndHour, 
              calendarIncrement
            } = req.body;

      const userShop = await prisma.userShop.findFirst({
        where: { userId, shopId, active: true },
      });

      if (
        !req.user.admin &&
        !["ADMIN", "OPERATOR"].includes(userShop?.accountType)
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const oldShop = await prisma.shop.findUnique({ 
        where: { id: shopId },
        select: {
          calendarStartHour: true,
          calendarEndHour: true,
          calendarIncrement: true,
        }
      });

      const updated = await prisma.shop.update({
        where: { id: shopId },
        data: {
          calendarStartHour,
          calendarEndHour,
          calendarIncrement,
        },
        select: {
          calendarStartHour: true,
          calendarEndHour: true,
          calendarIncrement: true,
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          type: LogType.SHOP_MODIFIED,
          from: JSON.stringify(oldShop),
          to: JSON.stringify(updated),
        },
      });

      res.json({ settings: updated });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];