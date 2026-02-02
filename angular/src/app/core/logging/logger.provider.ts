import type { Provider } from "@angular/core";
import { ConsoleLoggerAdapter } from "./console-logger.adapter";
import { LOGGER } from "./logger.token";

export const consoleLoggerProvider: Provider = {
  provide: LOGGER,
  useClass: ConsoleLoggerAdapter,
};
