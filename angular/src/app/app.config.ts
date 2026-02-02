import {
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideZonelessChangeDetection,
  LOCALE_ID,
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
import {
  ConfirmationService,
  MessageService,
  FilterMatchMode,
} from "primeng/api";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeuix/themes/aura";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { cacheInterceptor } from "./core/interceptors/cache.interceptor";
import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { retryInterceptor } from "./core/interceptors/retry.interceptor";
import { debugInterceptor } from "./core/interceptors/debug.interceptor";
import { AcwrAlertsService } from "./core/services/acwr-alerts.service";
import { AcwrService } from "./core/services/acwr.service";
import {
  ErrorTrackingService,
  GlobalErrorHandler,
} from "./core/services/error-tracking.service";
import { LoadMonitoringService } from "./core/services/load-monitoring.service";
import { ResourceService } from "./core/services/resource.service";
import { PlatformDetectionService } from "./core/services/platform-detection.service";
import { AuthAwarePreloadStrategy } from "./core/strategies/auth-aware-preload.strategy";
import { LOGGER } from "./core/logging/logger.token";
import { ConsoleLoggerAdapter } from "./core/logging/console-logger.adapter";

export const appConfig: ApplicationConfig = {
  providers: [
    // Locale configuration for i18n (date/number formatting)
    { provide: LOCALE_ID, useValue: "en-US" },

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
      withInterceptors([
        authInterceptor,
        retryInterceptor, // Retry transient network errors with exponential backoff
        cacheInterceptor,
        errorInterceptor,
        ...(isDevMode() ? [debugInterceptor] : []), // Debug interceptor - only in development
      ]),
    ),
    MessageService,
    ConfirmationService,
    providePrimeNG({
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

      // CSP Nonce: For Content Security Policy nonce support
      // Uncomment and set nonce value if moving from 'unsafe-inline' to nonce-based CSP
      // Currently using 'unsafe-inline' in netlify.toml for styles
      // csp: {
      //   nonce: 'your-nonce-value-here'
      // },

      // Theme: PrimeNG 21 Styled Mode Configuration
      //
      // ARCHITECTURE:
      // PrimeNG uses a design-agnostic theming system with three token tiers:
      // 1. Primitive Tokens: Raw color palette (e.g., blue-500, green-400)
      // 2. Semantic Tokens: Contextual design elements (e.g., primary.color, surface.ground)
      // 3. Component Tokens: Component-specific (e.g., button.background, inputtext.border.color)
      //
      // CURRENT APPROACH:
      // We use the Aura preset as the base and customize via CSS variables in:
      // - angular/src/scss/components/primeng-theme.scss (component-specific overrides)
      // - primeng-integration.scss (design token mapping)
      //
      // FUTURE ENHANCEMENT:
      // To use definePreset() for token-based customization (recommended by PrimeNG docs):
      // 1. Import: import { definePreset } from "primeng/config"
      // 2. Replace preset: Aura with preset: definePreset(Aura, { primitive: {...}, semantic: {...}, components: {...} })
      // 3. This ensures proper color scheme support (light/dark mode) and token hierarchy
      // 4. See PrimeNG Styled Mode documentation for definePreset() API details
      theme: {
        // Base preset: Aura (PrimeTek's modern vision)
        // Alternative presets: Material, Lara, Nora
        preset: Aura,

        options: {
          // CSS variable prefix (e.g., --p-primary-color)
          // All PrimeNG tokens use this prefix
          prefix: "p",

          // Dark mode selector: Use class-based toggle
          // Toggle the .dark-theme class on document root to switch themes
          //
          // Options:
          // - ".dark-theme" = class-based toggle (current)
          // - "system" = prefers-color-scheme media query
          // - false or "none" = disable dark mode completely
          darkModeSelector: ".dark-theme",

          // CSS Layer configuration for proper cascade order
          // This ensures PrimeNG styles can be overridden cleanly without !important
          //
          // Layer order (lowest to highest specificity):
          // 1. reset = Browser normalization
          // 2. tokens = Design tokens (CSS custom properties)
          // 3. primeng-base = PrimeNG default styles
          // 4. primeng-brand = PrimeNG customization to match brand
          // 5. primitives = Shared components (cards, typography, spacing)
          // 6. features = Feature-specific styles
          // 7. overrides = Temporary fixes only (with ticket + expiry)
          cssLayer: {
            name: "primeng-base",
            order:
              "reset, tokens, primeng-base, primeng-brand, primitives, features, overrides",
          },
        },
      },

      // Translation: For i18n support
      // Uncomment and configure translations when implementing multi-language support
      // translation: {
      //   accept: 'Accept',
      //   reject: 'Reject',
      //   // Add more translations as needed
      // },
    }),

    // CRITICAL SERVICES: Only register services needed at startup
    AuthAwarePreloadStrategy, // Register the preloading strategy

    // DEFERRED SERVICES: These are initialized lazily when needed
    // They are tree-shakeable and won't add to initial bundle if not used
    // Note: CoreWebVitalsService auto-initializes in constructor when provided in root
    AcwrService,
    LoadMonitoringService,
    AcwrAlertsService,
    ResourceService,
    PlatformDetectionService, // Auto-detects iOS, Android, Safari, Chrome

    // Error tracking and monitoring (Sentry integration)
    ErrorTrackingService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // Service Worker for PWA support (offline caching, push notifications)
    // PERFORMANCE: Delay registration to not block initial render
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000", // Register after app is stable or 30s
    }),
    { provide: LOGGER, useClass: ConsoleLoggerAdapter },
  ],
};
