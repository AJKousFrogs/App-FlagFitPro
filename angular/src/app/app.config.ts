import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import {
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import {
  ConfirmationService,
  MessageService,
  FilterMatchMode,
} from "primeng/api";
import { providePrimeNG } from "primeng/config";
import { FlagFitPreset } from "./theme/flagfit-preset";
import { PRIMENG_PT_CONFIG } from "./primeng.config";
import { routes } from "./app.routes";
import { environment } from "../environments/environment";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { cacheInterceptor } from "./core/interceptors/cache.interceptor";
import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { retryInterceptor } from "./core/interceptors/retry.interceptor";
import { AngularGlobalErrorHandler } from "./core/services/angular-global-error-handler.service";
import { AuthAwarePreloadStrategy } from "./core/strategies/auth-aware-preload.strategy";
import { LOGGER } from "./core/logging/logger.token";
import { ConsoleLoggerAdapter } from "./core/logging/console-logger.adapter";

export const appConfig: ApplicationConfig = {
  providers: [
    // Locale configuration for i18n (date/number formatting)
    { provide: LOCALE_ID, useValue: "en-US" },

    // Angular 21+: Zoneless is the default change-detection mode.
    // Explicitly enabling stable experimental zoneless for performance.
    provideZonelessChangeDetection(),

    ...(environment.devtools.hydration ? [provideClientHydration()] : []),

    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(AuthAwarePreloadStrategy),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => {
          if (typeof window === "undefined") {
            return;
          }
          if (
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ) {
            transition.skipTransition();
          }
        },
      }),
    ),

    /** No @angular/animations triggers in app; PrimeNG v21 uses CSS motion. */
    provideNoopAnimations(),

    provideHttpClient(
      withFetch(), // Angular 21: Use fetch API for better performance and streaming support
      withInterceptors([
        authInterceptor,
        retryInterceptor, // Retry transient network errors with exponential backoff
        cacheInterceptor,
        errorInterceptor,
      ]),
    ),
    MessageService,
    ConfirmationService,
    providePrimeNG({
      // Pass-Through: Global PT config for button, card, inputtext, dialog, datatable
      pt: PRIMENG_PT_CONFIG,

      // Ripple: Disable ripple effect (we use CSS transitions) - reduces JS execution
      ripple: false,

      // Z-Index: Manage overlay component layering
      // Custom values ensure modals appear above fixed headers/navigation
      zIndex: {
        modal: 1100, // dialog, sidebar
        overlay: 1000, // dropdown, overlaypanel
        menu: 1000, // overlay menus
        tooltip: 1100, // tooltip
      },

      // Input Variant: Default style for input fields
      // "outlined" = borders around field (default)
      // "filled" = background color alternative
      inputVariant: "outlined",

      // Overlay Append To: Where overlays are appended in the DOM
      // "body" = document body (better for modals/dialogs, avoids z-index issues)
      // "self" = host element (default, better for dropdowns within containers)
      overlayAppendTo: "body",

      // Filter Match Mode: Default filter options for DataTable filter menus
      // Configured for text, numeric, and date filters
      filterMatchModeOptions: {
        text: [
          FilterMatchMode.STARTS_WITH,
          FilterMatchMode.CONTAINS,
          FilterMatchMode.NOT_CONTAINS,
          FilterMatchMode.ENDS_WITH,
          FilterMatchMode.EQUALS,
          FilterMatchMode.NOT_EQUALS,
        ],
        numeric: [
          FilterMatchMode.EQUALS,
          FilterMatchMode.NOT_EQUALS,
          FilterMatchMode.LESS_THAN,
          FilterMatchMode.LESS_THAN_OR_EQUAL_TO,
          FilterMatchMode.GREATER_THAN,
          FilterMatchMode.GREATER_THAN_OR_EQUAL_TO,
        ],
        date: [
          FilterMatchMode.DATE_IS,
          FilterMatchMode.DATE_IS_NOT,
          FilterMatchMode.DATE_BEFORE,
          FilterMatchMode.DATE_AFTER,
        ],
      },

      // Theme: PrimeNG 21 Styled Mode Configuration
      theme: {
        preset: FlagFitPreset,

        options: {
          // CSS variable prefix (e.g., --p-primary-color)
          prefix: "p",

          // Dark mode selector: Use class-based toggle
          darkModeSelector: ".dark-theme",

          // CSS Layer configuration for proper cascade order (sync: styles.scss @layer prelude)
          cssLayer: {
            name: "primeng-base",
            order:
              "reset, tokens, primeng-base, primeng-brand, primitives, components, utilities, mobile, features, overrides",
          },
        },
      },
    }),

    // CRITICAL SERVICES: Only register services needed at startup
    AuthAwarePreloadStrategy, // Register the preloading strategy

    // Error tracking and monitoring (Sentry integration)
    { provide: ErrorHandler, useClass: AngularGlobalErrorHandler },

    // Service Worker for PWA support (offline caching, push notifications)
    // PERFORMANCE: Delay registration to not block initial render
    provideServiceWorker("ngsw-worker.js", {
      enabled: environment.production,
      registrationStrategy: "registerWhenStable:30000", // Register after app is stable or 30s
    }),
    { provide: LOGGER, useClass: ConsoleLoggerAdapter },
  ],
};
