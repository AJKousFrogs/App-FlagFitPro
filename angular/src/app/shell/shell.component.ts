import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

/**
 * App shell — the persistent chrome around every screen.
 *
 * Renders the centered mobile column, the 5-tab bottom nav (Today / Training /
 * Wellness / Stats / More) and the quick-log FAB; screens render into the
 * <router-outlet>. Visual classes (.app-shell/.tabbar/.fab) come from the locked
 * global component vocabulary (scss/system) so they stay token-driven and the
 * global Lucide sizing applies. Built from the approved hi-fi shell.
 */
@Component({
  selector: "app-shell",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell">
      <router-outlet />

      <button class="fab" type="button" aria-label="Quick log">
        <lucide-icon name="plus" />
      </button>

      <nav class="tabbar" aria-label="Primary">
        <a routerLink="/today" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="home" />Today
        </a>
        <a routerLink="/training" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="dumbbell" />Training
        </a>
        <a routerLink="/wellness" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="heart-pulse" />Wellness
        </a>
        <a routerLink="/stats" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="line-chart" />Stats
        </a>
        <a routerLink="/more" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="menu" />More
        </a>
      </nav>
    </div>
  `,
})
export class ShellComponent {}
