import { prisma } from "#prisma";
import { LedgerItemType } from "#prisma-client";
import { verifyAuth } from "#verifyAuth";
import { generateBillingExcelWorkbook } from "../../../../util/docgen/excel.js";
import { calculateTotalCostOfJob } from "../../../../util/docgen/invoice.js";
import { RESOURCE_TYPE_COSTING_CRITERIA_INCLUDE } from "../../../../util/costingCriteria.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const { startDate, endDate } = req.query;

      const reqUserShop = await prisma.userShop.findFirst({
        where: {
          userId: req.user.id,
          shopId,
          active: true,
        },
      });

      if (!reqUserShop) {
        return res.status(404).json({ error: "Not found" });
      }

      const userIsStaff =
        req.user.admin ||
        reqUserShop.accountType === "ADMIN" ||
        reqUserShop.accountType === "OPERATOR";

      if (!userIsStaff) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (
        typeof startDate !== "string" ||
        typeof endDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
      ) {
        return res.status(400).json({
          error: "Valid start date and end date are required (YYYY-MM-DD)",
        });
      }

      const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
      const endExclusive = new Date(`${endDate}T00:00:00.000Z`);

      // Reject invalid calendar dates, not just invalid date strings.
      if (
        Number.isNaN(startDateTime.getTime()) ||
        Number.isNaN(endExclusive.getTime()) ||
        startDateTime.toISOString().slice(0, 10) !== startDate ||
        endExclusive.toISOString().slice(0, 10) !== endDate
      ) {
        return res.status(400).json({ error: "Invalid date" });
      }

      if (startDate > endDate) {
        return res.status(400).json({
          error: "Start date must be before or equal to end date",
        });
      }

      // Exclusive upper boundary includes the entire end date.
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

      const jobs = await prisma.job.findMany({
        where: {
          shopId,
          finalized: true,
          finalizedAt: {
            gte: startDateTime,
            lt: endExclusive,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          group: {
            select: {
              id: true,
              title: true,
            },
          },
          ledgerItems: {
            where: {
              type: LedgerItemType.JOB,
            },
            include: {
              billingGroup: {
                select: {
                  id: true,
                  title: true,
                },
              },
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
          additionalCosts: {
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
        },
        orderBy: {
          finalizedAt: "desc",
        },
      });

      const jobsWithCosts = jobs.map((job) => {
        const ledgerItem = Array.isArray(job.ledgerItems)
          ? job.ledgerItems[0]
          : (job.ledgerItems || job.ledgerItem);

        return {
          ...job,
          calculatedCost: ledgerItem
            ? Math.abs(Number(ledgerItem.value))
            : calculateTotalCostOfJob(job),
        };
      });

      const workbook = await generateBillingExcelWorkbook(
        jobsWithCosts,
        {
          shopId,
          startDate,
          endDate,
        },
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="billing-export-${shopId}-${startDate}-to-${endDate}.xlsx"`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("[ledger/excel] Error generating Excel export:", error);

      if (res.headersSent) {
        return res.destroy(error);
      }

      return res.status(500).json({
        error: "Failed to generate Excel export",
      });
    }
  },
];