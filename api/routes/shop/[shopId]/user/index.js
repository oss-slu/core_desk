import { LogType } from "#prisma-client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import client from "#postmark";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR" &&
      userShop.accountType !== "GROUP_ADMIN"
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let users = await prisma.userShop.findMany({
      where: {
        shopId,
        active: true,
      },
      select: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
            email: true,
          },
        },
      },
    });


    users = users.map((user) => ({
      name: `${user.user.firstName} ${user.user.lastName}`,
      ...user.user,
    }));

    return res.json({
      users,
      meta: {
        total: users.length,
      },
    });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;

      const {
        userEmail,
        userFirstName,
        userLastName,
      } = req.body;

      if (userEmail && userFirstName && userLastName) {
        const exists = await prisma.userShop.findFirst({
          where: {
            shopId,
            active: true,
            user: {
              email: userEmail,
            },
          },
        });

        if (exists) {
          return res.status(409).json({ error: "User already exists" });
        }

        const user = await prisma.user.create({
          data: {
            email: userEmail,
            firstName: userFirstName,
            lastName: userLastName,
          },
        });

        await prisma.userShop.create({
          data: {
            userId: user.id,
            shopId: shopId,
            active: true,
          },
        });

        await prisma.logs.create({
          data: {
            userId: user.id,
            type: LogType.USER_CONNECTED_TO_SHOP,
            shopId: shopId,
          },
        });

        await prisma.logs.create({
          data: {
            userId: user.id,
            type: LogType.USER_CREATED,
          },
        });

        const link = `${process.env.BASE_URL}`;

        await client.sendEmail({
          "From": `"CoreDesk Notifications" <${process.env.POSTMARK_FROM_EMAIL}>`,
          "To": `${userEmail}`,
          "Subject": `You are invited to join CoreDesk!`,
          "HtmlBody": `
            <p>Hello ${userFirstName},</p>
            <p>You have been invited to join CoreDesk. Please click the link below to log in.</p>
            <a href="${link}">${link}</a>
            <br>
            <p>If you did not expect this email, please ignore it.</p>
            <br>
            <p>Thank you,</p>
            <p>The CoreDesk Team</p>
          ` ,
          "MessageStream": "outbound"
        });

        return res.json({ user });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  }
];
