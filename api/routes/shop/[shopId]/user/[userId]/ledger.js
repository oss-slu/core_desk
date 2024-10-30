import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, userId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
        active: true,
      },
    });

    if (
      !(
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR" ||
        req.user.id === userId
      )
    ) {
      console.log(
        !req.user.admin,
        userShop.accountType !== "ADMIN",
        userShop.accountType !== "OPERATOR",
        req.user.id !== userId
      );
      return res.status(400).json({ error: "Unauthorized" });
    }

    const ledgerItems = await prisma.ledgerItem.findMany({
      where: {
        shopId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        job: {
          select: {
            title: true,
          },
        },
      },
    });

    res.json({ ledgerItems });
  },
];
