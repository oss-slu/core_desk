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

    await prisma.user.update({
      where: {
        id: req.params.userId,
      },
      data: {
        suspended: true,
        suspensionReason: req.body.reason,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.params.userId,
        type: LogType.USER_SUSPENSION_APPLIED,
        to: JSON.stringify({
          reason: req.body.reason,
        }),
      },
    });

    res.json({
      message: "User is now suspended",
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

    await prisma.user.update({
      where: {
        id: req.params.userId,
      },
      data: {
        suspended: false,
        suspensionReason: null,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.params.userId,
        type: LogType.USER_SUSPENSION_REMOVED,
        from: JSON.stringify({
          reason: user.suspensionReason,
        }),
      },
    });

    res.json({
      message: "User is no longer suspended",
    });
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    // Change suspension reason
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

    if (!user.suspended) {
      res.status(400).json({
        message: "User is not suspended",
      });
      return;
    }

    await prisma.user.update({
      where: {
        id: req.params.userId,
      },
      data: {
        suspensionReason: req.body.reason,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.params.userId,
        type: LogType.USER_SUSPENSION_CHANGED,
        from: JSON.stringify({
          reason: user.suspensionReason,
        }),
        to: JSON.stringify({
          reason: req.body.reason,
        }),
      },
    });

    res.json({
      message: "Suspension reason has been updated",
    });
  },
];
