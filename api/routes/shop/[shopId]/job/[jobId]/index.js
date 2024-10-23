import { LogType } from "@prisma/client";
import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId } = req.params;
    const userId = req.user.id;

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
        userId,
      },
      include: {
        items: {
          where: {
            active: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ job });
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId } = req.params;
    const userId = req.user.id;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
      },
    });

    if (!userShop) {
      return res.status(400).json({ error: "Forbidden" });
    }

    let job;

    if (userShop.accountType === "CUSTOMER" && !req.user.admin) {
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          userId: req.user.id,
        },
      });
    } else {
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
        },
      });
    }

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    delete req.body.id;
    delete req.body.userId;
    delete req.body.shopId;
    delete req.body.createdAt;
    delete req.body.updatedAt;
    delete req.body.items;

    const updatedJob = await prisma.job.update({
      where: {
        id: jobId,
      },
      data: req.body,
      include: {
        items: {
          where: {
            active: true,
          },
        },
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.JOB_MODIFIED,
        userId,
        shopId,
        jobId,
        from: JSON.stringify(job),
        to: JSON.stringify(updatedJob),
      },
    });

    return res.json({ job: updatedJob });
  },
];
