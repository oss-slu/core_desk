// vitest.config.integration.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["routes/**/*.test.js"],
    threads: false,
    setupFiles: ["util/tests/setup.js"],
  },
  resolve: {
    alias: {
      auth: "/src/auth",
      quotes: "/src/quotes",
      lib: "/src/lib",
    },
  },
});
