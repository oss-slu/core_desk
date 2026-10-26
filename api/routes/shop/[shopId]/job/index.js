import { LedgerItemType, LogType } from "#prisma-client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { calculateTotalCostOfJob } from "../../../../util/docgen/invoice.js";
import { RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE } from "../../../../util/costingCriteria.js";
import client from "#postmark";
import {
  getBillingGroupOperatorGroupIds,
  isShopOperator,
} from "../../../../util/billingGroupOperator.js";

const escapeHtml = (text) => {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

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
          const trimmedEmail = onBehalfOfUserEmail.trim();

          // Check whether the user already exists in CoreDesk before attempting to create a new account
          let user = await prisma.user.findFirst({
            where: {
              email: {
                equals: trimmedEmail,
                mode: "insensitive",
              },
            },
          });

          if (user) {
            // Retrieve existing account instead of creating a duplicate
            const existingUserShop = await prisma.userShop.findFirst({
              where: {
                userId: user.id,
                shopId,
              },
            });

            if (existingUserShop && existingUserShop.active) {
              // Existing user is already active in this shop
              userToCreateJobAs = user.id;
            } else {
              // If possible, add the existing user to the selected shop
              const isShopAdmin = userShop.accountType === "ADMIN";
              const isGlobalAdmin = !!req.user.admin;
              const canAddUserToShop =
                (isGlobalAdmin || isShopAdmin) &&
                !user.suspended &&
                (!existingUserShop || !existingUserShop.blacklisted);

              if (canAddUserToShop) {
                if (existingUserShop) {
                  await prisma.userShop.update({
                    where: { id: existingUserShop.id },
                    data: { active: true },
                  });
                } else {
                  await prisma.userShop.create({
                    data: {
                      userId: user.id,
                      shopId,
                      active: true,
                      accountType: "CUSTOMER",
                    },
                  });

                  const currentShop = await prisma.shop.findUnique({
                    where: { id: shopId },
                  });

                  if (currentShop?.startingDeposit) {
                    const ledgerItem = await prisma.ledgerItem.create({
                      data: {
                        userId: user.id,
                        shopId,
                        value: currentShop.startingDeposit,
                        type: LedgerItemType.INITIAL,
                      },
                    });

                    await prisma.logs.create({
                      data: {
                        userId: user.id,
                        shopId,
                        ledgerItemId: ledgerItem.id,
                        type: LogType.LEDGER_ITEM_CREATED,
                      },
                    });
                  }
                }

                await prisma.logs.create({
                  data: {
                    userId: user.id,
                    shopId,
                    type: LogType.USER_CONNECTED_TO_SHOP,
                  },
                });

                userToCreateJobAs = user.id;
              } else {
                // If the existing user cannot be added to the shop automatically, return clear error
                return res.status(409).json({
                  error: "User already exists",
                  message:
                    "This user already exists in CoreDesk. Global Admins can visit the general Users page to add the existing user to the shop.",
                });
              }
            }
          } else {
            // User does not exist, create a new account
            const newUser = await prisma.user.create({
              data: {
                email: trimmedEmail,
                firstName: onBehalfOfUserFirstName,
                lastName: onBehalfOfUserLastName,
              },
            });

            const shopsToJoin = await prisma.shop.findMany({
              where: {
                OR: [{ autoJoin: true }, { id: shopId }],
              },
            });

            for (const shop of shopsToJoin) {
              await prisma.userShop.create({
                data: {
                  userId: newUser.id,
                  shopId: shop.id,
                  active: true,
                },
              });

              if (shop.startingDeposit) {
                const ledgerItem = await prisma.ledgerItem.create({
                  data: {
                    userId: newUser.id,
                    shopId: shop.id,
                    value: shop.startingDeposit,
                    type: LedgerItemType.INITIAL,
                  },
                });

                await prisma.logs.create({
                  data: {
                    userId: newUser.id,
                    shopId: shop.id,
                    ledgerItemId: ledgerItem.id,
                    type: LogType.LEDGER_ITEM_CREATED,
                  },
                });
              }

              await prisma.logs.create({
                data: {
                  userId: newUser.id,
                  type: LogType.USER_CONNECTED_TO_SHOP,
                  shopId: shop.id,
                },
              });
            }

            await prisma.logs.create({
              data: {
                userId: newUser.id,
                type: LogType.USER_CREATED,
              },
            });

            userToCreateJobAs = newUser.id;
          }
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

      // Send email notification (fire-and-forget — errors must not fail the request)
      (async () => {
        try {
          const { name: shopName } = await prisma.shop.findFirst({
            where: { id: shopId },
          });

          const adminsOperators = await prisma.userShop.findMany({
            where: {
              shopId: shopId,
              accountType: { in: ["ADMIN", "OPERATOR"] },
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  notificationSettings: {
                    select: { emailJobCreated: true },
                  },
                },
              },
            },
          });

          // Collect emails for users who have opted in (default: opted in)
          const emails = [];
          for (const us of adminsOperators) {
            const optsIn =
              us.user.notificationSettings?.emailJobCreated ?? true;
            if (optsIn && us.user.email) {
              emails.push(us.user.email);
            }
          }

          // Include the requesting user if opted in and not already present
          const requesterSettings =
            await prisma.userNotificationSettings.findUnique({
              where: { userId: req.user.id },
              select: { emailJobCreated: true },
            });
          const requesterOptsIn =
            requesterSettings?.emailJobCreated ?? true;
          if (requesterOptsIn && !emails.includes(req.user.email)) {
            emails.push(req.user.email);
          }
          const safeTitle = escapeHtml(title);
          const safeShopName = escapeHtml(shopName);

          if (emails.length > 0) {
            await client.sendEmail({
              From: `${process.env.POSTMARK_FROM_EMAIL}`,
              To: emails.join(","),
              Subject: `A Job was Created on Your Shop`,
              HtmlBody: `The job <strong>${safeTitle}</strong> was created on the <strong>${safeShopName}</strong> shop.`,
              TextBody: `The job ${safeTitle} was created on the ${safeShopName} shop.`,
              MessageStream: "outbound",
            });
          }
        } catch (emailErr) {
          console.error("[job/post] Email notification failed:", emailErr);
        }
      })();


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

      const shouldLoadAll = isShopOperator(userShop, req.user.admin);
      const operatorGroupIds = shouldLoadAll
        ? []
        : await getBillingGroupOperatorGroupIds(userId, shopId);
      const jobWhere = {
        shopId,
        ...(shouldLoadAll
          ? {}
          : {
              OR: [
                { userId },
                { groupId: { in: operatorGroupIds } },
              ],
            }),
      };

      let jobs = await prisma.job.findMany({
        where: jobWhere,
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
        job.operatorAccess =
          shouldLoadAll || operatorGroupIds.includes(job.groupId);
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
        where: jobWhere,
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
