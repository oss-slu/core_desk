import { prisma } from "#prisma";
import { enqueueStlRenderTask } from "./stlRenderQueue.js";
import { LogType } from "#prisma-client"; // adjust import path

export const uploadFileToJob = async ({
  jobId,
  shopId,
  userId,
  file = null, // { originalname, location, logId }
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
      jobId: job?.id,
      fileId: file?.logId || null,
      title: file?.originalname || "No Name",
    },
  });

  const fileType = file?.originalname?.split(".")?.pop()?.toLowerCase();
  if (fileType === "stl" && file.logId && file?.location) {
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
      logging && console.log("Queueing STL render...");
      await enqueueStlRenderTask({
        jobItemId: jobItem.id,
        fileUrl: file.location,
        fileName: file.originalname,
        fileKey: file.logId,
      });
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
