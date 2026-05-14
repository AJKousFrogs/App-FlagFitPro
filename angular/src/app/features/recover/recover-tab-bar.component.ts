import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Event as RouterEvent } from "@angular/router";
import { filter, map, startWith } from "rxjs";
import { SupabaseService } from "../../core/services/supabase.service";

/**
 * Recover surface tab bar. Ties Wellness / Sleep / Workload (ACWR) /
 * Cycle Tracking / Return-to-Play together as one "Recover" surface per
 * the Phase 0.5 IA collapse. Drop this widget at the top of each
 * underlying page; it derives the active tab from the current URL and
 * hides the Cycle tab unless the signed-in user qualifies (matching the
 * femaleAthleteGuard on the underlying route).
 */
interface RecoverTab {
  label: string;
  route: string;
  icon: string;
  femaleAthleteOnly?: boolean;
}

const RECOVER_TABS: readonly RecoverTab[] = [
  { label: "Wellness",    route: "/wellness",       icon: "pi-heart" },
  { label: "Sleep",       route: "/sleep-debt",     icon: "pi-moon" },
  { label: "Workload",    route: "/acwr",           icon: "pi-gauge" },
  { label: "Cycle",       route: "/cycle-tracking", icon: "pi-circle", femaleAthleteOnly: true },
  { label: "Return to Play", route: "/return-to-play", icon: "pi-replay" },
];

@Component({
  selector: "app-recover-tab-bar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="recover-tab-bar" aria-label="Recover sections">
      @for (tab of tabs(); track tab.route) {
        <a
          class="recover-tab-bar__tab"
          [routerLink]="tab.route"
          routerLinkActive="recover-tab-bar__tab--active"
          [routerLinkActiveOptions]="{ exact: true }"
          [attr.aria-current]="isActive(tab.route) ? 'page' : null"
        >
          <i class="pi" [class]="tab.icon" aria-hidden="true"></i>
          <span>{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: "./recover-tab-bar.component.scss",
})
export class RecoverTabBarComponent {
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

  private readonly isFemaleAthlete = computed(() => {
    const meta = this.supabase.currentUser()?.user_metadata as
      | { sex?: string; gender?: string }
      | undefined;
    const value = (meta?.sex ?? meta?.gender ?? "").toLowerCase();
    return value === "female" || value === "f";
  });

  readonly tabs = computed<readonly RecoverTab[]>(() => {
    const showCycle = this.isFemaleAthlete();
    return RECOVER_TABS.filter((tab) => !tab.femaleAthleteOnly || showCycle);
  });

  isActive(route: string): boolean {
    return this.currentUrl().split("?")[0] === route;
  }
}
