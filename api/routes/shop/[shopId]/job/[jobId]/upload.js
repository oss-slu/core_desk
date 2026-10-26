import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { upload } from "#upload";
import { uploadFileToJob } from "../../../../../util/uploadFileToJob.js";
import { canAccessJob } from "../../../../../util/billingGroupOperator.js";

export const post = [
  verifyAuth,
  async (req, res, next) => {
    try {
      const { shopId, jobId } = req.params;
      const userId = req.user.id;
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
        return res.status(403).json({ error: "Forbidden" });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
  upload({
    allowedMimeTypes: "*",
    maxFileSize: 500 * 1024 * 1024, // 500 MB
  }),
  async (req, res) => {
    try {
      if (!req.file) {
        const title = (req.body?.title || req.body?.itemTitle || "").trim();
        if (!title) {
          return res.status(400).json({ error: "Title is required" });
        }

        await uploadFileToJob({
          jobId: req.params.jobId,
          shopId: req.params.shopId,
          userId: req.user.id,
          file: {
            originalname: title,
            location: null,
            logId: null,
          },
          logging: true,
        });
        return res.sendStatus(200);
      }

      await uploadFileToJob({
        jobId: req.params.jobId,
        shopId: req.params.shopId,
        userId: req.user.id,
        file: {
          originalname: req.file.originalname,
          location: req.file.location,
          logId: req.fileLog.id,
        },
        logging: true,
      });
      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
];
