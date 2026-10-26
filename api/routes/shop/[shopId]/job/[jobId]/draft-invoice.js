import prisma from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { generateInvoice } from "../../../../../util/docgen/invoice.js";
import { canAccessJob } from "../../../../../util/billingGroupOperator.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    console.log("draft invoice");

    const { shopId, jobId } = req.params;
    const userId = req.user.id;

    try {
      const [userShop, job] = await Promise.all([
        prisma.userShop.findFirst({
          where: {
            userId,
            shopId,
            active: true,
          },
        }),
        prisma.job.findFirst({
          where: {
            id: jobId,
            shopId,
          },
          include: {
            additionalCosts: {
              include: {
                material: true,
                secondaryMaterial: true,
                resource: true,
                resourceType: true,
              },
            },
            items: {
              include: {
                material: true,
                secondaryMaterial: true,
                resource: true,
                resourceType: true,
              },
            },
          },
        }),
      ]);

      if (
        !job ||
        !(await canAccessJob(
          userId,
          shopId,
          userShop,
          req.user.admin,
          job,
        ))
      ) {
        return res.status(404).json({ error: "Not found" });
      }

      const { url, key } = await generateInvoice(job, userId, shopId, {
        draft: true,
      });

      return res.json({ url, key });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];
