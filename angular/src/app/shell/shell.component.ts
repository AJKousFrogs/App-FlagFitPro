import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

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
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell">
      <!-- desktop-only sidebar (hidden ≤1023px via CSS) -->
      <nav class="sidebar" aria-label="Primary">
        <a class="brand" routerLink="/today" aria-label="FlagFit Pro — Today">
          <lucide-icon name="flag" />FlagFit
        </a>
        <a class="navlink" routerLink="/today" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="home" />Today
        </a>
        <a class="navlink" routerLink="/training" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="dumbbell" />Training
        </a>
        <a class="navlink" routerLink="/wellness" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="heart-pulse" />Wellness
        </a>
        <a class="navlink" routerLink="/stats" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="line-chart" />Stats
        </a>
        <a class="navlink" routerLink="/more" routerLinkActive="active" ariaCurrentWhenActive="page">
          <lucide-icon name="menu" />More
        </a>
        <a class="btn primary block sidebar-cta" routerLink="/wellness">
          <lucide-icon name="plus" />Log check-in
        </a>
      </nav>

      <div class="app-main">
        <router-outlet />
      </div>

      <!-- phone/tablet quick-log FAB (hidden ≥1024px via CSS) -->
      <a class="fab" routerLink="/wellness" aria-label="Log today's check-in">
        <lucide-icon name="plus" />
      </a>

      <!-- phone/tablet bottom tab bar (hidden ≥1024px via CSS) -->
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
