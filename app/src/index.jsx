import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://37381b9d7fda2d0038ae25ded8c8af1d@o1104565.ingest.us.sentry.io/4508264105115648",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
    }),
    Sentry.feedbackIntegration({
      colorScheme: "light",
    }),
  ],
  beforeSend(event, hint) {
    // Check if it is an exception, and if so, show the report dialog
    if (event.exception && event.event_id) {
      Sentry.showReportDialog({
        eventId: event.event_id,
        title: "The application has crashed.",
        subtitle:
          "An error report has already been generated and sent, but if you would like to help, please tell me what happened.",
      });
    }
    return event;
  },
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  // tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 1.0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
