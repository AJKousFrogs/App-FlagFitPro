import {
  ANIMATION_MODULE_TYPE,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterOutlet,
} from "@angular/router";
import { CookieConsentBannerComponent } from "./shared/components/cookie-consent-banner/cookie-consent-banner.component";
import { DeferredFeedbackStylesComponent } from "./shared/components/deferred-feedback-styles/deferred-feedback-styles.component";
import { DeferredGlobalStylesComponent } from "./shared/components/deferred-global-styles/deferred-global-styles.component";
import { LoadingOverlayComponent } from "./shared/components/loading-overlay/loading-overlay.component";
import { SkipToContentComponent } from "./shared/components/skip-to-content/skip-to-content.component";
import { ConfirmDialog } from "primeng/confirmdialog";
import { filter, map, startWith } from "rxjs";
import { ToastComponent } from "./shared/components/toast/toast.component";
import { CookieConsentService } from "./core/services/cookie-consent.service";
import { ThemeService } from "./core/services/theme.service";

type RouteEntry =
  | "deeplink"
  | "hub"
  | "internal"
  | "legacy"
  | "public"
  | null;

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SkipToContentComponent,
    CookieConsentBannerComponent,
    DeferredFeedbackStylesComponent,
    DeferredGlobalStylesComponent,
    LoadingOverlayComponent,
    ConfirmDialog,
    ToastComponent,
  ],
  template: `
    <app-skip-to-content />
    <main
      id="main-content"
      tabindex="-1"
      [@.disabled]="animationsDisabled()"
    >
      <router-outlet></router-outlet>
    </main>
    @if (shouldLoadDeferredGlobalStyles()) {
      @defer (on timer(300ms)) {
        <app-deferred-global-styles />
      }
    }
    @defer (when shouldLoadDeferredFeedbackStyles()) {
      <app-deferred-feedback-styles />
    }
    @defer (when shouldLoadCookieBanner()) {
      <app-cookie-consent-banner />
    }
    <app-loading-overlay />
    @defer (on idle) {
      <p-confirmDialog></p-confirmDialog>
      <!-- UX AUDIT FIX: Global toast component - prevents duplicate toasts across components -->
      <app-toast position="top-right" [preventDuplicates]="true"></app-toast>
    }
  `,
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  private readonly animationModuleType = inject(ANIMATION_MODULE_TYPE, {
    optional: true,
  });
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly cookieConsentService = inject(CookieConsentService);
  private readonly prefersReducedMotion = signal(false);
  private readonly currentUrlPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.getCurrentUrlPath()),
      startWith(this.getCurrentUrlPath()),
    ),
    { initialValue: this.getCurrentUrlPath() },
  );
  private readonly activeRouteEntry = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.getCurrentRouteEntry()),
      startWith(this.getCurrentRouteEntry()),
    ),
    { initialValue: this.getCurrentRouteEntry() },
  );
  private readonly cookieBannerReady = signal(false);
  private readonly feedbackStylesReady = signal(false);
  private cookieBannerTimer: ReturnType<typeof window.setTimeout> | null = null;
  private feedbackStylesTimer: ReturnType<typeof window.setTimeout> | null = null;

  readonly animationsDisabled = computed(
    () =>
      this.prefersReducedMotion() ||
      this.animationModuleType === "NoopAnimations",
  );
  readonly isLandingRoute = computed(() => this.currentUrlPath() === "/");
  readonly shouldLoadDeferredGlobalStyles = computed(() => {
    const entry = this.activeRouteEntry();
    return entry === "hub" || entry === "internal";
  });
  readonly shouldLoadDeferredFeedbackStyles = computed(
    () => this.feedbackStylesReady(),
  );
  readonly shouldLoadCookieBanner = computed(
    () =>
      this.cookieBannerReady() && this.cookieConsentService.showBanner(),
  );

  // Side-effect: ensures ThemeService initializes on bootstrap so theme (light/dark) applies before first paint
  private readonly _themeService = inject(ThemeService);

  constructor() {
    this.applyPlatformClasses();
    this.initReducedMotionPreference();
    this.initFeedbackStylesScheduling();
    this.initCookieBannerScheduling();
  }

  private applyPlatformClasses(): void {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform?.toLowerCase() ?? "";
    const isIOS = /iphone|ipad|ipod/.test(ua) ||
      (platform.includes("mac") && window.navigator.maxTouchPoints > 1);
    const isAndroid = ua.includes("android");
    const isMobile = /mobile|android|iphone|ipod/i.test(ua);
    const isTablet = /ipad|android(?!.*mobile)/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/chrome|chromium|crios|edg/i.test(ua);
    const isChrome = /chrome|chromium|crios/i.test(ua) && !/edg/i.test(ua);

    const classes: string[] = [];
    if (isIOS) classes.push("platform-ios");
    if (isAndroid) classes.push("platform-android");
    if (isMobile) classes.push("platform-mobile");
    if (isTablet) classes.push("platform-tablet");
    if (isSafari) classes.push("browser-safari");
    if (isChrome) classes.push("browser-chrome");

    if (classes.length > 0) {
      document.body.classList.add(...classes);
    }
  }

  private initReducedMotionPreference(): void {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.prefersReducedMotion.set(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      this.prefersReducedMotion.set(event.matches);
    };
    mediaQuery.addEventListener("change", onChange);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener("change", onChange));
  }

  private initCookieBannerScheduling(): void {
    this.destroyRef.onDestroy(() => this.clearCookieBannerTimer());

    effect(() => {
      const entry = this.activeRouteEntry();
      const shouldShowBanner = this.cookieConsentService.showBanner();

      if (!shouldShowBanner) {
        this.clearCookieBannerTimer();
        this.cookieBannerReady.set(false);
        return;
      }

      if (this.cookieBannerReady()) {
        return;
      }

      this.scheduleCookieBanner(entry);
    });
  }

  private initFeedbackStylesScheduling(): void {
    this.destroyRef.onDestroy(() => this.clearFeedbackStylesTimer());

    effect(() => {
      if (this.feedbackStylesReady()) {
        return;
      }

      if (!this.isLandingRoute()) {
        this.clearFeedbackStylesTimer();
        this.feedbackStylesReady.set(true);
        return;
      }

      if (typeof window === "undefined") {
        return;
      }

      this.clearFeedbackStylesTimer();
      this.feedbackStylesTimer = window.setTimeout(() => {
        this.feedbackStylesReady.set(true);
        this.feedbackStylesTimer = null;
      }, 2200);
    });
  }

  private scheduleCookieBanner(entry: RouteEntry): void {
    if (typeof window === "undefined") {
      return;
    }

    this.clearCookieBannerTimer();

    const delay = entry === "hub" || entry === "internal" ? 2500 : 4500;
    this.cookieBannerTimer = window.setTimeout(() => {
      this.cookieBannerReady.set(true);
      this.cookieBannerTimer = null;
    }, delay);
  }

  private clearCookieBannerTimer(): void {
    if (this.cookieBannerTimer === null) {
      return;
    }

    clearTimeout(this.cookieBannerTimer);
    this.cookieBannerTimer = null;
  }

  private clearFeedbackStylesTimer(): void {
    if (this.feedbackStylesTimer === null) {
      return;
    }

    clearTimeout(this.feedbackStylesTimer);
    this.feedbackStylesTimer = null;
  }

  private getCurrentRouteEntry(): RouteEntry {
    let snapshot: ActivatedRouteSnapshot | null = this.router.routerState
      .snapshot.root;
    let entry: RouteEntry = null;

    while (snapshot) {
      const currentEntry = snapshot.data["entry"];
      if (typeof currentEntry === "string") {
        entry = currentEntry as RouteEntry;
      }
      snapshot = snapshot.firstChild ?? null;
    }

    return entry;
  }

  private getCurrentUrlPath(): string {
    const [pathWithHash] = this.router.url.split("?");
    const [path] = pathWithHash.split("#");
    return path || "/";
  }
}
