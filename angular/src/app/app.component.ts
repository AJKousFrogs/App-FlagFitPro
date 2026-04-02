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
import { RouterOutlet } from "@angular/router";
import { CookieConsentBannerComponent } from "./shared/components/cookie-consent-banner/cookie-consent-banner.component";
import { DeferredFeedbackStylesComponent } from "./shared/components/deferred-feedback-styles/deferred-feedback-styles.component";
import { DeferredGlobalStylesComponent } from "./shared/components/deferred-global-styles/deferred-global-styles.component";
import { LoadingOverlayComponent } from "./shared/components/loading-overlay/loading-overlay.component";
import { SkipToContentComponent } from "./shared/components/skip-to-content/skip-to-content.component";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ToastComponent } from "./shared/components/toast/toast.component";
import { CookieConsentService } from "./core/services/cookie-consent.service";
import { MotionPreferencesService } from "./core/services/motion-preferences.service";
import { RouteEntry, RouteShellService } from "./core/services/route-shell.service";
import { ThemeService } from "./core/services/theme.service";
import { ensurePrimeIconsStylesheet } from "./core/utils/primeicons-loader";
import {
  routeAnimations,
  getRouteAnimationState,
} from "./core/animations/route-animations";

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
  animations: [routeAnimations],
  template: `
    <app-skip-to-content />
    <main
      id="main-content"
      tabindex="-1"
      [@.disabled]="animationsDisabled()"
      [@routeAnimations]="getRouteAnimationState(outlet)"
    >
      <router-outlet #outlet="outlet"></router-outlet>
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
  private readonly cookieConsentService = inject(CookieConsentService);
  private readonly motionPreferencesService = inject(MotionPreferencesService);
  private readonly routeShell = inject(RouteShellService);
  private readonly prefersReducedMotion = signal(false);
  private readonly cookieBannerReady = signal(false);
  private readonly feedbackStylesReady = signal(false);
  private cookieBannerTimer: number | null = null;
  private feedbackStylesTimer: number | null = null;

  readonly animationsDisabled = computed(
    () =>
      this.prefersReducedMotion() ||
      this.animationModuleType === "NoopAnimations",
  );
  readonly isLandingRoute = computed(() => this.routeShell.currentPath() === "/");
  readonly shouldLoadDeferredGlobalStyles = computed(() => {
    const entry = this.routeShell.entry();
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
    this.syncRouteClasses();
    this.initPrimeIconsLoading();
    this.motionPreferencesService.watchReducedMotion(
      (prefersReducedMotion) =>
        this.prefersReducedMotion.set(prefersReducedMotion),
      this.destroyRef,
    );
    this.initFeedbackStylesScheduling();
    this.initCookieBannerScheduling();
  }

  /**
   * Gets animation state for route transitions
   * Used by [@routeAnimations] trigger in template
   */
  getRouteAnimationState(outlet: RouterOutlet): string {
    return getRouteAnimationState(outlet);
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

  private initPrimeIconsLoading(): void {
    effect(() => {
      if (!this.isLandingRoute()) {
        ensurePrimeIconsStylesheet();
      }
    });
  }

  private syncRouteClasses(): void {
    effect(() => {
      if (typeof document === "undefined") {
        return;
      }

      document.documentElement.classList.toggle(
        "route-landing",
        this.isLandingRoute(),
      );
    });
  }

  private initCookieBannerScheduling(): void {
    this.destroyRef.onDestroy(() => this.clearCookieBannerTimer());

    effect(() => {
      const entry = this.routeShell.entry();
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

    window.clearTimeout(this.cookieBannerTimer);
    this.cookieBannerTimer = null;
  }

  private clearFeedbackStylesTimer(): void {
    if (this.feedbackStylesTimer === null) {
      return;
    }

    window.clearTimeout(this.feedbackStylesTimer);
    this.feedbackStylesTimer = null;
  }
}
