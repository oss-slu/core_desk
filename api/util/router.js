import fs from "fs";
import path from "path";
// eslint-disable-next-line no-unused-vars
import express from "express";

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
 * Recursively traverses the routes directory and registers routes with Express.
 * @param {express.Application} app - The Express application instance.
 * @param {string} routesDir - The absolute path to the routes directory.
 */
async function registerRoutes(app, routesDir) {
  async function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (isTestFile(filePath)) {
        continue; // Ignore test files
      }
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        await traverseDir(filePath); // Recursively traverse subdirectories
      } else if (stat.isFile() && file.endsWith(".js")) {
        // Process route file
        const routePath = getRoutePathFromFile(filePath, routesDir);
        const routeModule = await import("file://" + filePath);

        // Supported HTTP methods
        ["get", "post", "put", "patch", "head", "options"].forEach((method) => {
          if (routeModule[method]) {
            // If it's an array, use it as middleware chain
            const handlers = Array.isArray(routeModule[method])
              ? routeModule[method]
              : [routeModule[method]];
            app[method](routePath, ...handlers);
            // console.log(
            //   `Registered route ${method.toUpperCase()} ${routePath}`
            // );
          }
        });

        // Handle `del` for DELETE method
        if (routeModule.del) {
          const handlers = Array.isArray(routeModule.del)
            ? routeModule.del
            : [routeModule.del];
          app.delete(routePath, ...handlers);
          // console.log(`Registered route DELETE ${routePath}`);
        }
      }
    }
  }

  await traverseDir(routesDir);
}

export default registerRoutes;
