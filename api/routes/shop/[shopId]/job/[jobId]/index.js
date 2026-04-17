// eslint-disable-next-line no-unused-vars
import { LedgerItemType, LogType, Prisma } from "#prisma-client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { generateInvoice } from "../../../../../util/docgen/invoice.js";
import { RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE } from "../../../../../util/costingCriteria.js";

/** @type {Prisma.JobInclude} */
const JOB_INCLUDE = {
  items: {
    where: {
      active: true,
    },
    include: {
      file: true,
      fileThumbnail: true,
      resource: {
        select: {
          costingPublic: true,
          costPerProcessingTime: true,
          costPerTime: true,
          costPerUnit: true,
          title: true,
        },
      },
      material: {
        select: {
          costPerUnit: true,
          unitDescriptor: true,
          title: true,
        },
      },
      secondaryMaterial: {
        select: {
          costPerUnit: true,
          unitDescriptor: true,
          title: true,
        },
      },
      resourceType: {
        select: {
          id: true,
          title: true,
          costingMode: true,
          ...RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
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
      secondaryMaterial: {
        select: {
          costPerUnit: true,
        },
      },
      resourceType: {
        select: {
          id: true,
          title: true,
          costingMode: true,
          ...RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE,
        },
      },
    },
  },
  ledgerItems: {
    where: {
      type: LedgerItemType.JOB,
    },
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  group: {
    select: {
      id: true,
      title: true,
      active: true,
      users: {
        where: {
          active: true,
          role: "ADMIN",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
};

/** @type {Prisma.JobInclude} */
const generateGroupInclude = (userIsPrivileged) => {
  /** @type {Prisma.JobInclude} */
  const JOB_GROUP_INCLUDE = JSON.parse(JSON.stringify(JOB_INCLUDE));
  if (!userIsPrivileged) {
    JOB_GROUP_INCLUDE.additionalCosts = undefined;
    JOB_GROUP_INCLUDE.ledgerItems = undefined;
    JOB_GROUP_INCLUDE.resource = undefined;
  }
  return JOB_GROUP_INCLUDE;
};

const getUserBillingAccount = async (shopId, userId) => {
  const [balanceResult, user] = await Promise.all([
    prisma.ledgerItem.aggregate({
      where: {
        shopId,
        userId,
      },
      _sum: {
        value: true,
      },
    }),
    prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    }),
  ]);

  return {
    type: "USER",
    id: userId,
    name: user ? `${user.firstName} ${user.lastName}` : "Customer",
    balance: balanceResult._sum.value || 0,
  };
};

const getGroupBillingAccount = async (shopId, groupId) => {
  const [balanceResult, group] = await Promise.all([
    prisma.ledgerItem.aggregate({
      where: {
        shopId,
        billingGroupId: groupId,
      },
      _sum: {
        value: true,
      },
    }),
    prisma.billingGroup.findFirst({
      where: {
        id: groupId,
      },
      select: {
        title: true,
      },
    }),
  ]);

  return {
    type: "GROUP",
    id: groupId,
    name: group?.title || "Billing Group",
    balance: balanceResult._sum.value || 0,
  };
};

const attachBillingAccount = async (job, shopId) => {
  if (!job) return job;

  const billingAccount = job.groupId
    ? await getGroupBillingAccount(shopId, job.groupId)
    : await getUserBillingAccount(shopId, job.userId);

  return {
    ...job,
    billingAccount,
  };
};

const ALLOWED_JOB_UPDATE_FIELDS = [
  "title",
  "description",
  "imageUrl",
  "userId",
  "materialId",
  "materialQty",
  "resourceTypeId",
  "resourceId",
  "groupId",
  "dueDate",
  "finalized",
  "finalizedAt",
  "additionalCostOverride",
  "status",
  "secondaryMaterialId",
  "secondaryMaterialQty",
];

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

      const initialJob = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
        },
      });

      let job;
      if (initialJob?.groupId && !shouldLoadAll) {
        const INCLUDE = generateGroupInclude(shouldLoadAll);

        // The job is part of a group, so we need to handle different users accessing it.

        // Make sure the user is in the group
        const userGroup = await prisma.userBillingGroup.findFirst({
          where: {
            userId,
            billingGroupId: initialJob.groupId,
            active: true,
          },
        });

        if (!userGroup) {
          return res
            .status(400)
            .json({ error: "You are not a member of this group" });
        }

        job = await prisma.job.findFirst({
          where: {
            id: jobId,
            shopId,
          },
          include: INCLUDE,
        });
      } else {
        job = await prisma.job.findFirst({
          where: {
            id: jobId,
            shopId,
            userId: shouldLoadAll ? undefined : userId,
          },
          include: JOB_INCLUDE,
        });
      }

      // TODO: Respect costing public

      if (!job) {
        return res.status(404).json({ error: "Not found" });
      }

      const jobWithBillingAccount = await attachBillingAccount(job, shopId);

      return res.json({ job: jobWithBillingAccount });
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
        include: {
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
          items: {
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
      });

      if (!job) {
        return res.status(404).json({ error: "Not found" });
      }

      const jobUpdateData = Object.fromEntries(
        Object.entries(req.body).filter(([key]) =>
          ALLOWED_JOB_UPDATE_FIELDS.includes(key)
        )
      );

      if (jobUpdateData.userId === job.userId) {
        delete jobUpdateData.userId;
      }

      const requesterIsBeingUpdated = Object.prototype.hasOwnProperty.call(
        jobUpdateData,
        "userId"
      );
      if (requesterIsBeingUpdated) {
        if (!shouldLoadAll) {
          return res.status(403).json({ error: "Forbidden" });
        }

        if (
          !jobUpdateData.userId ||
          typeof jobUpdateData.userId !== "string"
        ) {
          return res.status(400).json({ error: "Invalid requester" });
        }

        const requesterOnShop = await prisma.userShop.findFirst({
          where: {
            userId: jobUpdateData.userId,
            shopId,
            active: true,
          },
        });

        if (!requesterOnShop) {
          return res.status(400).json({ error: "Requester is not in this shop" });
        }
      }

      if (jobUpdateData.groupId === job.groupId) {
        delete jobUpdateData.groupId;
      }

      const groupIsBeingUpdated = Object.prototype.hasOwnProperty.call(
        jobUpdateData,
        "groupId"
      );
      if (groupIsBeingUpdated) {
        if (
          jobUpdateData.groupId !== null &&
          typeof jobUpdateData.groupId !== "string"
        ) {
          return res.status(400).json({ error: "Invalid billing group" });
        }

        if (jobUpdateData.groupId !== null) {
          const billingGroup = await prisma.billingGroup.findFirst({
            where: {
              id: jobUpdateData.groupId,
              shopId,
              active: true,
            },
          });

          if (!billingGroup) {
            return res.status(400).json({ error: "Billing group not found" });
          }

          if (!shouldLoadAll) {
            const userBillingGroup = await prisma.userBillingGroup.findFirst({
              where: {
                userId: req.user.id,
                billingGroupId: billingGroup.id,
                active: true,
              },
            });

            const canAssignToGroup =
              !!userBillingGroup &&
              (billingGroup.membersCanCreateJobs ||
                userBillingGroup.role === "ADMIN");

            if (!canAssignToGroup) {
              return res.status(403).json({ error: "Forbidden" });
            }
          }
        }
      }

      let updatedJob;
      if (jobUpdateData.finalized && !job.finalized) {
        if (
          !(
            userShop.accountType === "ADMIN" ||
            userShop.accountType === "OPERATOR" ||
            req.user.admin
          )
        ) {
          return res.status(400).json({ error: "Forbidden" });
        }

        console.log("Generating Invoice");
        const { url, key, value, log, costingCriteriaSnapshot } =
          await generateInvoice(job, userId, shopId);
        console.log("Generated Invoice", url);
        await prisma.job.update({
          where: {
            id: jobId,
          },
          data: {
            finalized: true,
            finalizedAt: new Date(),
          },
        });

        const ledgerItem = await prisma.ledgerItem.create({
          data: {
            shopId,
            jobId,
            userId: job.groupId ? null : job.userId,
            billingGroupId: job.groupId || null,
            invoiceUrl: url,
            invoiceKey: key,
            costingCriteriaSnapshot,
            value: value * -1,
            type: LedgerItemType.JOB,
          },
        });

        if (log?.id) {
          await prisma.logs.update({
            where: {
              id: log.id,
            },
            data: {
              ledgerItemId: ledgerItem.id,
            },
          });
        }

        await prisma.logs.createMany({
          data: [
            {
              userId: req.user.id,
              shopId,
              jobId,
              type: LogType.JOB_FINALIZED,
              ledgerItemId: ledgerItem.id,
            },
            {
              userId: req.user.id,
              shopId,
              jobId,
              type: LogType.LEDGER_ITEM_CREATED,
              ledgerItemId: ledgerItem.id,
            },
          ],
        });

        updatedJob = await prisma.job.findFirst({
          where: {
            id: jobId,
            shopId,
          },
          include: JOB_INCLUDE,
        });
      } else {
        updatedJob = await prisma.job.update({
          where: {
            id: jobId,
          },
          data: jobUpdateData,
          include: JOB_INCLUDE,
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
      }

      const updatedJobWithBillingAccount = await attachBillingAccount(
        updatedJob,
        shopId
      );

      return res.json({ job: updatedJobWithBillingAccount });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];
