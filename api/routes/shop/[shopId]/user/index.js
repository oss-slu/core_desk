import { LogType } from "#prisma-client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";

const logUserConnectedToShop = (userId, shopId) =>
  prisma.logs.create({
    data: {
      userId,
      shopId,
      type: LogType.USER_CONNECTED_TO_SHOP,
    },
  });

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const { firstName, lastName, email } = req.body;

      if (!firstName || !lastName || !email) {
        return res
          .status(400)
          .json({ error: "firstName, lastName, and email are required" });
      }

      // Verify the requester is authorized (shop ADMIN or global admin)
      const requestingUserShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId,
          active: true,
        },
      });

      if (
        !req.user.admin &&
        (!requestingUserShop || requestingUserShop.accountType !== "ADMIN")
      ) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Check if a user with this email already exists
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // User already exists — check if they are already connected to the shop
        const existingConnection = await prisma.userShop.findFirst({
          where: { userId: user.id, shopId },
        });

        if (existingConnection && existingConnection.active) {
          return res
            .status(400)
            .json({ error: "A user with this email is already in the shop" });
        }

        if (existingConnection) {
          // Reactivate the existing connection
          await prisma.userShop.update({
            where: { id: existingConnection.id },
            data: { active: true, accountType: "CUSTOMER" },
          });
        } else {
          // Create a new connection
          await prisma.userShop.create({
            data: {
              userId: user.id,
              shopId,
              accountType: "CUSTOMER",
              active: true,
            },
          });
        }
      } else {
        // Create the new user
        user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
          },
        });

        await prisma.logs.create({
          data: {
            userId: user.id,
            type: LogType.USER_CREATED,
          },
        });

        // Connect the user to the shop
        await prisma.userShop.create({
          data: {
            userId: user.id,
            shopId,
            accountType: "CUSTOMER",
            active: true,
          },
        });
      }

      await logUserConnectedToShop(user.id, shopId);

      return res.json({ user: { id: user.id, email, firstName, lastName } });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];
    }
  },
];

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


    users = users.map((user) => ({
      name: `${user.user.firstName} ${user.user.lastName}`,
      ...user.user,
    }));

    return res.json({
      users,
      meta: {
        total: users.length,
      },
    });
  },
];
