import { prisma } from "../../util/prisma.js";
import { verifyAuth } from "../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    if (!req.user.admin) {
      return res.status(403).json({});
    }

    let users = await prisma.user.findMany({
      include: {
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
      take: req.query.limit ? parseInt(req.query.limit) : 20,
      skip: req.query.offset ? parseInt(req.query.offset) : 0,
    });

    users = users.map((user) => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      isMe: user.id === req.user.id,
      shopCount: user._count.shops,
      jobCount: user._count.jobs,
      _count: undefined,
    }));

    // Remove undefined values
    users = users.map((user) =>
      Object.fromEntries(
        Object.entries(user).filter(([_, v]) => v !== undefined)
      )
    );

    const count = await prisma.user.count();

    return res.json({
      users,
      meta: {
        total: count,
        count: users.length,
        offset: req.query.offset ? parseInt(req.query.offset) : 0,
      },
    });
  },
];
