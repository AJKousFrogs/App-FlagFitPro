import type { Logger } from "./logger";

function formatMeta(meta?: unknown): unknown[] {
  if (meta === undefined) return [];
  if (Array.isArray(meta)) return meta;
  return [meta];
}

export class ConsoleLoggerAdapter implements Logger {
  debug(message: string, meta?: unknown): void {
    console.debug(message, ...formatMeta(meta));
  }
  info(message: string, meta?: unknown): void {
    console.info(message, ...formatMeta(meta));
  }
  warn(message: string, meta?: unknown): void {
    console.warn(message, ...formatMeta(meta));
  }
  error(message: string, meta?: unknown): void {
    console.error(message, ...formatMeta(meta));
  }
}
