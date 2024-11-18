// vitest.config.integration.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["routes/**/*.test.js"],
    threads: false,
    isolate: true,
    setupFiles: ["util/tests/setup.js"],
    fileParallelism: false,
    sequence: {
      shuffle: false, // Ensure deterministic order
      concurrent: false, // Run tests sequentially
      maxConcurrency: 1, // Only run one test at a time
    },
  },
});
