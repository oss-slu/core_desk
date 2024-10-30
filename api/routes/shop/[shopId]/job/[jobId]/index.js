import { LogType } from "@prisma/client";
import { prisma } from "../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, jobId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res
          .status(400)
          .json({ error: "You are not a member of this shop" });
      }

      const shouldLoadAll =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
          userId: shouldLoadAll ? undefined : userId,
        },
        include: {
          items: {
            where: {
              active: true,
            },
            include: {
              resource: {
                select: {
                  costingPublic: true,
                  costPerProcessingTime: true,
                  costPerTime: true,
                  costPerUnit: true,
                },
              },
              material: {
                select: {
                  costPerUnit: true,
                  unitDescriptor: true,
                },
              },
            },
          },
          resource: {
            select: {
              id: true,
              title: true,
            },
          },
          additionalCosts: {
            where: {
              active: true,
            },
            include: {
              resource: {
                select: {
                  costPerProcessingTime: true,
                  costPerTime: true,
                  costPerUnit: true,
                },
              },
              material: {
                select: {
                  costPerUnit: true,
                },
              },
            },
          },
        },
      });

      // TODO: Respect costing public

      if (!job) {
        return res.status(404).json({ error: "Not found" });
      }

      return res.json({ job });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, jobId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(400).json({ error: "Forbidden" });
      }

      let job;

      const shouldLoadAll =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          userId: shouldLoadAll ? undefined : userId,
        },
      });

      if (!job) {
        return res.status(404).json({ error: "Not found" });
      }

      delete req.body.id;
      delete req.body.userId;
      delete req.body.shopId;
      delete req.body.createdAt;
      delete req.body.updatedAt;
      delete req.body.items;
      delete req.body.resource;
      // delete req.body.additionalCosts;

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
            include: {
              resource: {
                select: {
                  costingPublic: true,
                  costPerProcessingTime: true,
                  costPerTime: true,
                  costPerUnit: true,
                },
              },
              material: {
                select: {
                  costPerUnit: true,
                  unitDescriptor: true,
                },
              },
            },
          },
          resource: {
            select: {
              id: true,
              title: true,
            },
          },
          additionalCosts: {
            where: {
              active: true,
            },
            include: {
              resource: {
                select: {
                  costPerProcessingTime: true,
                  costPerTime: true,
                  costPerUnit: true,
                },
              },
              material: {
                select: {
                  costPerUnit: true,
                },
              },
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
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];
