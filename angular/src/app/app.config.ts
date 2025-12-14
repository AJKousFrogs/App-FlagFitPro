import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { MessageService } from "primeng/api";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { AcwrService } from "./core/services/acwr.service";
import { LoadMonitoringService } from "./core/services/load-monitoring.service";
import { AcwrAlertsService } from "./core/services/acwr-alerts.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    MessageService,
    AcwrService,
    LoadMonitoringService,
    AcwrAlertsService,
  ],
};
