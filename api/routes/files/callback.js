import { LogType } from "@prisma/client";
import { prisma } from "../../util/prisma.js";

export const post = async (req, res) => {
  console.log("[UPTNG] upload completed", req.body);
  const { jobId, shopId, userId, scope, resourceId } = req.body.metadata;

  if (scope === "job.fileupload") {
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
        userId,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    const jobItem = await prisma.jobItem.create({
      data: {
        jobId: job.id,

        fileKey: req.body.file.key,
        fileName: req.body.file.name,
        fileType: req.body.file.name.split(".").pop(),
        fileUrl: req.body.file.url,

        title: req.body.file.name,
      },
    });

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        jobId,
        jobItemId: jobItem.id,
        type: LogType.JOB_ITEM_CREATED,
      },
    });

    return res.json({ jobItem });
  }

  if (scope === "shop.resource.image") {
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        shopId,
      },
    });

    if (!resource) {
      console.log("No Resource");
      return res.status(404).json({ error: "Not found" });
    }

    const image = await prisma.resourceImage.create({
      data: {
        resourceId: resource.id,
        fileKey: req.body.file.key,
        fileName: req.body.file.name,
        fileType: req.body.file.name.split(".").pop(),
        fileUrl: req.body.file.url,
      },
    });

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        resourceId,
        resourceImageId: image.id,
        type: LogType.RESOURCE_IMAGE_CREATED,
      },
    });

    return res.json({ image });
  }

  return res.status(404).json({ error: "Not found" });
};
