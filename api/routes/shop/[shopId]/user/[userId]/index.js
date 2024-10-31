import { LogType } from "@prisma/client";
import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";
import { calculateTotalCostOfJobByJobId } from "../../../../../util/docgen/invoice.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { userId, shopId } = req.params;

      const authUserShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId: shopId,
          active: true,
        },
      });

      if (!authUserShop) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      if (
        !(
          req.user.admin ||
          authUserShop.accountType === "ADMIN" ||
          authUserShop.accountType === "OPERATOR"
        )
      ) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const user = await prisma.userShop.findFirst({
        where: {
          userId: userId,
          shopId: shopId,
          active: true,
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
                  id: true,
                  title: true,
                  dueDate: true,
                  createdAt: true,
                  finalized: true,
                  finalizedAt: true,
                },
              },
            },
          },
        },
      });

      const jobCounts = user.user.jobs.reduce(
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

      user.user.jobCounts = jobCounts;
      user.user.balance = user.user.ledgerItems.reduce(
        (acc, item) => acc + item.value,
        0
      );
      delete user.user.ledgerItems;

      user.user.isMe = user.userId === req.user.id;

      const updatedJobs = await Promise.all(
        user.user.jobs.map(async (job) => {
          const totalCost = await calculateTotalCostOfJobByJobId(job.id);
          return { ...job, totalCost };
        })
      );

      user.user.jobs = updatedJobs;

      if (!user) {
        return res.status(400).json({ error: "User is not connected to shop" });
      }

      res.json({ userShop: user });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const shopId = req.params.shopId;

      // Make sure the current user has authority to add users to the shop.
      const shopAdmin = await prisma.shop.findUnique({
        where: {
          id: shopId,
          users: {
            some: {
              userId: req.user.id,
              accountType: "ADMIN",
              active: true,
            },
          },
        },
      });

      console.log(req.user.admin, shopAdmin);

      if (!req.user.admin && !shopAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Make sure the user is not already connected to the shop.
      const connectionExists = await prisma.userShop.findFirst({
        where: {
          userId: userId,
          shopId: shopId,
        },
      });

      // If the connection exists AND it is set as active, return an error.
      if (connectionExists && connectionExists.active) {
        return res
          .status(400)
          .json({ error: "User is already connected to shop" });
      }

      if (connectionExists) {
        await prisma.userShop.update({
          where: {
            id: connectionExists.id,
          },
          data: {
            active: true,
            accountType: req.body.role,
          },
        });

        await prisma.logs.create({
          data: {
            userId: userId,
            shopId: shopId,
            to: JSON.stringify(connectionExists),
            message: `Reconnected user to shop as a${
              req.body.role === "CUSTOMER"
                ? " customer"
                : req.body.role === "OPERATOR"
                ? "n operator"
                : req.body.role === "ADMIN"
                ? "n admin"
                : req.body.role === "INSTRUCTOR"
                ? "n instructor"
                : ""
            }`,
            type: LogType.USER_CONNECTED_TO_SHOP,
          },
        });

        return res.json({ message: "success" });
      }

      // Add the user to the shop.
      const connection = await prisma.shop.update({
        where: {
          id: shopId,
        },
        data: {
          users: {
            create: {
              accountType: req.body.role,
              userId: userId,
            },
          },
        },
      });

      if (!connection) {
        return res.status(400).json({ error: "Failed to add user to shop" });
      }

      await prisma.logs.create({
        data: {
          userId: userId,
          shopId: shopId,
          to: JSON.stringify(connection),
          type: LogType.USER_CONNECTED_TO_SHOP,
        },
      });

      res.json({ message: "success" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const shopId = req.params.shopId;

      // Make sure the current user has authority to remove users from the shop.
      const shopAdmin = await prisma.shop.findUnique({
        where: {
          id: shopId,
          users: {
            some: {
              userId: req.user.id,
              accountType: "ADMIN",
              active: true,
            },
          },
        },
      });

      if (!req.user.admin && !shopAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Make sure the user is connected to the shop.
      const connectionExists = await prisma.userShop.findFirst({
        where: {
          userId: userId,
          shopId: shopId,
          active: true,
        },
      });

      if (!connectionExists) {
        return res.status(400).json({ error: "User is not connected to shop" });
      }

      // Remove the user from the shop.
      const connection = await prisma.userShop.update({
        where: {
          id: connectionExists.id,
        },
        data: {
          active: false,
        },
      });

      if (!connection) {
        return res
          .status(400)
          .json({ error: "Failed to remove user from shop" });
      }

      await prisma.logs.create({
        data: {
          userId: userId,
          shopId: shopId,
          from: JSON.stringify(connection),
          message: `Removed user from the shop`,
          type: LogType.USER_DISCONNECTED_FROM_SHOP,
        },
      });

      res.json({ message: "success" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const shopId = req.params.shopId;

      // Make sure the current user has authority to change user roles in the shop.
      const shopAdmin = await prisma.shop.findUnique({
        where: {
          id: shopId,
          users: {
            some: {
              userId: req.user.id,
              accountType: "ADMIN",
              active: true,
            },
          },
        },
      });

      if (!req.user.admin && !shopAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Make sure the user is connected to the shop.
      const connectionExists = await prisma.userShop.findFirst({
        where: {
          userId: userId,
          shopId: shopId,
          active: true,
        },
      });

      if (!connectionExists) {
        return res.status(400).json({ error: "User is not connected to shop" });
      }

      // Update the user's role in the shop.
      const connection = await prisma.userShop.update({
        where: {
          id: connectionExists.id,
        },
        data: {
          accountType: req.body.role,
        },
      });

      if (!connection) {
        return res.status(400).json({ error: "Failed to update user role" });
      }

      await prisma.logs.create({
        data: {
          userId: userId,
          shopId: shopId,
          to: JSON.stringify(connection),
          message: `Updated user role in the shop to a${
            req.body.role === "CUSTOMER"
              ? " customer"
              : req.body.role === "OPERATOR"
              ? "n operator"
              : req.body.role === "ADMIN"
              ? "n admin"
              : req.body.role === "INSTRUCTOR"
              ? "n instructor"
              : ""
          }`,
          type: LogType.USER_SHOP_ROLE_CHANGED,
        },
      });

      res.json({ message: "success" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  },
];
