import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "#prisma";
import postmark from "postmark";

export const post = [
  async (req, res) => {
    const { email } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "User does not exist." });
      }

      const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

      const resetToken = crypto.randomUUID(); //we need some mechanism to add expiry dates, on the reset , should we also store this in db?

      const resetLink = `${process.env.BASE_URL}/password-reset?token=${resetToken}`;

      client.sendEmail({
        From: "coredesk@jackcrane.rocks",
        To: email,
        Subject: "Reset Your CoreDesk Password",
        HtmlBody: `
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
        MessageStream: "outbound",
      });
    } catch (error) {
        return res.status(500).json({ error: "Failed to send email." });
    }
  },
];

export const put = [];
