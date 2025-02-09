import { verifyAuth } from "#verifyAuth";
import prisma from "#prisma";

export const post = [
  verifyAuth,
  async (req, res) => {
    const { url } = req.body;
    const userId = req.user.id;

    await prisma.navigation.create({
      data: {
        url,
        userId,
      },
    });

    res.status(200).json({ message: "ok" });
  },
];
