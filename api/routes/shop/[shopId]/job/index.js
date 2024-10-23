import { LogType } from "@prisma/client";
import { prisma } from "../../../../util/prisma.js";
import { verifyAuth } from "../../../../util/verifyAuth.js";

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;

    // Check to see if the user exists on the shop
    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const { title, description, dueDate } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        shopId,
        userId,
        dueDate: new Date(dueDate),
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.JOB_CREATED,
        userId,
        shopId,
        jobId: job.id,
      },
    });

    return res.json({ job });
  },
];

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;

    let jobs = await prisma.job.findMany({
      where: {
        shopId,
        user: {
          id: userId,
        },
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      take: req.query.limit ? parseInt(req.query.limit) : 20,
      skip: req.query.offset ? parseInt(req.query.offset) : 0,
    });

    jobs = jobs.map((job) => {
      job.itemsCount = job._count.items;
      delete job._count;
      return job;
    });

    const count = await prisma.job.count({
      where: {
        shopId,
        user: {
          id: userId,
        },
      },
    });

    return res.json({
      jobs,
      meta: {
        total: count,
        count: jobs.length,
        offset: req.query.offset ? parseInt(req.query.offset) : 0,
      },
    });
  },
];
