import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,ts,jsx,tsx}",
    supportFile: "cypress/support/e2e.js",
    video: true,
    screenshotsFolder: "cypress/screenshots",
  },
});
