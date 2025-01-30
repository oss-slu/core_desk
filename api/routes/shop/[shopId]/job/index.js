import { LogType } from "@prisma/client";
import { prisma } from "../../../../util/prisma.js";
import { verifyAuth } from "../../../../util/verifyAuth.js";
import { calculateTotalCostOfJob } from "../../../../util/docgen/invoice.js";

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;
      let userToCreateJobAs = userId;

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

      const {
        title,
        description,
        dueDate,
        onBehalfOf,
        onBehalfOfUserId,
        onBehalfOfUserEmail,
        onBehalfOfUserFirstName,
        onBehalfOfUserLastName,
      } = req.body;

      if (onBehalfOf) {
        if (
          userShop.accountType !== "ADMIN" &&
          userShop.accountType !== "OPERATOR"
        ) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        if (onBehalfOfUserId) {
          userToCreateJobAs = onBehalfOfUserId;
        }

        if (onBehalfOfUserEmail) {
          const user = await prisma.user.create({
            data: {
              email: onBehalfOfUserEmail,
              firstName: onBehalfOfUserFirstName,
              lastName: onBehalfOfUserLastName,
            },
          });

          const shopsToJoin = await prisma.shop.findMany({
            where: {
              autoJoin: true,
            },
          });

          for (const shop of shopsToJoin) {
            await prisma.userShop.create({
              data: {
                userId: user.id,
                shopId: shop.id,
                active: true,
              },
            });

            await prisma.logs.create({
              data: {
                userId: user.id,
                type: LogType.USER_CONNECTED_TO_SHOP,
                shopId: shop.id,
              },
            });
          }

          await prisma.logs.create({
            data: {
              userId: user.id,
              type: LogType.USER_CREATED,
            },
          });

          userToCreateJobAs = user.id;
        }
      }

      console.log(await prisma.shop.findUnique({ where: { id: shopId } }));

      const job = await prisma.job.create({
        data: {
          title,
          description,
          shop: { connect: { id: shopId } },
          user: { connect: { id: userToCreateJobAs } },
          dueDate: new Date(dueDate),
        },
      });

      await prisma.logs.create({
        data: {
          type: LogType.JOB_CREATED,
          user: { connect: { id: userId } },
          shop: { connect: { id: shopId } },
          job: { connect: { id: job.id } },
          to: JSON.stringify({
            userId: userToCreateJobAs,
            requestingUserId: userId,
            shopId,
            jobId: job.id,
          }),
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
            include: {
              material: true,
              resource: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              id: true,
            },
          },
          additionalCosts: {
            include: {
              material: true,
              resource: true,
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

        job.totalCost = calculateTotalCostOfJob(job);
        delete job.additionalCosts;

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
