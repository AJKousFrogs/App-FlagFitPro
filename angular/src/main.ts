import { addIcon } from "iconify-icon"; // web component — registers <iconify-icon> globally
import { OFFLINE_MDI_ICONS } from "./app/shared/offline-mdi-icons";
import { bootstrapApplication } from "@angular/platform-browser";

// Register every used MDI icon offline so <iconify-icon> renders from bundled data
// and never fetches mdi.json from api.iconify.design (those requests 504 on slow/
// blocked networks). Regenerate the data with scripts/gen-offline-mdi-icons.mjs.
for (const [name, data] of Object.entries(OFFLINE_MDI_ICONS)) {
  addIcon(name, data);
}

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
