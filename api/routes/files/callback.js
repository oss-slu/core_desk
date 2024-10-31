import { LogType } from "@prisma/client";
import { prisma } from "../../util/prisma.js";
import { utapi } from "../../config/uploadthing.js";

const logging = false;

export const post = async (req, res) => {
  const { jobId, shopId, userId, scope, resourceId, materialId } =
    req.body.metadata;

  logging && console.log(req.body.metadata);

  if (scope === "job.fileupload") {
    logging && console.log("job.fileupload");
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      console.error("job not found");
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

    logging && console.log("jobItem", jobItem);
    return res.sendStatus(200);
  }

  if (scope === "shop.resource.image") {
    logging && console.log("shop.resource.image");
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        shopId,
      },
    });

    if (!resource) {
      console.error("resource not found");
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

    return res.sendStatus(200);
  }

  if (scope === "material.msds") {
    logging && console.log("material.msds");
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      console.error("material not found");
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

    return res.sendStatus(200);
  }

  if (scope === "material.tds") {
    logging && console.log("material.tds");
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      console.error("material not found");
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

    return res.sendStatus(200);
  }

  if (scope === "material.image") {
    logging && console.log("material.image");
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      console.error("material not found");
      return res.status(404).json({ error: "Not found" });
    }

    const image = await prisma.materialImage.create({
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
        materialImageId: image.id,
        resourceTypeId: material.resourceTypeId,
        type: LogType.MATERIAL_IMAGE_CREATED,
      },
    });

    return res.sendStatus(200);
  }

  if (scope === "shop.logo") {
    logging && console.log("shop.logo");
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
      },
    });

    if (!shop) {
      console.error("shop not found");
      return res.status(404).json({
        error: "Not found",
      });
    }

    if (shop.logoKey) {
      await utapi.deleteFiles([shop.logoKey]);
    }

    await prisma.shop.update({
      where: {
        id: shopId,
      },
      data: {
        logoKey: req.body.file.key,
        logoName: req.body.file.name,
        logoUrl: req.body.file.url,
      },
    });
  }

  return res.status(404).json({ error: "Not found" });
};
