export type LogLevel = "info" | "warn" | "error" | "debug";

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {})
  };
  process.stderr.write(`${JSON.stringify(payload)}\n`);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context)
};
