import { prisma } from "../../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId, jobItemId } = req.params;
    const userId = req.user.id;

    const item = await prisma.jobItem.findFirst({
      where: {
        id: jobItemId,
        jobId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ item });
  },
];

export const patch = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId, jobItemId } = req.params;
    const userId = req.user.id;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
        active: true,
      },
    });

    console.log(userShop.accountType, req.user.admin);

    let job;
    if (userShop.accountType === "CUSTOMER" && !req.user.admin) {
      console.log("CUSTOMER");
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
          userId,
        },
      });
    } else {
      console.log("NOT CUSTOMER", jobId, shopId);
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
        },
      });
      console.log(job);
    }

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    const updatedItem = await prisma.jobItem.update({
      where: {
        id: jobItemId,
      },
      data: req.body.data,
    });

    return res.json({ item: updatedItem });
  },
];
