import { defineConfig } from "cypress";
import { yamlPreprocessor, registerCommand } from "cypress-yaml-plugin";
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

registerCommand(
  "authenticateUser",
  (options) => {
    const encodedOptions = JSON.stringify(options);
    const emailLabel = JSON.stringify(options.email);

    return [
      `cy.task('authenticateUser', ${encodedOptions}).then((token) => {
        if (!token) {
          throw new Error('authenticateUser task returned invalid token');
        }

        cy.window().then((win) => {
          win.localStorage.setItem('token', token);
        });

        cy.log('Authenticated as ' + ${emailLabel});
      });`,
    ];
  },
  {
    schema: z.object({
      email: z.string().min(1, "email is required"),
    }),
  },
);

export default defineConfig({
  e2e: {
    setupNodeEvents(on) {
      yamlPreprocessor(on);
      on("task", {
        authenticateUser: async ({ email }) => {
          console.log("Authenticating user with email", email);
        },
      });
    },
    specPattern: "tests/**/*.yaml",
    baseUrl: "http://localhost:3030",
    supportFile: false,
  },
});
