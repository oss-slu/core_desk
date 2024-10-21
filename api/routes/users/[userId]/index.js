import { prisma } from "../../../util/prisma.js";
import { verifyAuth } from "../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    console.log(req.user.id, req.params.userId);
    if (!req.user.admin) {
      if (req.user.id == req.params.userId) {
      } else {
        // Return a very basic profile including only the user's name and id
        let user = await prisma.user.findUnique({
          where: {
            id: req.params.userId,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        });

        user = {
          ...user,
          name: `${user.firstName} ${user.lastName}`,
        };

        res.json({
          user,
        });
        return;
      }
    }

    let user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
      include: {
        shops: {
          select: {
            shop: true,
            createdAt: true,
            accountTitle: true,
            accountType: true,
          },
        },
        jobs: true,
        logs: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            shop: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            shops: true,
            jobs: true,
          },
        },
      },
    });

    user = {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      shopCount: user._count.shops,
      jobCount: user._count.jobs,
      _count: undefined,
      isMe: user.id === req.user.id,
    };

    return res.json({
      user,
    });
  },
];
