import { LogType } from "@prisma/client";
import { prisma } from "../../util/prisma.js";
import { verifyAuth } from "../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      if (!req.user.admin) {
        return res.status(403).json({ error: "Unauthorized" });
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
          // Most recent login
          logs: {
            where: {
              type: LogType.USER_LOGIN,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
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
        lastLogin: user.logs[0]?.createdAt,
        logs: undefined,
      }));

      // Remove undefined values
      users = users.map((user) =>
        Object.fromEntries(
          Object.entries(user).filter(([, v]) => v !== undefined)
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
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "An error occurred" });
    }
  },
];
