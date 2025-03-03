import prisma from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { generateInvoice } from "../../../../../util/docgen/invoice.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    console.log("draft invoice");

    const { shopId, jobId } = req.params;
    const userId = req.user.id;

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
      },
      include: {
        additionalCosts: {
          include: {
            material: true,
            secondaryMaterial: true,
            resource: true,
          },
        },
        items: {
          include: {
            material: true,
            secondaryMaterial: true,
            resource: true,
          },
        },
      },
    });

    const { url, key } = await generateInvoice(job, userId, shopId);

    return res.json({ url, key });
  },
];
