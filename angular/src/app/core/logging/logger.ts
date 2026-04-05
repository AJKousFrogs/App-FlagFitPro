export type LogLevel = "debug" | "info" | "warn" | "error";

import { redactForLog } from "./redact-pii.util";

/**
 * Single JSON line emitted to the console sink (and buffers) for log aggregation.
 */
export interface StructuredJsonLogEntry {
  timestamp: string;
  level: LogLevel;
  event_name: string;
  context: Record<string, unknown>;
}

/**
 * Pluggable sink (e.g. JSON console, remote forwarder).
 */
export interface Logger {
  write(entry: StructuredJsonLogEntry): void;
}

export function createStructuredLogEntry(
  level: LogLevel,
  eventName: string,
  context: Record<string, unknown> = {},
): StructuredJsonLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    event_name: eventName,
    context: redactForLog(context) as Record<string, unknown>,
  };
}
