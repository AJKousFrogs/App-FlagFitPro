import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { ConsoleLoggerAdapter } from "./app/core/logging/console-logger.adapter";

const bootstrapLogger = new ConsoleLoggerAdapter();

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  bootstrapLogger.error("Bootstrap failed", err);
});
