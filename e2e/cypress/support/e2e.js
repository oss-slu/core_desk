// /e2e/cypress/support/e2e.js
// Executes before every spec. Global hooks + behavior.
// ES modules, named exports, arrow functions only.

import "./commands.js";

/** Ignore common benign app errors so tests don't flake. */
export const installExceptionFilters = () => {
  const patterns = [
    /ResizeObserver loop limit exceeded/i,
    /ResizeObserver loop completed/i,
    /Blocked a frame with origin .* from accessing a cross-origin frame/i,
  ];
  Cypress.on("uncaught:exception", (err) => {
    // Ignore known benign cross-origin and layout observer errors to reduce flake
    if (patterns.some((re) => re.test(err.message))) return false;
    if (err?.name === "SecurityError" && /cross-origin frame/i.test(err.message)) {
      return false;
    }
    return undefined;
  });
};

/**
 * Intercept Sentry envelope requests and print a concise summary
 * to the Cypress process (so it shows in the test console output).
 */
export const installSentryConsoleReporter = () => {
  const toText = (body) => {
    if (typeof body === "string") return body;
    try {
      // Handle ArrayBuffer or typed array bodies
      if (body && body.buffer && body.byteLength != null) {
        return new TextDecoder().decode(
          body.buffer.byteLength ? body.buffer : body
        );
      }
      // Handle ArrayBuffer directly
      if (body instanceof ArrayBuffer) {
        return new TextDecoder().decode(body);
      }
    } catch (_) {}
    return "";
  };

  const parseEnvelope = (raw) => {
    const text = toText(raw);
    const lines = (text || "").split("\n").filter(Boolean);
    const header = (() => {
      try {
        return JSON.parse(lines[0] || "{}");
      } catch (_) {
        return {};
      }
    })();
    const items = [];
    for (let i = 1; i < lines.length; i += 2) {
      try {
        const itemHeader = JSON.parse(lines[i] || "{}");
        let payload = {};
        try {
          payload = JSON.parse(lines[i + 1] || "{}");
        } catch (_) {}
        items.push({ itemHeader, payload });
      } catch (_) {
        // ignore malformed lines
      }
    }
    return { header, items };
  };

  const summarizeEvent = (evt) => {
    const id = evt.event_id || evt.eventId;
    const level = evt.level || "error";
    const msg =
      evt.message ||
      (evt.exception?.values || [])
        .map((v) => [v.type, v.value].filter(Boolean).join(": "))
        .join(" | ") ||
      evt.logentry?.message ||
      evt.transaction ||
      "(no message)";
    const release = evt.release || evt.version;
    const env = evt.environment;
    return { id, level, message: msg, release, environment: env };
  };

  // Attach once per spec
  beforeEach(() => {
    // Match Sentry v7+ browser SDK envelope endpoint on any host
    cy.intercept(
      {
        method: "POST",
        url: /\/api\/\d+\/envelope(\/.+)?$/,
      },
      (req) => {
        const { items } = parseEnvelope(req.body);
        const eventItems = items.filter((it) => it?.itemHeader?.type === "event");
        if (eventItems.length) {
          for (const it of eventItems) {
            const summary = summarizeEvent(it.payload || {});
            cy.task("log", {
              sentry: true,
              type: "event",
              id: summary.id,
              level: summary.level,
              message: summary.message,
              release: summary.release,
              environment: summary.environment,
            });
          }
        }
        // Let the request continue as normal
        req.continue();
      }
    ).as("sentryEnvelope");

    // Also match legacy store endpoint just in case
    cy.intercept(
      {
        method: "POST",
        url: /\/api\/\d+\/store\/?$/,
      },
      (req) => {
        // store endpoint sends raw event JSON
        let payload = {};
        try {
          payload = JSON.parse(toText(req.body) || "{}");
        } catch (_) {}
        const summary = summarizeEvent(payload);
        cy.task("log", {
          sentry: true,
          type: "event",
          id: summary.id,
          level: summary.level,
          message: summary.message,
          release: summary.release,
          environment: summary.environment,
        });
        req.continue();
      }
    ).as("sentryStore");
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
  installSentryConsoleReporter();
  // failOnConsoleError(); // <- enable if desired
};

configureSupport();
