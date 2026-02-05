import crypto from "crypto";
import { prisma } from "#prisma";
import { uploadFile } from "#upload";

const INSTANCE_ID = `stl-render-${process.pid}-${crypto.randomUUID()}`;
// Stay conservative to avoid Cloudflare 429s on shared accounts.
const MAX_CONCURRENT_BROWSERS = 1;
const MAX_BROWSER_STARTS_PER_MIN = 1;
const SESSION_DURATION_MS = 50_000; // keep under Cloudflare 60s cap
const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 5_000;
const RETRY_BASE_SECONDS = 15;

const activeSessions = new Map();
let launchTimestamps = [];
let pollTimer = null;
let schedulerRunning = false;

const now = () => Date.now();
const sessionDeadline = () => new Date(now() + SESSION_DURATION_MS);

const pruneLaunches = () => {
  const cutoff = now() - 60_000;
  launchTimestamps = launchTimestamps.filter((ts) => ts >= cutoff);
};

const browsersStartedLastMinute = () => {
  pruneLaunches();
  return launchTimestamps.length;
};

export const enqueueStlRenderTask = async ({
  jobItemId,
  fileUrl,
  fileName,
  fileKey,
}) => {
  if (!jobItemId || !fileUrl) {
    throw new Error("enqueueStlRenderTask requires jobItemId and fileUrl");
  }

  return prisma.stlRenderTask.create({
    data: {
      jobItemId,
      fileUrl,
      fileName: fileName || null,
      fileKey: fileKey || null,
      status: "PENDING",
      availableAt: new Date(),
    },
  });
};

const recycleExpiredLocks = async () => {
  const nowTs = new Date();
  await prisma.stlRenderTask.updateMany({
    where: {
      status: "PROCESSING",
      lockExpiresAt: { lte: nowTs },
    },
    data: {
      status: "PENDING",
      lockedBy: null,
      lockedAt: null,
      lockExpiresAt: null,
    },
  });
};

const claimBatch = async () => {
  const claimTime = new Date();
  const candidates = await prisma.$transaction(async (tx) => {
    const pending = await tx.stlRenderTask.findMany({
      where: {
        status: "PENDING",
        availableAt: { lte: claimTime },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    if (!pending.length) return [];

    const ids = pending.map((t) => t.id);

    await tx.stlRenderTask.updateMany({
      where: { id: { in: ids }, status: "PENDING" },
      data: {
        status: "PROCESSING",
        lockedBy: INSTANCE_ID,
        lockedAt: claimTime,
        lockExpiresAt: sessionDeadline(),
        attempts: { increment: 1 },
      },
    });

    return tx.stlRenderTask.findMany({
      where: {
        id: { in: ids },
        lockedBy: INSTANCE_ID,
        status: "PROCESSING",
      },
    });
  });

  return candidates;
};

const markResult = async (task, result) => {
  const baseData = {
    lockedBy: null,
    lockedAt: null,
    lockExpiresAt: null,
  };

  if (result.ok) {
    await prisma.stlRenderTask.update({
      where: { id: task.id },
      data: {
        ...baseData,
        status: "SUCCEEDED",
        lastError: null,
        completedAt: new Date(),
      },
    });
    return;
  }

  if (result.fatal) {
    await prisma.stlRenderTask.update({
      where: { id: task.id },
      data: {
        ...baseData,
        status: "FAILED",
        lastError: result.error || null,
        completedAt: new Date(),
      },
    });
    return;
  }

  const backoffSeconds = Math.min(
    RETRY_BASE_SECONDS * Math.pow(2, Math.max(0, task.attempts - 1)),
    30 * 60,
  );

  await prisma.stlRenderTask.update({
    where: { id: task.id },
    data: {
      ...baseData,
      status: "PENDING",
      lastError: result.error || null,
      availableAt: new Date(Date.now() + backoffSeconds * 1000),
    },
  });
};

const uploadThumbnail = async ({ pngBuffer, fileName }) => {
  const safeName = `${fileName || "stl"}.preview.png`;
  // uploadFile stores a File row and returns the record
  const { file, location, key } = await uploadFile({
    body: Buffer.isBuffer(pngBuffer) ? pngBuffer : Buffer.from(pngBuffer),
    originalname: safeName,
    mimetype: "image/png",
    contentType: "image/png",
  });

  return {
    id: file.id,
    key,
    name: safeName,
    url: location,
  };
};

const persistSuccess = async ({ task, pngBuffer }) => {
  const upload = await uploadThumbnail({
    pngBuffer,
    fileName: task.fileName,
  });

  console.log("Success", upload);

  await prisma.jobItem.update({
    where: { id: task.jobItemId },
    data: {
      fileThumbnail: {
        connect: {
          id: upload.id,
        },
      },
    },
  });

  console.log("S");

  await markResult(task, { ok: true });
};

const callCloudflare = async (tasks) => {
  const endpoint = process.env.CLOUDFLARE_RENDER_WORKER_URL;
  if (!endpoint) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SESSION_DURATION_MS);
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CLOUDFLARE_RENDER_WORKER_TOKEN
          ? {
              Authorization: `Bearer ${process.env.CLOUDFLARE_RENDER_WORKER_TOKEN}`,
            }
          : {}),
      },
      body: JSON.stringify({
        tasks: tasks.map((t) => ({
          id: t.id,
          fileUrl: "https://" + t.fileUrl,
          fileName: t.fileName,
        })),
        deadlineMs: SESSION_DURATION_MS,
      }),
      signal: controller.signal,
    });

    console.log(
      "Sent request to cloudflare",
      JSON.stringify({
        tasks: tasks.map((t) => ({
          id: t.id,
          fileUrl: "https://" + t.fileUrl,
          fileName: t.fileName,
        })),
        deadlineMs: SESSION_DURATION_MS,
      }),
    );

    if (resp.status === 429) {
      const err = new Error("RATE_LIMIT");
      err.rateLimited = true;
      err.status = resp.status;
      throw err;
    }

    const payload = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const err = new Error(payload?.error || `Cloudflare worker responded with ${resp.status}`);
      err.status = resp.status;
      err.rateLimited = payload?.errorType === "RATE_LIMIT";
      throw err;
    }

    if (!payload?.results) {
      throw new Error("Cloudflare worker payload missing results");
    }
    return payload.results;
  } finally {
    clearTimeout(timeout);
  }
};

