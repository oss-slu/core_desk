import { LogType } from "@prisma/client";
import { prisma } from "../../../../../../util/prisma.js";
import { verifyAuth } from "../../../../../../util/verifyAuth.js";
import { utapi } from "../../../../../../config/uploadthing.js";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, jobId, jobItemId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(404).json({ error: "Not found" });
      }

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
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const patch = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId, jobItemId } = req.params;
    const userId = req.user.id;

    console.log(req.body);

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
        active: true,
      },
    });

    let job;
    if (userShop.accountType === "CUSTOMER" && !req.user.admin) {
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
          userId,
        },
      });
    } else {
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
        },
      });
    }

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    const jobItem = await prisma.jobItem.findFirst({
      where: {
        id: jobItemId,
        jobId,
        active: true,
      },
    });

    if (!jobItem) {
      return res.status(404).json({ error: "Not found" });
    }

    const updatedItem = await prisma.jobItem.update({
      where: {
        id: jobItemId,
        active: true,
      },
      data: req.body.data,
    });

    return res.json({ item: updatedItem });
  },
];

export const del = [
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

    if (!userShop) {
      return res.status(404).json({ error: "Not found" });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    const jobItem = await prisma.jobItem.update({
      where: {
        id: jobItemId,
      },
      data: {
        active: false,
      },
    });

    await utapi.deleteFiles(jobItem.fileKey);

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        jobId,
        jobItemId,
        type: LogType.JOB_ITEM_DELETED,
      },
    });

    return res.json({ success: true });
  },
];
