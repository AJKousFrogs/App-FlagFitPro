import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { filter, map, startWith } from "rxjs/operators";
import { LucideAngularModule } from "lucide-angular";
import { BillingService } from "../core/services/billing.service";
import { FreezeSignalService } from "../core/services/freeze-signal.service";

/**
 * App shell — the persistent chrome around every screen.
 *
 * Responsive: a centered phone column with a 5-tab bottom nav + quick-log FAB on
 * phones/tablets, and a fixed left sidebar nav beside a wide content region on
 * desktop (≥1024px). The same five destinations (Today / Training / Wellness /
 * Stats / More) appear in both; CSS shows whichever fits the viewport. Screens
 * render into the <router-outlet> inside .app-main. Visual classes
 * (.app-shell/.app-main/.sidebar/.tabbar/.fab) come from the locked global
 * component vocabulary (scss/system) so they stay token-driven.
 */
@Component({
  selector: "app-shell",
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell">
      @if (freeze.locked()) {
        <div class="frozen-banner" [class.flash]="justFlashed()" role="status">
          <lucide-icon name="lock" aria-hidden="true" />
          <span>
            @if (billing.status()?.tier === "suspended") {
              Your last payment didn't go through — everything's frozen until
              it's fixed.
            } @else {
              Your 7-day trial has ended — everything you entered is safe,
              but you're view-only until you subscribe.
            }
          </span>
          <a class="btn primary sm" routerLink="/billing">Subscribe</a>
        </div>
      }

      <!-- desktop-only sidebar (hidden ≤1023px via CSS) -->
      <nav class="sidebar" aria-label="Primary">
        <a class="brand" routerLink="/today" aria-label="FlagFit Pro — Today">
          <lucide-icon name="flag" />FlagFit
        </a>
        <a
          class="navlink"
          routerLink="/today"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="home" />Today
        </a>
        <a
          class="navlink"
          routerLink="/training"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="dumbbell" />Training
        </a>
        <a
          class="navlink"
          routerLink="/wellness"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="heart-pulse" />Wellness
        </a>
        <a
          class="navlink"
          routerLink="/stats"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="line-chart" />Stats
        </a>
        <a
          class="navlink"
          routerLink="/more"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="menu" />More
        </a>
        <a class="btn primary block sidebar-cta" routerLink="/wellness">
          <lucide-icon name="plus" />Log check-in
        </a>
      </nav>

      <div class="app-main">
        <router-outlet />
      </div>

      <!-- phone/tablet quick-log FAB (hidden ≥1024px via CSS).
           Context-aware: on the schedule/training screens it adds an event;
           elsewhere it opens the daily wellness check-in. -->
      <a class="fab" [routerLink]="fab().link" [attr.aria-label]="fab().label">
        <lucide-icon [name]="fab().icon" />
      </a>

      <!-- phone/tablet bottom tab bar (hidden ≥1024px via CSS) -->
      <nav class="tabbar" aria-label="Primary">
        <a
          routerLink="/today"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="home" />Today
        </a>
        <a
          routerLink="/training"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="dumbbell" />Training
        </a>
        <a
          routerLink="/wellness"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="heart-pulse" />Wellness
        </a>
        <a
          routerLink="/stats"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="line-chart" />Stats
        </a>
        <a
          routerLink="/more"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
        >
          <lucide-icon name="menu" />More
        </a>
      </nav>
    </div>
  `,
})
export class ShellComponent {
  private readonly router = inject(Router);
  protected readonly billing = inject(BillingService);
  protected readonly freeze = inject(FreezeSignalService);

  /** True for ~700ms after every refused write, re-triggering the frozen
   * banner's attention animation even if it was already showing. */
  readonly justFlashed = signal(false);

  constructor() {
    // Populate billing status once so the frozen banner has real data from
    // the first render, not only after the first refused write.
    if (!this.billing.status()) {
      void this.billing.loadStatus();
    }

    effect(() => {
      if (this.freeze.flashTrigger() === 0) {
        return;
      }
      this.justFlashed.set(true);
      setTimeout(() => this.justFlashed.set(false), 700);
    });
  }

  /** Current URL as a signal, updated on every navigation. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Context-aware FAB action. Schedule/Training → add event; else → check-in. */
  readonly fab = computed(() => {
    const u = this.url();
    if (u.startsWith("/schedule") || u.startsWith("/training")) {
      return {
        link: "/schedule",
        label: "Add a schedule event",
        icon: "calendar-plus",
      };
    }
    return { link: "/wellness", label: "Log today's check-in", icon: "plus" };
  });
}
