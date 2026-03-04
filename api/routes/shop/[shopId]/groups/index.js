import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "#prisma-client";

const getGroupBalanceMap = async (shopId, groupIds) => {
  if (!groupIds.length) return {};

  const rows = await prisma.ledgerItem.groupBy({
    by: ["billingGroupId"],
    where: {
      shopId,
      billingGroupId: {
        in: groupIds,
      },
    },
    _sum: {
      value: true,
    },
  });

  return Object.fromEntries(
    rows.map((row) => [row.billingGroupId, row._sum.value || 0])
  );
};

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { title } = req.body;
      const { shopId } = req.params;
      if (!title) {
        return res.status(400).send({ error: "Title is required" });
      }

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(400).send({ error: "Forbidden" });
      }

      const userIsPrivileged =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR" ||
        userShop.accountType === "GROUP_ADMIN";
      const userIsStaff =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      if (!userIsPrivileged) {
        return res.status(400).send({ error: "Forbidden" });
      }

      let userToConnect = null;
      if (req.body.assignAdminToSelf) {
        userToConnect = {
          userId,
          role: "ADMIN",
        };
      } else {
        if (!userIsStaff) {
          return res.status(400).send({ error: "Forbidden" });
        }
        if (!req.body.adminUserId) {
          return res.status(400).send({ error: "Admin user ID is required" });
        }
        userToConnect = {
          userId: req.body.adminUserId,
          role: "ADMIN",
        };
      }

      const group = await prisma.billingGroup.create({
        data: {
          shopId,
          title,
          users: {
            create: userToConnect,
          },
        },
      });

      const promotedAccounts = await prisma.userShop.updateMany({
        where: {
          userId: userToConnect.userId,
          shopId,
          accountType: "CUSTOMER",
        },
        data: {
          accountType: "GROUP_ADMIN",
        },
      });

      if (promotedAccounts.count) {
        await prisma.logs.create({
          data: {
            userId: userToConnect.userId,
            shopId,
            billingGroupId: group.id,
            type: LogType.USER_SHOP_ROLE_CHANGED,
            message: "User promoted to group admin by billing group creation",
            to: JSON.stringify({ accountType: "GROUP_ADMIN" }),
          },
        });
      }

      await prisma.logs.createMany({
        data: [
          {
            userId,
            shopId,
            billingGroupId: group.id,
            type: LogType.BILLING_GROUP_CREATED,
            to: JSON.stringify({ group }),
          },
          {
            userId: userToConnect.userId,
            shopId,
            billingGroupId: group.id,
            type: LogType.USER_ADDED_TO_BILLING_GROUP,
            to: JSON.stringify({ group }),
          },
        ],
      });

      const groups = await prisma.billingGroup.findMany({
        where: {
          shopId,
          active: true,
          users: userIsPrivileged
            ? undefined
            : {
                some: {
                  userId,
                },
              },
        },
        include: {
          users: {
            where: {
              role: "ADMIN",
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              role: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  id: true,
                },
              },
            },
          },
          _count: {
            select: {
              users: {
                where: {
                  active: true,
                },
              },
            },
          },
        },
      });
      const groupBalanceMap = await getGroupBalanceMap(
        shopId,
        groups.map((g) => g.id)
      );

      // Process each group to find the admin user and rename _count.users to userCount
      const groupsWithUserCountAndAdmin = groups.map((group) => {
        const adminUsers = group.users.filter((user) => user.role === "ADMIN");
        return {
          ...group,
          balance: groupBalanceMap[group.id] || 0,
          userCount: group._count.users,
          adminUsers: adminUsers.map((user) => ({
            name: user.user.firstName + " " + user.user.lastName,
            id: user.user.id,
          })),
          users: undefined,
          _count: undefined,
        };
      });

      res.send({
        groups: groupsWithUserCountAndAdmin,
        createdGroupId: group.id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { shopId } = req.params;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(400).send({ error: "Forbidden" });
      }

      const userIsPrivileged =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      const groups = await prisma.billingGroup.findMany({
        where: {
          shopId,
          active: true,
          users: userIsPrivileged
            ? undefined
            : {
                some: {
                  userId,
                },
              },
        },
        include: {
          users: {
            where: {
              OR: [{ role: "ADMIN" }, { userId: req.user.id }],
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              role: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  id: true,
                },
              },
            },
          },
          _count: {
            select: {
              users: {
                where: {
                  active: true,
                },
              },
            },
          },
        },
      });
      const groupBalanceMap = await getGroupBalanceMap(
        shopId,
        groups.map((g) => g.id)
      );

      // Process each group to find the admin user and rename _count.users to userCount
      const groupsWithUserCountAndAdmin = groups.map((group) => {
        const adminUsers = group.users.filter((user) => user.role === "ADMIN");

        const userHasPermissionToCreateJobsOnBillingGroup =
          !!group.users.find(
            (user) => user.role === "ADMIN" && user.user.id === req.user.id
          ) ||
          userShop.accountType === "ADMIN" ||
          userShop.accountType === "OPERATOR" ||
          req.user.admin ||
          group.membersCanCreateJobs;

        return {
          ...group,
          balance: groupBalanceMap[group.id] || 0,
          userCount: group._count.users,
          adminUsers: adminUsers.map((user) => ({
            name: user.user.firstName + " " + user.user.lastName,
            id: user.user.id,
          })),
          userHasPermissionToCreateJobsOnBillingGroup,
          users: undefined,
          _count: undefined,
        };
      });

      res.send({ groups: groupsWithUserCountAndAdmin });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];
