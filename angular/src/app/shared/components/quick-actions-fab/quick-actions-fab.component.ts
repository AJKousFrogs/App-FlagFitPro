import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";

import { Router } from "@angular/router";
import { SpeedDial } from "primeng/speeddial";
import { ROUTES } from "../../../core/constants/app.constants";
import { isCoachNavigationRole } from "../../../core/navigation/app-navigation.config";
import { RouteShellService } from "../../../core/services/route-shell.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import type { MenuItem } from "primeng/api";

@Component({
  selector: "app-quick-actions-fab",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpeedDial],
  template: `
    @if (showFAB()) {
      <p-speedDial [model]="menuItems()" direction="up" [radius]="80" type="semi-circle" />
    }
  `,
  styleUrl: "./quick-actions-fab.component.scss",
})
export class QuickActionsFABComponent {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly routeShell = inject(RouteShellService);

  showFAB = computed(() => {
    const isAuthenticated = this.supabase.isAuthenticated();
    return isAuthenticated && this.routeShell.showFab();
  });

  private readonly currentUserRole = computed(() => {
    const metadata = this.supabase.currentUser()?.user_metadata as
      | { role?: string }
      | undefined;
    return metadata?.role;
  });

  readonly menuItems = computed<MenuItem[]>(() => {
    const role = this.currentUserRole();

    if (isCoachNavigationRole(role)) {
      return [
        {
          icon: "pi pi-comments",
          label: "Merlin AI Chat",
          command: () => this.router.navigate(["/chat"]),
        },
        {
          icon: "pi pi-users",
          label: "Open Roster",
          command: () => this.router.navigate(["/roster"]),
        },
        {
          icon: "pi pi-chart-line",
          label: "Team Performance",
          command: () => this.router.navigate(["/coach/analytics"]),
        },
        {
          icon: "pi pi-sitemap",
          label: "Program Builder",
          command: () => this.router.navigate(["/coach/program-builder"]),
        },
        {
          icon: "pi pi-briefcase",
          label: "Team Workspace",
          command: () => this.router.navigate(["/team/workspace"]),
        },
      ];
    }

    return [
      {
        icon: "pi pi-comments",
        label: "Merlin AI Chat",
        command: () => this.router.navigate(["/chat"]),
      },
      {
        icon: "pi pi-heart",
        label: "Log Wellness",
        command: () => this.router.navigate(["/wellness"]),
      },
      {
        icon: "pi pi-chart-line",
        label: "View Analytics",
        command: () => this.router.navigate(["/performance/insights"]),
      },
      {
        icon: "pi pi-bolt",
        label: "Start Training",
        command: () => this.router.navigate(["/training"]),
      },
      {
        icon: "pi pi-play",
        label: "Today's Practice",
        command: () => this.router.navigate([ROUTES.TODAY]),
      },
    ];
  });
}
