// /e2e/cypress/support/commands.js
// Define custom Cypress commands. Keep them small and reusable.

export const registerGetByTestId = () => {
  Cypress.Commands.add("getByTestId", (testId, options) =>
    cy.get(`[data-testid="${testId}"]`, options)
  );
};

export const registerVisitApp = () => {
  Cypress.Commands.add("visitApp", (path = "/") => {
    const base = Cypress.config("baseUrl") || "http://localhost:3000";
    const url = new URL(path, base).toString();
    return cy.visit(url);
  });
};

export const registerApiHelper = () => {
  // Usage: cy.api("GET", "/api/health")
  Cypress.Commands.add("api", (method, path, body = null, options = {}) => {
    const apiBase = Cypress.env("API_URL") || ""; // e.g. "http://localhost:3000"
    return cy.request({
      method,
      url: `${apiBase}${path}`,
      body,
      ...options,
    });
  });
};

export const registerLogin = () => {
  // Example API login. Adjust to your app.
  // Uses env vars AUTH_EMAIL / AUTH_PASSWORD (set in cypress.config or CLI).
  Cypress.Commands.add("login", (email, password) => {
    const user = email || Cypress.env("AUTH_EMAIL");
    const pass = password || Cypress.env("AUTH_PASSWORD");
    if (!user || !pass) {
      throw new Error("Set AUTH_EMAIL and AUTH_PASSWORD in Cypress env.");
    }
    // Cache session between tests for speed
    return cy.session([user], () => {
      cy.request("POST", `${Cypress.env("API_URL") || ""}/api/auth/login`, {
        email: user,
        password: pass,
      }).then((res) => {
        // If your app returns a token, persist it as your app expects.
        // Example: localStorage token
        const token =
          res.body?.token ||
          res.body?.accessToken ||
          res.headers["x-access-token"];
        if (token) {
          window.localStorage.setItem("auth_token", token);
        }
        // Or if you rely on cookies, nothing else needed — cy.request preserves them.
      });
    });
  });
};

export const registerCommands = () => {
  registerGetByTestId();
  registerVisitApp();
  registerApiHelper();
  registerLogin();
};

registerCommands();
