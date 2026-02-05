import puppeteer from "@cloudflare/puppeteer";

const VIEWPORT = { width: 512, height: 512 };
const THEME_COLOR = 0x53c3ee;
const RATE_LIMIT_STATUS = 429;

const isRateLimitError = (err) => {
  const msg = (err?.message || "").toLowerCase();
  return (
    err?.status === RATE_LIMIT_STATUS ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("too many") ||
    msg.includes("exceeded usage")
  );
};

const arrayBufferToBase64 = (ab) => {
  const bytes = new Uint8Array(ab);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const loadThreeBundle = async (page) => {
  // 1. Import map MUST come first
  await page.addScriptTag({
    type: "importmap",
    content: JSON.stringify({
      imports: {
        three:
          "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js",
      },
    }),
  });

  // 2. Load modules that depend on it
  await page.addScriptTag({
    type: "module",
    content: `
      import * as THREE from "three";
      import { STLLoader } from "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/STLLoader.js";

      window.__THREE__ = THREE;
      window.__STLLoader__ = STLLoader;
    `,
  });

  await page.waitForFunction(
    () => Boolean(window.__THREE__ && window.__STLLoader__),
    { timeout: 10_000 },
  );
};

const renderTask = async (page, task, hardDeadline) => {
  const taskId = task?.id ?? "unknown";

  if (!task?.fileUrl) return { taskId, ok: false, error: "Missing fileUrl" };
  if (Date.now() > hardDeadline)
    return { taskId, ok: false, error: "Deadline reached" };

  // Fetch STL in the Worker so we do NOT depend on browser CORS.
  let stlBase64;
  try {
    const stlRes = await fetch(task.fileUrl);
    if (!stlRes.ok) {
      return {
        taskId,
        ok: false,
        fatal: true,
        errorType: "FETCH_FAILED",
        error: `Failed to fetch STL: ${stlRes.status}`,
      };
    }
    const ab = await stlRes.arrayBuffer();
    stlBase64 = arrayBufferToBase64(ab);
  } catch (e) {
    return {
      taskId,
      ok: false,
      fatal: true,
      errorType: "FETCH_FAILED",
      error: e?.message || String(e),
    };
  }

  const logs = [];
  const onConsole = (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`);
  const onPageError = (err) =>
    logs.push(`[pageerror] ${err?.message || String(err)}`);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    await page.setViewport(VIEWPORT);
    await page.goto("about:blank", { waitUntil: "domcontentloaded" });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>`,
      {
        waitUntil: "domcontentloaded",
      },
    );

    // Load Three + STLLoader once per task to keep it deterministic (and avoid cross-task state issues).
    await loadThreeBundle(page);

    const result = await page.evaluate(
      async ({ stlBase64, width, height, color }) => {
        const decodeBase64ToUint8 = (b64) => {
          const bin = atob(b64);
          const out = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
          return out;
        };

        try {
          const THREE = window.__THREE__;
          const loader = new window.__STLLoader__();

          // Parse STL bytes (no network, no CORS).
          const bytes = decodeBase64ToUint8(stlBase64);
          const geometry = loader.parse(bytes.buffer);

          geometry.computeBoundingBox();
          geometry.center();

          const size = new THREE.Vector3();
          geometry.boundingBox.getSize(size);

          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0xf7f7f7);

          const material = new THREE.MeshPhysicalMaterial({
            color,
            metalness: 0.25,
            roughness: 0.55,
          });

          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);

          scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 1.15));

          const radius = Math.max(size.x, size.y, size.z) || 1;
          const camera = new THREE.PerspectiveCamera(
            35,
            width / height,
            0.1,
            1000,
          );
          camera.position.set(radius * 1.6, radius * 1.2, radius * 1.6);
          camera.lookAt(0, 0, 0);

          const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
          });

          // IMPORTANT: numbers, not strings
          renderer.setSize(width, height, false);
          renderer.setPixelRatio(1);

          const gl = renderer.getContext();
          if (!gl) throw new Error("WebGL context not available");

          renderer.render(scene, camera);

          const dataUrl = renderer.domElement.toDataURL("image/png");
          const pngBase64 = dataUrl.split(",")[1];

          // Cleanup to reduce memory growth across tasks
          renderer.dispose();
          material.dispose();
          geometry.dispose();

          return {
            ok: true,
            pngBase64,
            stats: { boundingBox: [size.x, size.y, size.z] },
          };
        } catch (err) {
          const msg = err?.message || String(err);
          const lower = msg.toLowerCase();
          const malformed =
            lower.includes("stl") ||
            lower.includes("triangle") ||
            lower.includes("unexpected") ||
            lower.includes("parse") ||
            lower.includes("buffer");

          return {
            ok: false,
            fatal: true,
            errorType: malformed ? "MALFORMED_STL" : "RENDER_ERROR",
            error: msg,
          };
        }
      },
      {
        stlBase64,
        width: VIEWPORT.width,
        height: VIEWPORT.height,
        color: THEME_COLOR,
      },
    );

    if (!result?.ok) {
      return {
        taskId,
        ok: false,
        fatal: result?.fatal ?? true,
        errorType: result?.errorType || "RENDER_ERROR",
        error: result?.error || "Unknown render error",
        logs,
      };
    }

    return { taskId, ok: true, ...result, logs };
  } catch (e) {
    const fatal = !isRateLimitError(e);
    const errorType = fatal ? "RENDER_ERROR" : "RATE_LIMIT";
    return {
      taskId,
      ok: false,
      fatal,
      errorType,
      error: e?.message || String(e),
      logs,
    };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
};

