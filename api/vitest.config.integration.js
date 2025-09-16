// vitest.config.integration.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["routes/**/*.test.js", ],
    setupFiles: ["util/tests/setup.js"],
    fileParallelism: false,
  },
});
