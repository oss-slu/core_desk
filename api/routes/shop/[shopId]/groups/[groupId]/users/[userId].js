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
