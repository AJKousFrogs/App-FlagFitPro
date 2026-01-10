import {
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideZonelessChangeDetection,
  APP_INITIALIZER,
  inject,
} from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import {
  provideRouter,
  withComponentInputBinding,
  withDebugTracing,
  withPreloading,
  withViewTransitions,
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import { MessageService } from "primeng/api";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeuix/themes/aura";
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

/**
 * PERFORMANCE OPTIMIZATION: Initialize Core Web Vitals monitoring
 * Using APP_INITIALIZER with inject() in factory context ensures proper DI
 */
function initializeCoreWebVitals() {
  // inject() is valid here because this factory runs in injection context
  // The service auto-initializes on construction, we just need to inject it
  const _webVitalsService = inject(CoreWebVitalsService);

  return () => {
    // Defer actual monitoring to avoid blocking initial render
    if (typeof window !== "undefined") {
      const scheduleInit =
        window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100));
      scheduleInit(() => {
        // Service is already injected, just trigger initialization if needed
        // The service will auto-initialize on construction
      });
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // - No Zone.js overhead (smaller bundle, faster change detection)
    // - Better DevTools integration with real-time change detection tracing
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

    // PERFORMANCE: Use async animations to reduce initial bundle
    // Animations are loaded asynchronously, reducing TBT
    provideAnimationsAsync(),

    provideHttpClient(
      withFetch(), // Angular 21: Use fetch API for better performance and streaming support
      withInterceptors([authInterceptor, cacheInterceptor, errorInterceptor]),
    ),
    MessageService,
    providePrimeNG({
      ripple: false, // Disable ripple effect (we use CSS transitions) - reduces JS execution
      zIndex: {
        modal: 1100,
        overlay: 1000,
        menu: 1000,
        tooltip: 1100,
      },
      // CRITICAL FIX: PrimeNG 21 requires theme preset for base styles
      // Aura is the default PrimeNG 21 theme that provides foundational component styling
      // Our custom CSS variables (in primeng-theme.scss) override Aura's defaults
      theme: {
        preset: Aura, // Provides base PrimeNG component styles
        options: {
          prefix: "p", // CSS variable prefix (e.g., --p-primary-color)
          darkModeSelector: ".dark-theme", // Use class-based dark mode toggle
          cssLayer: {
            name: "primeng-base",
            order:
              "reset, tokens, primeng-base, primeng-brand, primitives, features, overrides",
          },
        },
      },
    }),

    // CRITICAL SERVICES: Only register services needed at startup
    AuthAwarePreloadStrategy, // Register the preloading strategy

    // DEFERRED SERVICES: These are initialized lazily when needed
    // They are tree-shakeable and won't add to initial bundle if not used
    AcwrService,
    LoadMonitoringService,
    AcwrAlertsService,
    CoreWebVitalsService,
    ResourceService,

    // Error tracking and monitoring (Sentry integration)
    ErrorTrackingService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // PERFORMANCE: Initialize Core Web Vitals monitoring after app is stable
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCoreWebVitals,
      multi: true,
    },

    // Service Worker for PWA support (offline caching, push notifications)
    // PERFORMANCE: Delay registration to not block initial render
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000", // Register after app is stable or 30s
    }),
  ],
};
