import "dotenv/config";
import process from "process";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";

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

const initializeTelemetry = () => {
  if (process.env.OTEL_ENABLED === "false") {
    return;
  }

  if (process.env.OTEL_LOG_LEVEL === "debug") {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const headers = configureHeaders();

  if (!headers["x-honeycomb-team"]) {
    return;
  }

  const serviceName =
    process.env.OTEL_SERVICE_NAME ||
    process.env.PROJECT_NAME ||
    "coredesk-api";

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      "service.name": serviceName,
      "deployment.environment": process.env.NODE_ENV || "development",
    }),
    traceExporter: new OTLPTraceExporter({
      url: buildTraceEndpoint(),
      headers,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();

  const shutdown = async () => {
    try {
      await sdk.shutdown();
    } catch (error) {
      if (process.env.OTEL_LOG_LEVEL === "debug") {
        diag.error("OpenTelemetry shutdown failed", error);
      }
    } finally {
      process.exit(0);
    }
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
};

initializeTelemetry();
