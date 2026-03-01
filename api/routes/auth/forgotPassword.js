import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "#prisma";
import postmark from "postmark";
import { LogType } from "@prisma/client";

export const post = [
  async (req, res) => {
    const { email } = req.body;
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      }); //emails need to be exact so when we create user, the email needs to be stored with lowercase.
      
      
      if (!user) {
        console.log("error user not found");
        return res.status(404).json({ error: "User does not exist." });
      }


      console.log("User found, sending email...");

      const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const resetLink = `${process.env.BASE_URL}/reset?reset_tok=${resetToken}`; //setting to base_url for now to test locally

      await client.sendEmail({
        From: '"CoreDesk Notifications" <coredesk@jackcrane.rocks>',
        To: email,
        Subject: "Reset Your CoreDesk Password",
        HtmlBody: `
          <p>Click below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
        `,
        MessageStream: "outbound",
      });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to send email." });
    }
  },
];
export const put = [
  async (req, res) => {
    const { newPassword, token } = req.body;

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const user = await prisma.user.findUnique({
        where: { id: decodedToken.id },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid or expired link." });
      }

      await prisma.user.update({
        where: { id: decodedToken.id },
        data: { password: hashedPassword },
      });
      await prisma.logs.create({
        data: { type: LogType.USER_PASSWORD_CHANGE, userId: user.id },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: "Invalid or expired link." });
    }
  },
];
