import { prisma } from "#prisma";
import { LedgerItemType } from "#prisma-client";
import { verifyAuth } from "#verifyAuth";
import { generateInvoice } from "../../../../../util/docgen/invoice.js";

export const post = [
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
        return res.status(403).json({ error: "Forbidden" });
      }

      const shouldLoadAll =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
        },
      });

      if (!job) {
        return res.status(404).json({ error: "Not found" });
      }

      if (!shouldLoadAll) {
        if (job.groupId) {
          const userBillingGroup = await prisma.userBillingGroup.findFirst({
            where: {
              userId,
              billingGroupId: job.groupId,
              active: true,
            },
          });

          if (!userBillingGroup) {
            return res.status(403).json({ error: "Forbidden" });
          }
        } else if (job.userId !== userId) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      if (!job.finalized) {
        return res
          .status(400)
          .json({ error: "Job must be finalized before regenerating invoice" });
      }

      const ledgerItem = await prisma.ledgerItem.findFirst({
        where: {
          jobId,
          type: LedgerItemType.JOB,
        },
        select: {
          id: true,
          costingCriteriaSnapshot: true,
        },
      });

      if (!ledgerItem) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const { url, key, log, costingCriteriaSnapshot } = await generateInvoice(
        job,
        userId,
        shopId,
        {
          costingCriteriaSnapshot: ledgerItem.costingCriteriaSnapshot,
        }
      );

      const updatedLedgerItem = await prisma.ledgerItem.update({
        where: {
          id: ledgerItem.id,
        },
        data: {
          invoiceUrl: url,
          invoiceKey: key,
          costingCriteriaSnapshot:
            ledgerItem.costingCriteriaSnapshot || costingCriteriaSnapshot,
        },
      });

      if (log?.id) {
        await prisma.logs.update({
          where: {
            id: log.id,
          },
          data: {
            ledgerItemId: updatedLedgerItem.id,
          },
        });
      }

      return res.json({ url, key });
    } catch {
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];
