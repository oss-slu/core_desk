import samlConfig from "../../config/saml-config.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from "#prisma";
import { LogType } from "@prisma/client";

export const get = [
  (req, res) => {
    res.json({
      url: samlConfig.login,
    });
  },
];


export const post = [
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });


      if (!user || !user.password) { //if there is no user matching the email or there is null or nothing this means that they are most likely an SSO user
        await prisma.logs.create({ data: { type: LogType.USER_LOGIN_FAILURE, message :  `Failed to login ${email}`}});

        return res.status(401).json({ error: "Invalid credentials or SSO required" });

      }
      const isMatched = await bcrypt.compare(password, user.password);
      if (!isMatched) {
        await prisma.logs.create({ data: { type: LogType.USER_LOGIN_FAILURE, userId: user.id } });
        return res.status(401).json({ error: "Invalid credentials or SSO required" });
      }

      await prisma.logs.create({ data: { type: LogType.USER_LOGIN_LOCAL, userId: user.id } });

      const token = jwt.sign( //signed with information
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        process.env.JWT_SECRET,
        { expiresIn: "3h" }
      );

     return res.status(200).json({ token });
    }

    catch (error) {
      console.log("Error", error);

      return res.status(500).json({ error: "Internal server error" });

    }
  }
]




export const put = [
  async (req, res) => {
    const { userId, password } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { userId } });


      if (!user || !user.password) { //if there is no user matching the userId

        return res.status(404).json({ error: "Invalid credentials or SSO required" });

      }
      const hashedPassword = bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
      await prisma.logs.create({ data: { type: LogType.USER_PASSWORD_CHANGE, userId: user.id } });
      return res.status(200);
    }

    catch (error) {
      console.log("Error", error);

      return res.status(500).json({ error: "Internal server error" });

    }
  }
]