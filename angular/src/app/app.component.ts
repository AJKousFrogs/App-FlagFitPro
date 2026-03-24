import {
  ANIMATION_MODULE_TYPE,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CookieConsentBannerComponent } from "./shared/components/cookie-consent-banner/cookie-consent-banner.component";
import { DeferredGlobalStylesComponent } from "./shared/components/deferred-global-styles/deferred-global-styles.component";
import { LoadingOverlayComponent } from "./shared/components/loading-overlay/loading-overlay.component";
import { SkipToContentComponent } from "./shared/components/skip-to-content/skip-to-content.component";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ToastComponent } from "./shared/components/toast/toast.component";
import { ThemeService } from "./core/services/theme.service";

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SkipToContentComponent,
    CookieConsentBannerComponent,
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
    @defer (on timer(300ms)) {
      <app-deferred-global-styles />
    }
    @defer (on timer(1800ms)) {
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
  private readonly prefersReducedMotion = signal(false);

  readonly animationsDisabled = computed(
    () =>
      this.prefersReducedMotion() ||
      this.animationModuleType === "NoopAnimations",
  );

  // Side-effect: ensures ThemeService initializes on bootstrap so theme (light/dark) applies before first paint
  private readonly _themeService = inject(ThemeService);

  constructor() {
    this.applyPlatformClasses();
    this.initReducedMotionPreference();
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
  }
}
