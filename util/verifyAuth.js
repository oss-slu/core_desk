import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";

export const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Bearer token
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }
      // req.user = user; // Attach the user object to the request

      const _user = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!_user) {
        return res.sendStatus(401); // Unauthorized
      }

      req.user = _user;

      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};
