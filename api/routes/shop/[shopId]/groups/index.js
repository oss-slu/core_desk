import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";

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
      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
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

      if (!userIsPrivileged) {
        return res.status(400).send({ error: "Forbidden" });
      }

      const group = await prisma.billingGroup.create({
        data: {
          shopId,
          title,
          users: {
            connect: {
              userId,
              role: "ADMIN",
            },
          },
        },
      });

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
            userId,
            shopId,
            billingGroupId: group.id,
            type: LogType.USER_ADDED_TO_BILLING_GROUP,
            to: JSON.stringify({ group }),
          },
        ],
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

      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
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

      const groups = await prisma.billingGroup.findMany({
        where: {
          shopId,
          users: {
            some: {
              userId,
            },
          },
        },
      });

      res.send({ groups });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];
