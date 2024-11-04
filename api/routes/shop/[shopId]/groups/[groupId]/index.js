import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { shopId, groupId } = req.params;

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

      const originalGroup = await prisma.billingGroup.findFirst({
        where: {
          id: groupId,
        },
      });

      const group = await prisma.billingGroup.update({
        where: {
          id: groupId,
        },
        data: {
          title: req.body.title,
          description: req.body.description,
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          billingGroupId: group.id,
          type: LogType.BILLING_GROUP_MODIFIED,
          from: JSON.stringify({ group: originalGroup }),
          to: JSON.stringify({ group }),
        },
      });

      res.json({ group });
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
      const { shopId, groupId } = req.params;

      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
      }

      if (!groupId) {
        return res.status(400).send({ error: "Group ID is required" });
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
        userShop.accountType === "OPERATOR";

      if (!userIsPrivileged) {
        const userGroup = await prisma.userBillingGroup.findFirst({
          where: {
            userId,
            billingGroupId: groupId,
            active: true,
          },
        });

        if (!userGroup) {
          return res.status(400).send({ error: "Forbidden" });
        }
      }

      const userIsPrivilegedOrGroupAdmin =
        userIsPrivileged || userShop.accountType === "GROUP_ADMIN";

      const group = await prisma.billingGroup.findFirst({
        where: {
          id: groupId,
        },
        include: {
          users: userIsPrivilegedOrGroupAdmin ? true : false,
        },
      });

      res.json({ group });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];

export const merge = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { shopId, groupId } = req.params;
      const { targetUserId } = req.query;

      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
      }
      if (!groupId) {
        return res.status(400).send({ error: "Group ID is required" });
      }
      if (!targetUserId) {
        return res.status(400).send({ error: "Target user ID is required" });
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

      let targetUserShop = await prisma.userShop.findFirst({
        where: {
          userId: targetUserId,
          shopId,
          active: true,
        },
      });

      if (!targetUserShop) {
        // Add user to shop
        targetUserShop = await prisma.userShop.create({
          data: {
            userId: targetUserId,
            shopId,
            accountType: "CUSTOMER",
          },
        });
      }

      const billingGroup = await prisma.userBillingGroup.findFirst({
        where: {
          userId: targetUserId,
          billingGroupId: groupId,
        },
      });

      if (billingGroup) {
        if (billingGroup.active) {
          return res.status(400).send({ error: "User is already in group" });
        }

        await prisma.userBillingGroup.update({
          where: {
            id: billingGroup.id,
          },
          data: {
            active: true,
          },
        });
      } else {
        await prisma.userBillingGroup.create({
          data: {
            userId: targetUserId,
            billingGroupId: groupId,
            role: "MEMBER",
          },
        });
      }

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          billingGroupId: groupId,
          type: LogType.USER_ADDED_TO_BILLING_GROUP,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];

export const purge = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { shopId, groupId } = req.params;
      const { targetUserId } = req.query;

      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
      }
      if (!groupId) {
        return res.status(400).send({ error: "Group ID is required" });
      }
      if (!targetUserId) {
        return res.status(400).send({ error: "Target user ID is required" });
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

      const billingGroup = await prisma.userBillingGroup.findFirst({
        where: {
          userId: targetUserId,
          billingGroupId: groupId,
        },
      });

      if (!billingGroup) {
        return res.status(400).send({ error: "User is not in group" });
      }

      await prisma.userBillingGroup.update({
        where: {
          id: billingGroup.id,
        },
        data: {
          active: false,
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          billingGroupId: groupId,
          type: LogType.USER_REMOVED_FROM_BILLING_GROUP,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];