export default {
  async fetch(request, env) {
    if (request.method !== "POST")
      return new Response("Method not allowed", { status: 405 });

    if (env.RENDER_TOKEN) {
      const auth = request.headers.get("authorization") || "";
      const expected = `Bearer ${env.RENDER_TOKEN}`;
      if (auth !== expected)
        return new Response("Unauthorized", { status: 401 });
    }

    const { tasks = [], deadlineMs = 30_000 } = await request.json();
    const hardDeadline = Date.now() + Math.min(deadlineMs, 55_000);

    let browser;
    try {
      // Browser Rendering binding: env.BROWSER must exist in wrangler config.  [oai_citation:3‡Cloudflare Docs](https://developers.cloudflare.com/browser-rendering/reference/wrangler/)
      browser = await puppeteer.launch(env.BROWSER, {
        // optional: keep browser warm for reuse; see docs.  [oai_citation:4‡Cloudflare Docs](https://developers.cloudflare.com/browser-rendering/puppeteer/)
        // keep_alive: 600_000,
      });
    } catch (err) {
      const status = isRateLimitError(err) ? RATE_LIMIT_STATUS : 500;
      return Response.json(
        {
          error: err?.message || "Browser launch failed",
          errorType: isRateLimitError(err) ? "RATE_LIMIT" : "BROWSER_LAUNCH_FAILED",
        },
        { status },
      );
    }

    try {
      let page;
      try {
        page = await browser.newPage();
      } catch (err) {
        const status = isRateLimitError(err) ? RATE_LIMIT_STATUS : 500;
        return Response.json(
          {
            error: err?.message || "Failed to start browser page",
            errorType: isRateLimitError(err) ? "RATE_LIMIT" : "BROWSER_PAGE_FAILED",
          },
          { status },
        );
      }

      const results = [];
      for (const task of tasks) {
        if (Date.now() > hardDeadline) {
          results.push({
            taskId: task?.id || "unknown",
            ok: false,
            error: "Deadline reached",
          });
          continue;
        }
        results.push(await renderTask(page, task, hardDeadline));
      }

      return Response.json({ results });
    } finally {
      await browser.close();
    }
  },
};
