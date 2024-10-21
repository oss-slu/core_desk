import { LogType } from "@prisma/client";
import { prisma } from "../../../util/prisma.js";
import { verifyAuth } from "../../../util/verifyAuth.js";

export const post = [
  verifyAuth,
  async (req, res) => {
    if (!req.user.admin) {
      res.status(403).json({
        message: "You are not authorized to perform this action",
      });
      return;
    }

    let user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (user.admin) {
      res.status(400).json({
        message: "User is already an admin",
      });
      return;
    }

    await prisma.user.update({
      where: {
        id: req.params.userId,
      },
      data: {
        admin: true,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.user.id,
        type: LogType.USER_PROMOTED_TO_ADMIN,
      },
    });

    res.json({
      message: "User is now an admin",
    });
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    if (!req.user.admin) {
      res.status(403).json({
        message: "You are not authorized to perform this action",
      });
      return;
    }

    let user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (!user.admin) {
      res.status(400).json({
        message: "User is not an admin",
      });
      return;
    }

    await prisma.user.update({
      where: {
        id: req.params.userId,
      },
      data: {
        admin: false,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.user.id,
        type: LogType.USER_DEMOTED_FROM_ADMIN,
      },
    });

    res.json({
      message: "User is no longer an admin",
    });
  },
];
