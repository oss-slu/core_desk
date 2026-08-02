import { LogType } from "#prisma-client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { calculateTotalCostOfJob } from "../../../../util/docgen/invoice.js";
import { RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE } from "../../../../util/costingCriteria.js";
// import client from "#postmark";

const getUserBalanceMap = async (shopId, userIds) => {
  if (!userIds.length) return {};

  const rows = await prisma.ledgerItem.groupBy({
    by: ["userId"],
    where: {
      shopId,
      userId: {
        in: userIds,
      },
    },
    _sum: {
      value: true,
    },
  });

  return Object.fromEntries(
    rows.map((row) => [row.userId, row._sum.value || 0]),
  );
};

const getGroupBalanceMap = async (shopId, groupIds) => {
  if (!groupIds.length) return {};

  const rows = await prisma.ledgerItem.groupBy({
    by: ["billingGroupId"],
    where: {
      shopId,
      billingGroupId: {
        in: groupIds,
      },
    },
    _sum: {
      value: true,
    },
  });

  return Object.fromEntries(
    rows.map((row) => [row.billingGroupId, row._sum.value || 0]),
  );
};

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
        billingGroupId,
      } = req.body;

      const fallbackDueDate = new Date();
      fallbackDueDate.setDate(fallbackDueDate.getDate() + 14);
      fallbackDueDate.setHours(0, 0, 0, 0);
      const dueDateToUse = dueDate ? new Date(dueDate) : fallbackDueDate;
      const normalizedDueDate = Number.isNaN(dueDateToUse.getTime())
        ? fallbackDueDate
        : dueDateToUse;

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

      let billingGroupToCreateJobAs = null;
      if (billingGroupId) {
        let billingGroup = await prisma.billingGroup.findFirst({
          where: {
            id: billingGroupId,
            shopId,
            active: true,
          },
        });

        if (!billingGroup) {
          return res.status(400).json({ error: "Forbidden" });
        }

        let userBillingGroup = await prisma.userBillingGroup.findFirst({
          where: {
            userId: req.user.id,
            billingGroupId: billingGroupId,
            active: true,
          },
        });

        if (!(req.user.admin || userShop.accountType === "ADMIN" || userShop.accountType === "OPERATOR") && !userBillingGroup) {
          return res.status(400).json({ error: "Forbidden" });
        }

        if (billingGroup.membersCanCreateJobs) {
          billingGroupToCreateJobAs = billingGroup;
        }

        if (req.user.admin || userShop.accountType === "ADMIN") {
          billingGroupToCreateJobAs = billingGroup;
        }

        if (userBillingGroup?.role === "ADMIN") {
          billingGroupToCreateJobAs = billingGroup;
        }
      }

      let job;
      if (billingGroupToCreateJobAs) {
        job = await prisma.job.create({
          data: {
            title,
            description,
            shop: { connect: { id: shopId } },
            user: { connect: { id: userToCreateJobAs } },
            group: { connect: { id: billingGroupToCreateJobAs?.id } },
            dueDate: normalizedDueDate,
          },
        });
      } else {
        job = await prisma.job.create({
          data: {
            title,
            description,
            shop: { connect: { id: shopId } },
            user: { connect: { id: userToCreateJobAs } },
            dueDate: normalizedDueDate,
          },
        });
      }

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

      console.log("Email Sent! - mock");

      /* - When you uncomment this don't forget to remove the comment for importing postmark!!!

      const { name: shopName } = await prisma.shop.findFirst({
        where: {
          id: shopId,
        }
      });

      const adminsOperators = await prisma.userShop.findMany({
        where: {
          shopId: shopId,
          accountType: {
            in: ['ADMIN', 'OPERATOR'],
          },
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      let emails = [];
      adminsOperators.forEach((userShop) => {
        userShop.user.email && emails.push(userShop.user.email);
      });

      if (!emails.includes(req.user.email)) {
        emails.push(req.user.email);
      }

      client.sendEmail({
        "From": `${process.env.POSTMARK_FROM_EMAIL}`,
        "To": `${emails.join(',')}`,
        "Subject": `A Job was Created on Your Shop`,
        "HtmlBody": `The job ${title} was created on the ${shopName} shop.` ,
        "TextBody": `The job ${title} was created on the ${shopName} shop.`,
        "MessageStream": "outbound"
      });

      */

      if (billingGroupToCreateJobAs) {
        await prisma.logs.create({
          data: {
            userId: req.user.id,
            type: LogType.JOB_ADDED_TO_BILLING_GROUP,
            shopId,
            jobId: job.id,
            billingGroupId: billingGroupToCreateJobAs.id,
          },
        });
      }

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
              secondaryMaterial: true,
              resource: true,
              resourceType: {
                include: RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
              },
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              id: true,
            },
          },
          group: {
            select: {
              id: true,
              title: true,
            },
          },
          additionalCosts: {
            include: {
              material: true,
              secondaryMaterial: true,
              resource: true,
              resourceType: {
                include: RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
              },
            },
          },
        },
        // take: req.query.limit ? parseInt(req.query.limit) : 2000,
        // skip: req.query.offset ? parseInt(req.query.offset) : 0,
      });

      const userIds = [
        ...new Set(
          jobs.filter((job) => !job.groupId).map((job) => job.user.id),
        ),
      ];
      const groupIds = [
        ...new Set(jobs.map((job) => job.groupId).filter(Boolean)),
      ];

      const [userBalanceMap, groupBalanceMap] = await Promise.all([
        getUserBalanceMap(shopId, userIds),
        getGroupBalanceMap(shopId, groupIds),
      ]);

      jobs = jobs.map((job) => {
        job.itemsCount = job._count.items;

        job.progress = {};

        // Sort progress into buckets
        job.progress.completedCount =
          job.items.filter((item) => item.status === "COMPLETED").length +
          job.items.filter((item) => item.status === "WAITING_FOR_PICKUP")
            .length;
        job.progress.inProgressCount = job.items.filter(
          (item) => item.status === "IN_PROGRESS",
        ).length;
        job.progress.notStartedCount = job.items.filter(
          (item) => item.status === "NOT_STARTED",
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
        job.billingAccount = job.groupId
          ? {
              type: "GROUP",
              id: job.groupId,
              name: job.group?.title || "Billing Group",
              balance: groupBalanceMap[job.groupId] || 0,
            }
          : {
              type: "USER",
              id: job.user.id,
              name: job.user.name,
              balance: userBalanceMap[job.user.id] || 0,
            };

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
