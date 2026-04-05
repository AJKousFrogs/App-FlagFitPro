import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { ConsoleLoggerAdapter } from "./app/core/logging/console-logger.adapter";
import { redactForLog } from "./app/core/logging/redact-pii.util";

const bootstrapLogger = new ConsoleLoggerAdapter();

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  bootstrapLogger.write({
    timestamp: new Date().toISOString(),
    level: "error",
    event_name: "angular_bootstrap_failed",
    context: redactForLog({
      error:
        err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : { message: String(err) },
    }) as Record<string, unknown>,
  });
});
