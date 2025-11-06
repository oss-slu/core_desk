import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";
import { createUser } from "#createUser";

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId, groupId } = req.params;
    const { role, newUser } = req.body || {};

    try {
      const requesterShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId,
          active: true,
        },
      });

      if (
        !(
          (requesterShop && requesterShop.accountType === "ADMIN") ||
          req.user.admin
        )
      ) {
        return res.status(400).json({ error: "Forbidden" });
      }

      if (!["ADMIN", "MEMBER"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (
        !newUser ||
        !newUser.email?.trim() ||
        !newUser.firstName?.trim() ||
        !newUser.lastName?.trim()
      ) {
        return res.status(400).json({ error: "Missing new user information" });
      }

      const billingGroup = await prisma.billingGroup.findFirst({
        where: {
          id: groupId,
          shopId,
          active: true,
        },
      });

      if (!billingGroup) {
        return res.status(404).json({ error: "Group not found" });
      }

      const normalizedPayload = {
        email: newUser.email.trim().toLowerCase(),
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
      };

      let user;
      try {
        user = await createUser(normalizedPayload);
      } catch (error) {
        if (error.code === "P2002") {
          return res.status(400).json({
            error: "A user with that email already exists",
          });
        }
        throw error;
      }

      const existingUserShop = await prisma.userShop.findFirst({
        where: {
          userId: user.id,
          shopId,
        },
      });

      if (!existingUserShop) {
        await prisma.userShop.create({
          data: {
            userId: user.id,
            shopId,
            active: true,
          },
        });

        await prisma.logs.create({
          data: {
            type: LogType.USER_CONNECTED_TO_SHOP,
            userId: user.id,
            shopId,
          },
        });
      }

      const billingGroupUser = await prisma.userBillingGroup.create({
        data: {
          userId: user.id,
          billingGroupId: groupId,
          role,
        },
      });

      await prisma.logs.create({
        data: {
          type: LogType.USER_ADDED_TO_BILLING_GROUP,
          userId: user.id,
          shopId,
          billingGroupId: groupId,
          userBillingGroupId: billingGroupUser.id,
          to: JSON.stringify(billingGroupUser),
        },
      });

      return res.json({
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Failed to create user for billing group", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];
