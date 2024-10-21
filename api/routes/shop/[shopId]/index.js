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

      res.json(shop);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];
