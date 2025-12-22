import { ApplicationConfig, provideZonelessChangeDetection, isDevMode } from "@angular/core";
import { provideRouter, withComponentInputBinding, withViewTransitions, withPreloading, withDebugTracing } from "@angular/router";
// Removed provideAnimations() - PrimeNG v21 uses CSS animations (80+ KB bundle savings)
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { MessageService } from "primeng/api";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { AcwrService } from "./core/services/acwr.service";
import { LoadMonitoringService } from "./core/services/load-monitoring.service";
import { AcwrAlertsService } from "./core/services/acwr-alerts.service";
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
      ...(isDevMode() ? [withDebugTracing()] : []) // Router event inspector - only in development
    ),
    // Note: No provideAnimations() - PrimeNG v21 migrated to native CSS animations
    // Benefits: 80+ KB bundle savings, hardware acceleration, 60+ FPS
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    MessageService,
    AcwrService,
    LoadMonitoringService,
    AcwrAlertsService,
    AuthAwarePreloadStrategy, // Register the preloading strategy
  ],
};
