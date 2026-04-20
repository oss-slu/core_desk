import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#prisma-client";
import { recordSpanError, tracer } from "./telemetry.js";

const normalizeConnectionString = (rawUrl) => {
  if (!rawUrl) return rawUrl;

  const url = new URL(rawUrl);
  const sslmode = url.searchParams.get("sslmode");

  // Prisma v7 uses pg adapter semantics; preserve classic libpq "require" behavior.
  if (sslmode === "require" && !url.searchParams.has("uselibpqcompat")) {
    url.searchParams.set("uselibpqcompat", "true");
  }

  return url.toString();
};

const adapter = new PrismaPg({
  connectionString: normalizeConnectionString(process.env.DATABASE_URL),
});

const summarizeArgs = (args) => {
  if (!args || typeof args !== "object") {
    return [];
  }

  return Object.keys(args).sort();
};

const summarizeResult = (result) => {
  if (Array.isArray(result)) {
    return result.length;
  }

  if (result && typeof result === "object" && typeof result.count === "number") {
    return result.count;
  }

  if (result && typeof result === "object") {
    return 1;
  }

  return 0;
};

export const prisma = new PrismaClient({ adapter }).$extends({
  name: "coredesk-opentelemetry",
  query: {
    async $allOperations({ model, operation, args, query }) {
      return tracer.startActiveSpan(
        `prisma.${model || "raw"}.${operation}`,
        {
          attributes: {
            "db.system": "postgresql",
            "db.operation.name": operation,
            "db.prisma.model": model || "raw",
            "coredesk.prisma.arg_keys": summarizeArgs(args).join(","),
          },
        },
        async (span) => {
          try {
            const result = await query(args);

            span.setAttribute(
              "coredesk.prisma.result_size",
              summarizeResult(result),
            );

            return result;
          } catch (error) {
            recordSpanError(span, error);
            throw error;
          } finally {
            span.end();
          }
        },
      );
    },
  },
});
export default prisma;
