import { LogType } from "@prisma/client";
import { prisma } from "../../util/prisma.js";

export const post = async (req, res) => {
  const { jobId, shopId, userId, scope, resourceId, materialId } =
    req.body.metadata;

  console.log(`[UPTNG] ${scope} upload completed`, req.body);

  if (scope === "job.fileupload") {
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      console.log("No Job");
      console.log(jobId, shopId, userId);
      return res.status(404).json({ error: "Not found" });
    }

    console.log(
      `Job ${job.id} (${job.title}) uploaded file ${req.body.file.name}`
    );

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

  if (scope === "material.msds") {
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        msdsFileKey: req.body.file.key,
        msdsFileName: req.body.file.name,
        msdsFileType: req.body.file.name.split(".").pop(),
        msdsFileUrl: req.body.file.url,
      },
    });

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        materialId,
        resourceTypeId: material.resourceTypeId,
        type: LogType.MATERIAL_MSDS_UPLOADED,
      },
    });

    return res.json({ material });
  }

  if (scope === "material.tds") {
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        tdsFileKey: req.body.file.key,
        tdsFileName: req.body.file.name,
        tdsFileType: req.body.file.name.split(".").pop(),
        tdsFileUrl: req.body.file.url,
      },
    });

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        materialId,
        resourceTypeId: material.resourceTypeId,
        type: LogType.MATERIAL_TDS_UPLOADED,
      },
    });

    return res.json({ material });
  }

  if (scope === "material.image") {
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.materialImage.create({
      data: {
        materialId: material.id,
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
        materialId,
        resourceTypeId: material.resourceTypeId,
        type: LogType.MATERIAL_IMAGE_CREATED,
      },
    });

    return res.json({ material });
  }

  return res.status(404).json({ error: "Not found" });
};
