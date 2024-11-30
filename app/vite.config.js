import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: true, // Source map generation must be turned on
  },
  plugins: [
    // Put the Sentry vite plugin after all other plugins
    sentryVitePlugin({
      // eslint-disable-next-line
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "jc-apps",
      project: "slu-open-project",
    }),
  ],
});
