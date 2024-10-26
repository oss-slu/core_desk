import { LogType } from "@prisma/client";
import { prisma } from "../../../../util/prisma.js";
import { verifyAuth } from "../../../../util/verifyAuth.js";

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
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
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;

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

      const shouldLoadAll =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      let jobs = await prisma.job.findMany({
        where: {
          shopId,
          user: {
            id: shouldLoadAll ? undefined : userId,
          },
        },
        include: {
          _count: {
            select: {
              items: {
                where: {
                  active: true,
                },
              }, // Total count of items
            },
          },
          items: {
            where: {
              active: true,
            },
            select: {
              status: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              id: true,
            },
          },
        },
        take: req.query.limit ? parseInt(req.query.limit) : 20,
        skip: req.query.offset ? parseInt(req.query.offset) : 0,
      });

      jobs = jobs.map((job) => {
        job.itemsCount = job._count.items;

        job.progress = {};

        // Sort progress into buckets
        job.progress.completedCount =
          job.items.filter((item) => item.status === "COMPLETED").length +
          job.items.filter((item) => item.status === "WAITING_FOR_PICKUP")
            .length;
        job.progress.inProgressCount = job.items.filter(
          (item) => item.status === "IN_PROGRESS"
        ).length;
        job.progress.notStartedCount = job.items.filter(
          (item) => item.status === "NOT_STARTED"
        ).length;
        job.progress.excludedCount =
          job.items.filter((item) => item.status === "CANCELLED").length +
          job.items.filter((item) => item.status === "WONT_DO").length +
          job.items.filter((item) => item.status === "WAITING").length +
          job.items.filter((item) => item.status === "WAITING_FOR_PAYMENT")
            .length;

        job.user.name = `${job.user.firstName} ${job.user.lastName}`;

        delete job._count;
        delete job.items;
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
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];
