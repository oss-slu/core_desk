import { prisma } from "#prisma";
import { uploadFile } from "#upload";
import { renderStl } from "./renderStl.js";
import NodeStl from "node-stl";
import { LogType } from "@prisma/client"; // adjust import path

export const uploadFileToJob = async ({
  jobId,
  shopId,
  userId,
  file, // { originalname, location, logId }
  groupId = undefined,
  logging = false,
}) => {
  const job = await prisma.job.findFirst({
    where: { id: jobId, shopId },
  });

  if (!job) {
    if (logging) console.error("Job not found");
    throw new Error("Job not found");
  }

  const jobItem = await prisma.jobItem.create({
    data: {
      jobId: job.id,
      fileId: file.logId,
      title: file.originalname || "No Name",
    },
  });

  const fileType = file.originalname?.split(".")?.pop()?.toLowerCase();
  if (fileType === "stl") {
    logging && console.log("Considering STL render...");
    // Determine file size from File log
    const fileRecord = await prisma.file.findUnique({
      where: { id: file.logId },
    });
    const MAX_STL_PREVIEW_BYTES = 20 * 1024 * 1024; // 20 MB

    if (fileRecord?.size && fileRecord.size > MAX_STL_PREVIEW_BYTES) {
      logging &&
        console.log("Skipping STL render: file too large", fileRecord.size);
    } else {
      logging && console.log("Rendering STL...");
      try {
        const [pngData, stlData] = await renderStl(file.location);

        const upload = await uploadFile({
          body: Buffer.isBuffer(pngData) ? pngData : Buffer.from(pngData),
          originalname: `${file.originalname}.preview.png`,
          mimetype: "image/png",
          contentType: "application/octet-stream",
        });

        const stlStats = new NodeStl(Buffer.from(stlData));

        await prisma.jobItem.update({
          where: { id: jobItem.id },
          data: {
            fileThumbnailId: upload.file.id,
            stlVolume: stlStats.volume,
            stlIsWatertight: stlStats.isWatertight,
            stlBoundingBoxX: stlStats.boundingBox[0] / 10,
            stlBoundingBoxY: stlStats.boundingBox[1] / 10,
            stlBoundingBoxZ: stlStats.boundingBox[2] / 10,
          },
        });
      } catch (e) {
        console.warn(
          `STL rendering failed for jobItem ${jobItem.id}: ${e?.message || e}`
        );
        // Continue without thumbnail or STL stats
      }
    }
  }

  await prisma.logs.create({
    data: {
      userId,
      shopId,
      jobId,
      jobItemId: jobItem.id,
      type: LogType.JOB_ITEM_CREATED,
      billingGroupId: groupId,
    },
  });

  logging && console.log("JobItem created", jobItem);
  return jobItem;
};
