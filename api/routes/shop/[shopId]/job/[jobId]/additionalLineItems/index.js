import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";

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

      console.log(userId, shopId, userShop);

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
      });

      if (!job) {
        return res.status(400).json({ error: "Job not found" });
      }

      const lineItems = await prisma.additionalCostLineItem.findMany({
        where: {
          jobId: job.id,
          active: true,
        },
      });

      return res.json({ lineItems });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];

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
      });

      if (!job) {
        return res.status(400).json({ error: "Job not found" });
      }

      const lineItem = await prisma.additionalCostLineItem.create({
        data: {
          ...req.body,
          jobId: job.id,
        },
      });

      const lineItems = await prisma.additionalCostLineItem.findMany({
        where: {
          jobId: job.id,
          active: true,
        },
      });

      return res.json({ lineItems, newLineItem: lineItem });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];
