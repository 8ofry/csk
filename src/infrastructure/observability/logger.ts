// Structured logger (NFR-MNT-02). Always JSON-lines to stdout. When SENTRY_DSN
// is set the same events also forward to Sentry — kept dual so logs survive in
// CloudWatch / Stackdriver even if Sentry is dropping payloads.

import * as Sentry from "@sentry/nextjs";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEvent {
  level: LogLevel;
  message: string;
  tags?: Record<string, string | number | boolean>;
  context?: Record<string, unknown>;
  error?: unknown;
}

export interface Logger {
  debug(message: string, extra?: Omit<LogEvent, "level" | "message">): void;
  info(message: string, extra?: Omit<LogEvent, "level" | "message">): void;
  warn(message: string, extra?: Omit<LogEvent, "level" | "message">): void;
  error(message: string, extra?: Omit<LogEvent, "level" | "message">): void;
  /** Wrap a promise; logs + rethrows on rejection so the original failure mode is preserved. */
  capture<T>(fn: () => Promise<T>, context: { op: string; tags?: LogEvent["tags"] }): Promise<T>;
}

const sentryEnabled = !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN;

class StructuredLogger implements Logger {
  private write(event: LogEvent) {
    const out = {
      ts: new Date().toISOString(),
      level: event.level,
      msg: event.message,
      ...(event.tags ? { tags: event.tags } : {}),
      ...(event.context ? { context: event.context } : {}),
      ...(event.error
        ? {
            err:
              event.error instanceof Error
                ? { name: event.error.name, message: event.error.message, stack: event.error.stack }
                : { value: String(event.error) },
          }
        : {}),
    };
    const line = JSON.stringify(out);
    if (event.level === "error" || event.level === "warn") {
      console.error(line);
    } else {
      console.info(line);
    }
    if (sentryEnabled) this.forwardToSentry(event);
  }

  private forwardToSentry(event: LogEvent) {
    try {
      Sentry.withScope((scope) => {
        if (event.tags) {
          for (const [k, v] of Object.entries(event.tags)) scope.setTag(k, String(v));
        }
        if (event.context) scope.setContext("logger", event.context);
        if (event.error instanceof Error) {
          Sentry.captureException(event.error, { level: levelToSentry(event.level) });
        } else if (event.level === "error" || event.level === "warn") {
          Sentry.captureMessage(event.message, levelToSentry(event.level));
        }
        // info/debug events stay log-only — Sentry isn't a log warehouse.
      });
    } catch {
      // Never let Sentry transport errors break the request.
    }
  }

  debug(message: string, extra?: Omit<LogEvent, "level" | "message">) {
    if (process.env.NODE_ENV === "production") return;
    this.write({ ...extra, level: "debug", message });
  }
  info(message: string, extra?: Omit<LogEvent, "level" | "message">) {
    this.write({ ...extra, level: "info", message });
  }
  warn(message: string, extra?: Omit<LogEvent, "level" | "message">) {
    this.write({ ...extra, level: "warn", message });
  }
  error(message: string, extra?: Omit<LogEvent, "level" | "message">) {
    this.write({ ...extra, level: "error", message });
  }

  async capture<T>(
    fn: () => Promise<T>,
    context: { op: string; tags?: LogEvent["tags"] },
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      this.error(`Operation failed: ${context.op}`, {
        tags: { op: context.op, ...(context.tags ?? {}) },
        error: err,
      });
      throw err;
    }
  }
}

function levelToSentry(level: LogLevel): "debug" | "info" | "warning" | "error" {
  switch (level) {
    case "warn":
      return "warning";
    case "error":
    case "info":
    case "debug":
      return level;
  }
}

export const logger: Logger = new StructuredLogger();
