import fs from "fs";
import path from "path";
// eslint-disable-next-line no-unused-vars
import express from "express";
import { recordSpanError, tracer } from "./telemetry.js";

/**
 * Checks if a given file path corresponds to a test file.
 * @param {string} filePath - The file path to check.
 * @returns {boolean} - Returns true if it's a test file; otherwise, false.
 */
function isTestFile(filePath) {
  const basename = path.basename(filePath);
  if (basename.endsWith(".test.js") || basename.endsWith(".spec.js")) {
    return true;
  }
  const segments = filePath.split(path.sep);
  if (
    segments.includes("tests") ||
    segments.includes("__tests__") ||
    segments.includes("__snapshots__")
  ) {
    return true;
  }
  return false;
}

/**
 * Converts a file path into an Express route path.
 * @param {string} filePath - The absolute path to the route file.
 * @param {string} routesDir - The absolute path to the routes directory.
 * @returns {string} - The computed Express route path.
 */
function getRoutePathFromFile(filePath, routesDir) {
  let relativePath = path.relative(routesDir, filePath);
  relativePath = relativePath.replace(/\\/g, "/"); // For Windows compatibility

  // Remove file extension
  relativePath = relativePath.replace(/\.js$/, "");

  // Replace [paramName] with :paramName
  relativePath = relativePath.replace(/\[([^\]]+)\]/g, ":$1");

  // Remove 'index' from the path
  if (path.basename(filePath) === "index.js") {
    const dir = path.dirname(relativePath);
    if (dir === ".") {
      relativePath = "";
    } else {
      relativePath = dir;
    }
  }

  // Ensure leading slash
  if (!relativePath.startsWith("/")) {
    relativePath = "/" + relativePath;
  }

  // Prepend '/api' to the route path
  relativePath = "/api" + relativePath;

  return relativePath;
}

/**
 * Compares two route paths so that static segments take precedence
 * over parameter segments (:param) and wildcards (*).
 * @param {string} a - First route path.
 * @param {string} b - Second route path.
 * @returns {number} - Sort order.
 */
function compareRoutePaths(a, b) {
  const aSegs = a.split("/").filter(Boolean);
  const bSegs = b.split("/").filter(Boolean);
  const minLen = Math.min(aSegs.length, bSegs.length);

  for (let i = 0; i < minLen; i++) {
    const aSeg = aSegs[i];
    const bSeg = bSegs[i];

    if (aSeg === bSeg) {
      continue;
    }

    const aIsParam = aSeg.startsWith(":");
    const bIsParam = bSeg.startsWith(":");
    const aIsWild = aSeg.includes("*");
    const bIsWild = bSeg.includes("*");

    // Static segments come before dynamic params or wildcards
    if (!aIsParam && !aIsWild && (bIsParam || bIsWild)) {
      return -1;
    }
    if (!bIsParam && !bIsWild && (aIsParam || aIsWild)) {
      return 1;
    }

    // Param segments come before wildcards
    if (aIsParam && bIsWild) {
      return -1;
    }
    if (bIsParam && aIsWild) {
      return 1;
    }

    return aSeg.localeCompare(bSeg);
  }

  return bSegs.length - aSegs.length;
}

/**
 * Recursively traverses the routes directory and registers routes with Express.
 * @param {express.Application} app - The Express application instance.
 * @param {string} routesDir - The absolute path to the routes directory.
 */
async function registerRoutes(app, routesDir) {
  function wrapHandler({ handler, method, routePath, filePath, index }) {
    if (typeof handler !== "function") {
      return handler;
    }

    const handlerName = handler.name || `handler_${index}`;

    return function tracedRouteHandler(req, res, next) {
      return tracer.startActiveSpan(
        `express.${method.toLowerCase()} ${routePath}`,
        {
          attributes: {
            "http.request.method": method.toUpperCase(),
            "http.route": routePath,
            "code.function": handlerName,
            "coredesk.route.file": path.relative(process.cwd(), filePath),
            "coredesk.route.handler_index": index,
          },
        },
        async (span) => {
          let spanEnded = false;

          const finishSpan = (error) => {
            if (spanEnded) {
              return;
            }

            spanEnded = true;
            span.setAttribute("http.response.status_code", res.statusCode);

            if (req.user?.id) {
              span.setAttribute("enduser.id", req.user.id);
            }

            if (req.params?.shopId) {
              span.setAttribute("coredesk.shop.id", req.params.shopId);
            }

            if (error) {
              recordSpanError(span, error);
            }

            span.end();
          };

          const tracedNext = (error) => {
            finishSpan(error);
            return next(error);
          };

          try {
            const result = handler(req, res, tracedNext);

            if (result && typeof result.then === "function") {
              return result.then(
                (value) => {
                  if (handler.length < 3) {
                    finishSpan();
                  }
                  return value;
                },
                (error) => {
                  finishSpan(error);
                  throw error;
                },
              );
            }

            if (handler.length < 3) {
              finishSpan();
            }

            return result;
          } catch (error) {
            finishSpan(error);
            throw error;
          }
        },
      );
    };
  }

  const routeEntries = [];

  function collectRouteFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (isTestFile(filePath)) {
        continue; // Ignore test files
      }
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        collectRouteFiles(filePath); // Recursively traverse subdirectories
      } else if (stat.isFile() && file.endsWith(".js")) {
        routeEntries.push({
          filePath,
          routePath: getRoutePathFromFile(filePath, routesDir),
        });
      }
    }
  }

  collectRouteFiles(routesDir);
  routeEntries.sort((a, b) => compareRoutePaths(a.routePath, b.routePath));

  for (const { filePath, routePath } of routeEntries) {
    // Process route file
    const routeModule = await import("file://" + filePath);

    // Supported HTTP methods
    ["get", "post", "put", "patch", "head", "options"].forEach((method) => {
      if (routeModule[method]) {
        // If it's an array, use it as middleware chain
        const handlers = Array.isArray(routeModule[method])
          ? routeModule[method]
          : [routeModule[method]];
        app[method](
          routePath,
          ...handlers.map((handler, index) =>
            wrapHandler({
              handler,
              method,
              routePath,
              filePath,
              index,
            }),
          ),
        );
      }
    });

    // Handle `del` for DELETE method
    if (routeModule.del) {
      const handlers = Array.isArray(routeModule.del)
        ? routeModule.del
        : [routeModule.del];
      app.delete(
        routePath,
        ...handlers.map((handler, index) =>
          wrapHandler({
            handler,
            method: "delete",
            routePath,
            filePath,
            index,
          }),
        ),
      );
      // console.log(`Registered route DELETE ${routePath}`);
    }
  }
}

export default registerRoutes;
