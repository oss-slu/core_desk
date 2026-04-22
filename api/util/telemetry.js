import { SpanStatusCode, trace } from "@opentelemetry/api";

export const tracer = trace.getTracer("coredesk.api");

export const recordSpanError = (span, error) => {
  if (!span || !error) {
    return;
  }

  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
};
