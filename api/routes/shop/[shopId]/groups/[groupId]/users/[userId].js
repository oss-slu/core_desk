import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";

export const del = [
  verifyAuth,
  async (req, res) => {
    const userId = req.user.id;
    const { shopId, groupId, userId: targetUserId } = req.params;

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
      userShop.accountType === "GROUP_ADMIN" ||
      userId === targetUserId;

    if (!userIsPrivileged) {
      return res.status(400).send({ error: "Forbidden" });
    }

    const userBillingGroup = await prisma.userBillingGroup.findFirst({
      where: {
        userId: targetUserId,
        billingGroupId: groupId,
      },
    });

    const newBGUser = await prisma.userBillingGroup.update({
      where: {
        id: userBillingGroup.id,
      },
      data: {
        active: false,
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.USER_REMOVED_FROM_BILLING_GROUP,
        userId: targetUserId,
        shopId,
        billingGroupId: groupId,
        userBillingGroupId: userBillingGroup.id,
      },
    });

    res.send({ success: true });

    console.log(newBGUser);
  },
];

export const get = [
  verifyAuth,
  async (req, res) => {
    console.log("GEtting User");
    const userId = req.user.id;
    const { shopId, groupId, userId: targetUserId } = req.params;

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
      userShop.accountType === "GROUP_ADMIN" ||
      userId === targetUserId;

    if (!userIsPrivileged) {
      return res.status(400).send({ error: "Forbidden" });
    }

    const billingGroupUser = await prisma.userBillingGroup.findFirst({
      where: {
        userId: targetUserId,
        billingGroupId: groupId,
      },
    });

    res.send({ billingGroupUser });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId, groupId, userId } = req.params;
    const { role } = req.body;

    // Make sure requesting user is privileged
    const requestingUserShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    if (
      !requestingUserShop ||
      requestingUserShop.accountType !== "ADMIN" ||
      !req.user.admin
    ) {
      return res.status(400).json({ error: "Forbidden" });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const billingGroupUser = await prisma.userBillingGroup.findFirst({
      where: {
        userId: userId,
        billingGroupId: groupId,
      },
    });

    if (billingGroupUser) {
      if (billingGroupUser.role === role && billingGroupUser.active) {
        return res.json({ success: true });
      } else {
        await prisma.userBillingGroup.update({
          where: {
            id: billingGroupUser.id,
          },
          data: {
            role,
            active: true,
          },
        });

        await prisma.logs.create({
          data: {
            type: LogType.USER_BILLING_GROUP_ROLE_CHANGED,
            userId: userId,
            shopId,
            billingGroupId: groupId,
            userBillingGroupId: billingGroupUser.id,
          },
        });

        return res.json({ success: true });
      }
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

    // Add the user to the billing group
    const newUbg = await prisma.userBillingGroup.create({
      data: {
        userId,
        billingGroupId: groupId,
        role,
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.USER_ADDED_TO_BILLING_GROUP,
        userId: userId,
        shopId,
        billingGroupId: groupId,
        userBillingGroupId: newUbg.id,
        to: JSON.stringify(newUbg),
      },
    });

    res.json({ success: true });
  },
];
