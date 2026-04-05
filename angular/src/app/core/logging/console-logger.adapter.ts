import type { Logger, StructuredJsonLogEntry } from "./logger";

/**
 * Writes one JSON object per log line to the appropriate console API.
 */
export class ConsoleLoggerAdapter implements Logger {
  write(entry: StructuredJsonLogEntry): void {
    const line = JSON.stringify(entry);
    switch (entry.level) {
      case "debug":
        console.debug(line);
        break;
      case "info":
        console.info(line);
        break;
      case "warn":
        console.warn(line);
        break;
      case "error":
        console.error(line);
        break;
      default:
        console.info(line);
    }
  }
}
