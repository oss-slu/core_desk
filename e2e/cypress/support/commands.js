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

export const registerAuthenticateUser = () => {
  // Generates a valid JWT for a user and optionally sets it.
  // Usage:
  //   cy.authenticateUser(userId) -> yields token
  //   cy.authenticateUser({ userId, setLocalStorage: true }) -> sets localStorage 'token' in current app window (requires a visited page)
  Cypress.Commands.add("authenticateUser", (arg) => {
    const opts =
      typeof arg === "string" ? { userId: arg } : arg || { userId: null };
    if (!opts.userId) throw new Error("authenticateUser requires userId");
    return cy
      .task("cy:authenticateUser", {
        userId: opts.userId,
        expiresIn: opts.expiresIn,
      })
      .then((token) => {
        if (opts.setLocalStorage) {
          // Requires a page context; call after cy.visit or within cy.visit onBeforeLoad
          cy.window({ log: false }).then((win) => {
            win.localStorage.setItem("token", token);
          });
        }
        return token;
      });
  });
};

export const registerCommands = () => {
  registerGetByTestId();
  registerVisitApp();
  registerApiHelper();
  registerAuthenticateUser();
};

registerCommands();
