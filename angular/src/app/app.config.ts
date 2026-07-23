import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from "@angular/core";
import {
  LucideAngularModule,
  Home,
  Dumbbell,
  HeartPulse,
  LineChart,
  Menu,
  Plus,
  Bell,
  Flag,
  Cloud,
  CloudRain,
  RefreshCw,
  Play,
  Info,
  Pill,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Droplet,
  Moon,
  Activity,
  ShieldAlert,
  Ban,
  ClipboardList,
  BadgeCheck,
  TestTube,
  AlertTriangle,
  CircleAlert,
  Circle,
  Check,
  Coffee,
  ShieldHalf,
  Trophy,
  Users,
  MessageCircle,
  BarChart3,
  Sparkles,
  BookOpen,
  FileText,
  User,
  Medal,
  Flame,
  Settings,
  Camera,
  Lock,
  LogOut,
  Sun,
  TrendingUp,
  Video,
  Mail,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  CalendarPlus,
  Pencil,
  Trash2,
  MapPin,
  X,
  ClipboardCheck,
  Apple,
  Utensils,
  Clock,
  Plane,
  Bed,
  ChevronUp,
  Target,
  CloudSun,
  BatteryLow,
  Repeat,
  SlidersHorizontal,
} from "lucide-angular";
import {
  provideClientHydration,
  withNoIncrementalHydration,
} from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import {
  NavigationEnd,
  Router,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from "@angular/router";
import {
  SwUpdate,
  type VersionReadyEvent,
  provideServiceWorker,
} from "@angular/service-worker";
import { filter, take } from "rxjs";
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
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

    // Lucide icons (the locked icon set — registered once, used app-wide via
    // <lucide-icon name="…">). Add new glyphs here as screens are ported.
    importProvidersFrom(
      LucideAngularModule.pick({
        Home,
        Dumbbell,
        HeartPulse,
        LineChart,
        Menu,
        Plus,
        Bell,
        Flag,
        Cloud,
        CloudRain,
        RefreshCw,
        Play,
        Info,
        Pill,
        ArrowUpRight,
        ChevronDown,
        ChevronRight,
        Droplet,
        Moon,
        Activity,
        ShieldAlert,
        Ban,
        ClipboardList,
        BadgeCheck,
        TestTube,
        AlertTriangle,
        CircleAlert,
        Circle,
        Check,
        Coffee,
        ShieldHalf,
        Trophy,
        Users,
        MessageCircle,
        BarChart3,
        Sparkles,
        BookOpen,
        FileText,
        User,
        Medal,
        Flame,
        Settings,
        Camera,
        Lock,
        LogOut,
        Sun,
        TrendingUp,
        Video,
        Mail,
        ThumbsUp,
        ThumbsDown,
        Calendar,
        CalendarPlus,
        Pencil,
        Trash2,
        MapPin,
        X,
        ClipboardCheck,
        Apple,
        Utensils,
        Clock,
        Plane,
        Bed,
        ChevronUp,
        Target,
        CloudSun,
        BatteryLow,
        Repeat,
        SlidersHorizontal,
      }),
    ),

    // Angular 21+: Zoneless is the default change-detection mode.
    // Explicitly enabling stable experimental zoneless for performance.
    provideZonelessChangeDetection(),

    ...(environment.devtools.hydration
      ? [provideClientHydration(withNoIncrementalHydration())]
      : []),

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
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            transition.skipTransition();
          }
        },
      }),
    ),

    /** Onboarding step transitions; component micro-motion is handled in CSS. */
    provideAnimations(),

    provideHttpClient(
      withFetch(), // Angular 21: Use fetch API for better performance and streaming support
      withInterceptors([
        authInterceptor,
        retryInterceptor, // Retry transient network errors with exponential backoff
        cacheInterceptor,
        errorInterceptor,
      ]),
    ),
    // CRITICAL SERVICES: Only register services needed at startup
    AuthAwarePreloadStrategy, // Register the preloading strategy

    // Error tracking and monitoring (Sentry integration)
    { provide: ErrorHandler, useClass: AngularGlobalErrorHandler },

    // Service Worker for PWA support (offline caching, push notifications, Background Sync)
    // custom-sw.js wraps the NGSW worker and adds the 'flagfit-offline-queue' sync handler.
    // PERFORMANCE: Delay registration to not block initial render.
    provideServiceWorker("custom-sw.js", {
      enabled: environment.production,
      registrationStrategy: "registerWhenStable:30000", // Register after app is stable or 30s
    }),
    // STALE-BUNDLE GUARD (2026-07-15 production bug): a real player ran a
    // month-old cached bundle — NGSW stages new versions in the background but
    // the RUNNING app keeps the old one until a true cold start, and nothing
    // ever prompted one. Two mechanisms:
    //  1. VERSION_READY → reload at the next route change (a natural boundary
    //     — never yanks a form out from under the athlete mid-entry).
    //  2. Long-lived tabs (the actual failure mode: a phone tab suspended for
    //     weeks) → re-check for updates whenever the tab becomes visible.
    provideAppInitializer(() => {
      const swUpdate = inject(SwUpdate);
      const router = inject(Router);
      if (!swUpdate.isEnabled) return;
      swUpdate.versionUpdates
        .pipe(
          filter((e): e is VersionReadyEvent => e.type === "VERSION_READY"),
          take(1),
        )
        .subscribe(() => {
          router.events
            .pipe(
              filter((e) => e instanceof NavigationEnd),
              take(1),
            )
            .subscribe(() => document.location.reload());
        });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void swUpdate.checkForUpdate();
        }
      });
    }),
    { provide: LOGGER, useClass: ConsoleLoggerAdapter },
  ],
};
