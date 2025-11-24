import { verifyAuth } from "#verifyAuth";
import { upload } from "#upload";
import { uploadFileToJob } from "../../../../../util/uploadFileToJob.js";

export const post = [
  verifyAuth,
  upload({
    allowedMimeTypes: "*",
    maxFileSize: 500 * 1024 * 1024, // 500 MB
  }),
  async (req, res) => {
    try {
      const jobItem =  await uploadFileToJob({
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
      res.json({
        message: "Upload successful",
        file: {
          name: req.file.originalname,
          location: req.file.location,
          logId: req.fileLog.id,
          jobItemId: jobItem,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
];
