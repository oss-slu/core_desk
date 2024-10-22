import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    const userId = req.user.id;
    const { resourceId, shopId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        shopId,
        userId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(403).send("You are not a member of this shop");
    }

    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        shopId,
      },
      include: {
        images: true,
      },
    });

    if (!resource) {
      return res.status(404).send("Resource not found");
    }

    res.json({ resource });
  },
];
