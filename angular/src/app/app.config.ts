import {
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideZonelessChangeDetection,
} from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withDebugTracing,
  withPreloading,
  withViewTransitions,
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
// Removed provideAnimations() - PrimeNG v21 uses CSS animations (80+ KB bundle savings)
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import { MessageService } from "primeng/api";
import { providePrimeNG } from "primeng/config";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { cacheInterceptor } from "./core/interceptors/cache.interceptor";
import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { AcwrAlertsService } from "./core/services/acwr-alerts.service";
import { AcwrService } from "./core/services/acwr.service";
import { CoreWebVitalsService } from "./core/services/core-web-vitals.service";
import {
  ErrorTrackingService,
  GlobalErrorHandler,
} from "./core/services/error-tracking.service";
import { LoadMonitoringService } from "./core/services/load-monitoring.service";
import { ResourceService } from "./core/services/resource.service";
import { AuthAwarePreloadStrategy } from "./core/strategies/auth-aware-preload.strategy";

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 21: Zoneless change detection (stable in v21)
    // Benefits:
    // - No Zone.js overhead (smaller bundle, faster change detection)
    // - Better DevTools integration with real-time change detection tracing
    // - More predictable reactivity with signals
    // - Automatic change detection on signal updates and DOM events
    // Note: zone.js is available as optional peer dependency for third-party libraries if needed
    provideZonelessChangeDetection(),

    // Angular 21: Enhanced routing with component input binding, view transitions, and smart preloading
    // Router event inspector: Enable debug tracing in development for router event inspection
    provideRouter(
      routes,
      withComponentInputBinding(), // Enables route params as component inputs
      withViewTransitions(), // Enables smooth page transitions
      withPreloading(AuthAwarePreloadStrategy), // Custom preloading strategy for authenticated routes
      ...(isDevMode() ? [withDebugTracing()] : []), // Router event inspector - only in development
    ),
    // Note: No provideAnimations() - PrimeNG v21 migrated to native CSS animations
    // Benefits: 80+ KB bundle savings, hardware acceleration, 60+ FPS
    provideHttpClient(
      withFetch(), // Angular 21: Use fetch API for better performance and streaming support
      withInterceptors([authInterceptor, cacheInterceptor, errorInterceptor]),
    ),
    MessageService,
    providePrimeNG({
      ripple: false, // Disable ripple effect (we use CSS transitions)
      zIndex: {
        modal: 1100,
        overlay: 1000,
        menu: 1000,
        tooltip: 1100,
      },
    }),
    AcwrService,
    LoadMonitoringService,
    AcwrAlertsService,
    CoreWebVitalsService,
    AuthAwarePreloadStrategy, // Register the preloading strategy

    // Angular 21: Resource API service for declarative data fetching
    ResourceService,

    // Error tracking and monitoring (Sentry integration)
    ErrorTrackingService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Service Worker for PWA support (offline caching, push notifications)
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000", // Register after app is stable or 30s
    }),
  ],
};
