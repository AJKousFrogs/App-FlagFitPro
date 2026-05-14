import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Event as RouterEvent } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { isCoachNavigationRole } from "../../core/navigation/app-navigation.config";
import { SupabaseService } from "../../core/services/supabase.service";

/**
 * Insights surface tab bar. Renders the cross-tab navigation that ties
 * Analytics / Tests / Reports / Team Insights together as one "Insights"
 * surface per the Phase 0.5 IA collapse. Drop this widget at the top of
 * each underlying page; it derives the active tab from the current URL
 * and the variant from the signed-in user's role (override via [variant]).
 */
export type InsightsTabVariant = "athlete" | "coach" | "auto";

interface InsightsTab {
  label: string;
  route: string;
  icon: string;
}

const ATHLETE_TABS: readonly InsightsTab[] = [
  { label: "Performance", route: "/performance/insights", icon: "pi-chart-line" },
  { label: "Tests",       route: "/performance/tests",    icon: "pi-stopwatch" },
  { label: "Reports",     route: "/reports",              icon: "pi-chart-bar" },
];

const COACH_TABS: readonly InsightsTab[] = [
  { label: "Team",        route: "/coach/analytics",      icon: "pi-chart-line" },
  { label: "Reports",     route: "/reports",              icon: "pi-chart-bar" },
  { label: "Player Tests", route: "/performance/tests",   icon: "pi-stopwatch" },
];

@Component({
  selector: "app-insights-tab-bar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="insights-tab-bar" aria-label="Insights sections">
      @for (tab of tabs(); track tab.route) {
        <a
          class="insights-tab-bar__tab"
          [routerLink]="tab.route"
          routerLinkActive="insights-tab-bar__tab--active"
          [routerLinkActiveOptions]="{ exact: true }"
          [attr.aria-current]="isActive(tab.route) ? 'page' : null"
        >
          <i class="pi" [class]="tab.icon" aria-hidden="true"></i>
          <span>{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: "./insights-tab-bar.component.scss",
})
export class InsightsTabBarComponent {
  readonly variant = input<InsightsTabVariant>("auto");

  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly resolvedVariant = computed<"athlete" | "coach">(() => {
    const requested = this.variant();
    if (requested !== "auto") return requested;
    const role = (this.supabase.currentUser()?.user_metadata as { role?: string } | undefined)?.role;
    return isCoachNavigationRole(role) ? "coach" : "athlete";
  });

  readonly tabs = computed<readonly InsightsTab[]>(() =>
    this.resolvedVariant() === "coach" ? COACH_TABS : ATHLETE_TABS,
  );

  isActive(route: string): boolean {
    return this.currentUrl().split("?")[0] === route;
  }
}
