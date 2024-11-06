import { prisma } from "#prisma";
import { verifyAuth, verifyAuthAlone } from "#verifyAuth";
import { LogType } from "@prisma/client";

export const get = [
  async (req, res) => {
    try {
      const { shopId, inviteId } = req.params;

      const invite = await prisma.billingGroupInvitationLink.findFirst({
        where: {
          id: inviteId,
        },
        include: {
          billingGroup: {
            include: {
              users: {
                where: {
                  role: "ADMIN",
                },
                select: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      res.json({ invite });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { shopId, inviteId } = req.params;

      const invite = await prisma.billingGroupInvitationLink.findFirst({
        where: {
          id: inviteId,
        },
      });

      if (!invite) {
        return res.status(400).send({ error: "Invalid invitation" });
      }

      if (invite.expires < new Date()) {
        return res.status(400).send({ error: "Invitation expired" });
      }

      const group = await prisma.billingGroup.findFirst({
        where: {
          id: invite.groupId,
        },
      });

      if (!group) {
        return res.status(400).send({ error: "Invalid group" });
      }

      let userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        const inactiveUserShop = await prisma.userShop.findFirst({
          where: {
            userId,
            shopId,
            active: false,
          },
        });

        if (inactiveUserShop) {
          userShop = await prisma.userShop.update({
            where: {
              id: inactiveUserShop.id,
            },
            data: {
              active: true,
            },
          });
        } else {
          userShop = await prisma.userShop.create({
            data: {
              userId,
              shopId,
              active: true,
              accountType: "CUSTOMER",
            },
          });
        }

        await prisma.logs.create({
          data: {
            type: LogType.USER_CONNECTED_TO_SHOP,
            userId,
            shopId,
          },
        });
      }

      const userBillingGroup = await prisma.userBillingGroup.findFirst({
        where: {
          userId,
          billingGroupId: invite.billingGroupId,
        },
      });

      if (userBillingGroup) {
        await prisma.userBillingGroup.update({
          where: {
            id: userBillingGroup.id,
          },
          data: {
            active: true,
          },
        });
      } else {
        await prisma.userBillingGroup.create({
          data: {
            userId,
            billingGroupId: invite.billingGroupId,
            role: "MEMBER",
          },
        });
      }

      await prisma.logs.create({
        data: {
          type: LogType.USER_ADDED_TO_BILLING_GROUP,
          userId,
          shopId,
          billingGroupId: invite.billingGroupId,
          billingGroupInvitationLinkId: invite.id,
        },
      });

      res.json({ group });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const userId = req.user.id;
    const { shopId, inviteId } = req.params;

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
      return res.status(400).send({ error: "Forbidden" });
    }

    const { expires, title, description, active } = req.body;

    const originalInvite = await prisma.billingGroupInvitationLink.findFirst({
      where: {
        id: inviteId,
      },
    });

    const invite = await prisma.billingGroupInvitationLink.update({
      where: {
        id: inviteId,
      },
      data: {
        expires: expires ? new Date(expires) : undefined,
        title,
        description,
        active,
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.BILLING_GROUP_INVITATION_LINK_MODIFIED,
        from: JSON.stringify(originalInvite),
        to: JSON.stringify(invite),
        userId,
        shopId,
        billingGroupId: invite.billingGroupId,
        billingGroupInvitationLinkId: invite.id,
      },
    });

    res.json({ invite });
  },
];
