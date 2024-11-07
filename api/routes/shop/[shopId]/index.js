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

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId: shop.id,
        },
        select: {
          accountType: true,
          accountTitle: true,
        },
      });

      if (userShop) {
        const userBalance = await prisma.ledgerItem.aggregate({
          where: {
            userId: req.user.id,
            shopId: shop.id,
          },
          _sum: {
            value: true,
          },
        });

        userShop.balance = userBalance._sum.value || 0;
      }

      let users;
      if (req.query.includeUsers && req.query.includeUsers === "true") {
        if (
          !(
            userShop.accountType === "ADMIN" ||
            userShop.accountType === "OPERATOR" ||
            req.user.admin
          )
        ) {
          return res.status(400).json({ error: "Forbidden" });
        }

        users = await prisma.userShop.findMany({
          where: {
            shopId: shop.id,
          },
          include: {
            user: {
              include: {
                ledgerItems: {
                  select: {
                    value: true,
                  },
                },
                jobs: {
                  select: {
                    status: true,
                  },
                },
              },
            },
          },
        });

        users = users.map((userShop) => {
          const jobCounts = userShop.user.jobs.reduce(
            (acc, job) => {
              switch (job.status) {
                case "COMPLETED":
                  acc.completedCount += 1;
                  break;
                case "IN_PROGRESS":
                  acc.inProgressCount += 1;
                  break;
                case "NOT_STARTED":
                  acc.notStartedCount += 1;
                  break;
                default:
                  acc.excludedCount += 1;
                  break;
              }
              return acc;
            },
            {
              completedCount: 0,
              inProgressCount: 0,
              notStartedCount: 0,
              excludedCount: 0,
            }
          );

          return {
            ...userShop,
            user: {
              ...userShop.user,
              name: `${userShop.user.firstName} ${userShop.user.lastName}`,
              balance: userShop.user.ledgerItems.reduce(
                (acc, item) => acc + item.value,
                0
              ),
              jobCounts,
              totalJobs: userShop.user.jobs.length,
              ledgerItems: undefined,
              jobs: undefined,
            },
          };
        });
      }

      res.json({ shop, userShop, users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];

export const put = [
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
      });

      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId: shop.id,
        },
      });

      if (!userShop.active) {
        return res.status(403).json({ error: "User is not active in shop" });
      }

      if (userShop.accountType !== "ADMIN" && !req.user.admin) {
        return res.status(403).json({ error: "User is not an admin" });
      }

      req.body.startingDeposit = parseFloat(req.body.startingDeposit);

      const updatedShop = await prisma.shop.update({
        where: {
          id: shop.id,
        },
        data: req.body,
        select: SHOP_SELECT,
      });

      res.json({ shop: updatedShop });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
];
