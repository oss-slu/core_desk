import { prisma } from "../../../util/prisma.js";
import { verifyAuth } from "../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      if (!req.user.admin) {
        if (req.user.id !== req.params.userId) {
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
            where: {
              active: true,
            },
            select: {
              shop: true,
              createdAt: true,
              accountTitle: true,
              accountType: true,
            },
          },
          jobs: true,
          logs: {
            orderBy: {
              createdAt: "desc",
            },
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
              shops: {
                where: {
                  active: true,
                },
              },
              jobs: true,
            },
          },
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });

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
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "An error occurred" });
    }
  },
];