const processBatch = async (tasks) => {
  let results = null;
  let rateLimited = false;

  try {
    results = await callCloudflare(tasks);
  } catch (err) {
    if (err?.rateLimited || err?.message === "RATE_LIMIT") {
      rateLimited = true;
    } else {
      console.error("Cloudflare render failed, will retry", err);
    }
  }

  if (rateLimited) {
    const delayMs = 70_000; // let the per-minute window clear
    for (const task of tasks) {
      await prisma.stlRenderTask.update({
        where: { id: task.id },
        data: {
          status: "PENDING",
          availableAt: new Date(Date.now() + delayMs),
          lockedBy: null,
          lockedAt: null,
          lockExpiresAt: null,
        },
      });
    }
    return;
  }

  if (!results) {
    // No results means we likely hit network/timeout; requeue with backoff
    for (const task of tasks) {
      await markResult(task, { ok: false, error: "No results from worker" });
    }
    return;
  }

  for (const result of results) {
    const task = tasks.find((t) => t.id === result.taskId);
    if (!task) continue;

    if (!result.ok) {
      console.error(
        "Render task failed; requeuing",
        task.id,
        result.error || "Unknown",
      );
      await markResult(task, {
        ok: false,
        fatal: Boolean(result.fatal),
        error: result.error || "Unknown",
      });
      continue;
    }

    try {
      const pngBuffer = Buffer.from(result.pngBase64, "base64");
      await persistSuccess({
        task,
        pngBuffer,
        stats: result.stats,
      });
    } catch (error) {
      await markResult(task, {
        ok: false,
        error: error?.message || "Failed to persist render",
      });
    }
  }
};

const launchSession = (tasks) => {
  const sessionId = `${INSTANCE_ID}-${crypto.randomUUID()}`;
  activeSessions.set(sessionId, true);
  launchTimestamps.push(now());
  pruneLaunches();

  processBatch(tasks)
    .catch((err) => console.error("STL render batch failed", err))
    .finally(() => {
      activeSessions.delete(sessionId);
    });
};

const runScheduler = async () => {
  if (schedulerRunning) return;
  schedulerRunning = true;
  try {
    await recycleExpiredLocks();

    while (
      activeSessions.size < MAX_CONCURRENT_BROWSERS &&
      browsersStartedLastMinute() < MAX_BROWSER_STARTS_PER_MIN
    ) {
      const batch = await claimBatch();
      if (!batch.length) break;
      launchSession(batch);
    }
  } catch (err) {
    console.error("STL render scheduler error", err);
  } finally {
    schedulerRunning = false;
  }
};

export const startStlRenderQueue = () => {
  if (
    process.env.STL_RENDER_QUEUE_DISABLED === "true" ||
    process.env.NODE_ENV === "test"
  ) {
    console.warn("STL render queue disabled via env");
    return;
  }

  if (pollTimer) return;

  pollTimer = setInterval(() => runScheduler(), POLL_INTERVAL_MS);
  pollTimer.unref?.();
  // Kick immediately so we do not wait for the first interval when jobs exist
  runScheduler();
};

export const stopStlRenderQueue = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  activeSessions.clear();
};

export const stlQueueStatus = () => ({
  activeSessions: activeSessions.size,
  recentLaunches: browsersStartedLastMinute(),
});
