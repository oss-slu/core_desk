import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "#prisma";
import postmark from "postmark";

export const post = [
  async (req, res) => {
    const { email } = req.body;
    try {
      console.log("email", email);
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      }); //emails need to be exact so when we create user, the email needs to be stored with lowercase.
      if (!user) {
        return res.status(401).json({ error: "User does not exist." });
      }

      const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const resetLink = `${process.env.BASE_URL}/reset?reset_tok=${resetToken}`; //setting to base_url for now to test locally

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
      return res.status(200);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to send email." });
    }
  },
];
// export const put = [
//   async (req, res) => {
//     const { password, token } = req.body;
//     try {
//       try {
//         const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//       } catch (error) {
//         console.error(error);
//         return res.status(400).json({ error: "Invalid or expired token." });
//       }
//       const hashedPassword = bcrypt(password, 10); //hashed password

//       const user = await prisma.user.findUnique({
//         where: { userId: decodedToken },
//       });
   
//       if (!user) {
//         return res.status(401).json({ error: "User does not exist." });
//       }

//       await prisma.user.update({ where: { password: hashedPassword } });

//       return res.status(200);
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ error: "Failed to send email." });
//     }
//   },
// ];
