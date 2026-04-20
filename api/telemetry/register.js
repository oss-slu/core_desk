import "dotenv/config";
import process from "process";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";

const isTruthy = (value) =>
  ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());

const otelDebugEnabled = isTruthy(process.env.OTEL_DBG);

const parseHeaders = (rawHeaders = "") =>
  Object.fromEntries(
    rawHeaders
      .split(",")
      .map((header) => header.trim())
      .filter(Boolean)
      .map((header) => {
        const separatorIndex = header.indexOf("=");
        if (separatorIndex === -1) {
          return null;
        }

        return [
          header.slice(0, separatorIndex).trim(),
          header.slice(separatorIndex + 1).trim(),
        ];
      })
      .filter(Boolean),
  );

const buildTraceEndpoint = () => {
  const rawEndpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    "https://api.honeycomb.io";
  const sanitizedEndpoint = rawEndpoint.replace(/\/+$/, "");

  if (sanitizedEndpoint.endsWith("/v1/traces")) {
    return sanitizedEndpoint;
  }

  return `${sanitizedEndpoint}/v1/traces`;
};

const configureHeaders = () => {
  const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);

  if (!headers["x-honeycomb-team"] && process.env.HONEYCOMB_API_KEY) {
    headers["x-honeycomb-team"] = process.env.HONEYCOMB_API_KEY;
  }

  if (!headers["x-honeycomb-dataset"] && process.env.HONEYCOMB_DATASET) {
    headers["x-honeycomb-dataset"] = process.env.HONEYCOMB_DATASET;
  }

  return headers;
};

const redactHeaders = (headers) =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      key.toLowerCase().includes("honeycomb-team") ? "<redacted>" : value,
    ]),
  );

const debug = (message, details) => {
  if (!otelDebugEnabled) {
    return;
  }

  if (details === undefined) {
    diag.debug(message);
    return;
  }

  diag.debug(message, details);
};

const debugError = (message, error) => {
  if (!otelDebugEnabled) {
    return;
  }

  diag.error(message, error);
};

class DebugTraceExporter {
  constructor(exporter, config) {
    this.exporter = exporter;
    this.config = config;
  }

  export(spans, resultCallback) {
    debug(
      `[otel] exporting ${spans.length} span(s) to ${this.config.url}`,
      redactHeaders(this.config.headers),
    );

    return this.exporter.export(spans, (result) => {
      if (result?.error) {
        debugError("[otel] export failed", result.error);
      } else {
        debug(`[otel] export completed for ${spans.length} span(s)`);
      }

      resultCallback(result);
    });
  }

  shutdown() {
    debug("[otel] exporter shutdown requested");
    return this.exporter.shutdown();
  }

  forceFlush() {
    if (typeof this.exporter.forceFlush === "function") {
      debug("[otel] exporter forceFlush requested");
      return this.exporter.forceFlush();
    }

    return Promise.resolve();
  }
}

const initializeTelemetry = () => {
  if (otelDebugEnabled) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  if (process.env.OTEL_ENABLED === "false") {
    debug("[otel] skipped because OTEL_ENABLED=false");
    return;
  }

  const headers = configureHeaders();

  if (!headers["x-honeycomb-team"]) {
    debug("[otel] skipped because no Honeycomb API key/header was configured");
    return;
  }

  if (!headers["x-honeycomb-dataset"] && otelDebugEnabled) {
    debug(
      "[otel] no Honeycomb dataset configured; this is fine unless you are using Honeycomb Classic",
    );
  }

  const serviceName =
    process.env.OTEL_SERVICE_NAME ||
    process.env.PROJECT_NAME ||
    "coredesk-api";

  // This app only exports traces for now. Without these defaults, NodeSDK will
  // assume OTLP for logs and metrics as well, which adds noisy failures locally.
  process.env.OTEL_LOGS_EXPORTER ||= "none";
  process.env.OTEL_METRICS_EXPORTER ||= "none";

  const traceExporterConfig = {
    url: buildTraceEndpoint(),
    headers,
  };
  const traceExporter = new OTLPTraceExporter(traceExporterConfig);

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      "service.name": serviceName,
      "deployment.environment": process.env.NODE_ENV || "development",
    }),
    traceExporter: otelDebugEnabled
      ? new DebugTraceExporter(traceExporter, traceExporterConfig)
      : traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();
  debug(`[otel] initialized for service ${serviceName}`, {
    url: traceExporterConfig.url,
    headers: redactHeaders(headers),
  });

  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    let shouldReemitSigusr2 = false;

    try {
      debug(`[otel] shutting down after ${signal}`);
      await sdk.shutdown();
    } catch (error) {
      debugError("[otel] shutdown failed", error);
    }

    if (signal === "SIGUSR2") {
      shouldReemitSigusr2 = true;
    }

    if (shouldReemitSigusr2) {
      process.kill(process.pid, "SIGUSR2");
      return;
    }

    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGUSR2", () => void shutdown("SIGUSR2"));
};

initializeTelemetry();
