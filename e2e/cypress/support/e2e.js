// /e2e/cypress/support/e2e.js
// Executes before every spec. Global hooks + behavior.
// ES modules, named exports, arrow functions only.

import "./commands.js";

/** Ignore common benign app errors so tests don't flake. */
export const installExceptionFilters = () => {
  const patterns = [
    /ResizeObserver loop limit exceeded/i,
    /ResizeObserver loop completed/i,
  ];
  Cypress.on("uncaught:exception", (err) => {
    return patterns.some((re) => re.test(err.message)) ? false : undefined;
  });
};

/** (Optional) Fail tests on console.error — enable if you want strict mode. */
// export const failOnConsoleError = () => {
//   Cypress.on("window:before:load", (win) => {
//     const orig = win.console.error;
//     win.console.error = (...args) => {
//       orig(...args);
//       throw new Error(args.join(" "));
//     };
//   });
// };

export const configureSupport = () => {
  installExceptionFilters();
  // failOnConsoleError(); // <- enable if desired
};

configureSupport();
