import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR" &&
      userShop.accountType !== "GROUP_ADMIN"
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let users = await prisma.userShop.findMany({
      where: {
        shopId,
        active: true,
      },
      select: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
            email: true,
          },
        },
      },
    });



    



    users = users.map(({ user: { password: _password, ...userData } }) => ({
  name: `${userData.firstName} ${userData.lastName}`,
  ...userData,
}));

    return res.json({
      users,
      meta: {
        total: users.length,
      },
    });
  },
];
