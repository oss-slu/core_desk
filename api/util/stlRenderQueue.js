import crypto from "crypto";
import NodeStl from "node-stl";
import { prisma } from "#prisma";
import { renderStl } from "./renderStl.js";
import { UTApi } from "uploadthing/server";

const INSTANCE_ID = `stl-render-${process.pid}-${crypto.randomUUID()}`;
const MAX_CONCURRENT_BROWSERS = 3;
const MAX_BROWSER_STARTS_PER_MIN = 3;
const SESSION_DURATION_MS = 30_000; // keep under Cloudflare 60s cap
const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 5_000;
const MAX_ATTEMPTS = 4;
const RETRY_BASE_SECONDS = 15;

// Create a dedicated UTApi instance here to avoid circular imports
const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

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
    lastError: result.error || null,
  };

  if (result.ok) {
    await prisma.stlRenderTask.update({
      where: { id: task.id },
      data: {
        ...baseData,
        status: "SUCCEEDED",
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
      status: task.attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
      availableAt:
        task.attempts >= MAX_ATTEMPTS
          ? new Date()
          : new Date(Date.now() + backoffSeconds * 1000),
    },
  });
};

const uploadThumbnail = async ({ pngBuffer, fileName }) => {
  const safeName = `${fileName || "stl"}.preview.png`;
  const upload = await utapi.uploadFiles([
    new File([pngBuffer], safeName, { type: "image/png" }),
  ]);
  const first = upload?.[0]?.data;
  if (!first) throw new Error("UploadThing did not return file data");
  return first;
};

const persistSuccess = async ({ task, pngBuffer, stats }) => {
  const upload = await uploadThumbnail({
    pngBuffer,
    fileName: task.fileName,
  });

  const statPayload = stats
    ? {
        stlVolume: stats.volume ?? null,
        stlIsWatertight: stats.isWatertight ?? null,
        stlBoundingBoxX: stats.boundingBox?.[0]
          ? stats.boundingBox[0] / 10
          : null,
        stlBoundingBoxY: stats.boundingBox?.[1]
          ? stats.boundingBox[1] / 10
          : null,
        stlBoundingBoxZ: stats.boundingBox?.[2]
          ? stats.boundingBox[2] / 10
          : null,
      }
    : {};

  await prisma.jobItem.update({
    where: { id: task.jobItemId },
    data: {
      fileThumbnailKey: upload.key,
      fileThumbnailName: upload.name,
      fileThumbnailUrl: upload.url,
      ...statPayload,
    },
  });

  await markResult(task, { ok: true });
};

const renderLocally = async (task, startedAt) => {
  try {
    const elapsed = now() - startedAt;
    if (elapsed > SESSION_DURATION_MS) {
      return { taskId: task.id, ok: false, error: "Session deadline reached" };
    }

    const [pngData, stlData] = await renderStl(task.fileUrl);
    const stlStats = new NodeStl(Buffer.from(stlData));
    return {
      taskId: task.id,
      ok: true,
      pngBase64: Buffer.from(pngData).toString("base64"),
      stats: {
        volume: stlStats.volume,
        isWatertight: stlStats.isWatertight,
        boundingBox: stlStats.boundingBox,
      },
    };
  } catch (error) {
    return {
      taskId: task.id,
      ok: false,
      error: error?.message || String(error),
    };
  }
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
          fileUrl: t.fileUrl,
          fileName: t.fileName,
        })),
        deadlineMs: SESSION_DURATION_MS,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      let body;
      try {
        const text = await resp.text();
        body = text || "<empty body>";
      } catch {
        body = "<failed to read body>";
      }

      throw new Error(
        `Cloudflare worker responded with ${resp.status} ${resp.statusText}\n${body}`,
      );
    }

    const payload = await resp.json();
    if (!payload?.results) {
      throw new Error("Cloudflare worker payload missing results");
    }
    return payload.results;
  } finally {
    clearTimeout(timeout);
  }
};

const processBatch = async (tasks) => {
  const started = now();
  let results = null;

  try {
    results = await callCloudflare(tasks);
  } catch (err) {
    console.warn("Cloudflare render failed, will fall back locally", err);
  }

  if (!results) {
    results = [];
    for (const task of tasks) {
      results.push(await renderLocally(task, started));
    }
  }

  for (const result of results) {
    const task = tasks.find((t) => t.id === result.taskId);
    if (!task) continue;

    if (!result.ok) {
      await markResult(task, { ok: false, error: result.error || "Unknown" });
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
