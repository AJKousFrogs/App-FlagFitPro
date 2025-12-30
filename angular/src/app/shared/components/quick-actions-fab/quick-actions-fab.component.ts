import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
  OnInit,
  OnDestroy,
} from "@angular/core";

import { Router, NavigationEnd } from "@angular/router";
import { SpeedDialModule } from "primeng/speeddial";
import { TooltipModule } from "primeng/tooltip";
import { MenuItem } from "primeng/api";
import { filter, Subscription } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";

@Component({
  selector: "app-quick-actions-fab",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpeedDialModule, TooltipModule],
  template: `
    @if (showFAB()) {
      <div class="quick-actions-container" [class.expanded]="isExpanded()">
        <p-speedDial
          [model]="quickActions()"
          direction="up"
          [transitionDelay]="80"
          buttonClassName="p-button-lg p-button-rounded p-button-primary fab-button"
          [mask]="true"
          [maskClassName]="'quick-actions-mask'"
          (onClick)="toggleExpanded()"
          (onShow)="isExpanded.set(true)"
          (onHide)="isExpanded.set(false)"
        ></p-speedDial>
      </div>
    }
  `,
  styles: [
    `
      .quick-actions-container {
        position: fixed;
        bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
        right: 24px;
        z-index: 1000;
      }

      :host ::ng-deep .quick-actions-mask {
        background: rgba(0, 0, 0, 0.4);
        -webkit-backdrop-filter: blur(4px);
        backdrop-filter: blur(4px);
      }

      :host ::ng-deep .fab-button {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%);
        border: none;
        box-shadow: 0 4px 16px rgba(8, 153, 73, 0.35);
        transition: all 0.3s ease;
      }

      :host ::ng-deep .fab-button:hover {
        transform: scale(1.08) rotate(45deg);
        box-shadow: 0 6px 20px rgba(8, 153, 73, 0.5);
      }

      :host ::ng-deep .p-speeddial-action {
        background: var(--surface-primary);
        border: 1px solid var(--p-surface-200);
        width: 44px;
        height: 44px;
        color: var(--color-brand-primary);
        box-shadow: var(--shadow-md);
        transition: all 0.2s ease;
      }

      :host ::ng-deep .p-speeddial-action:hover {
        background: var(--color-brand-light);
        border-color: var(--color-brand-primary);
        transform: scale(1.1);
      }

      :host ::ng-deep .p-speeddial-action .p-speeddial-action-icon {
        font-size: 1rem;
      }

      :host ::ng-deep .p-speeddial-list {
        gap: 8px;
      }

      /* Hide on mobile - bottom nav handles navigation */
      @media (max-width: 768px) {
        .quick-actions-container {
          display: none;
        }
      }
    `,
  ],
})
export class QuickActionsFABComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private routerSub?: Subscription;

  isExpanded = signal(false);
  currentRoute = signal("");

  // Routes where FAB should be hidden
  private hiddenRoutes = ["/login", "/register", "/reset-password", "/update-password", "/", "/onboarding"];

  showFAB = computed(() => {
    const route = this.currentRoute();
    const isAuthenticated = this.authService.isAuthenticated();
    return isAuthenticated && !this.hiddenRoutes.some(r => route === r || route.startsWith("/auth"));
  });

  // Context-aware quick actions based on current route
  quickActions = computed<MenuItem[]>(() => {
    const route = this.currentRoute();
    const userRole = this.authService.getUser()?.role || "player";
    
    // Base actions available everywhere
    const baseActions: MenuItem[] = [
      {
        icon: "pi pi-play",
        label: "Start Training",
        tooltipOptions: { tooltipLabel: "Start Training", tooltipPosition: "left" },
        command: () => this.navigateTo("/training"),
      },
    ];

    // Route-specific actions
    if (route.startsWith("/training")) {
      return [
        {
          icon: "pi pi-clock",
          label: "Rest Timer",
          tooltipOptions: { tooltipLabel: "Rest Timer", tooltipPosition: "left" },
          command: () => this.openRestTimer(),
        },
        {
          icon: "pi pi-calendar",
          label: "Schedule",
          tooltipOptions: { tooltipLabel: "View Schedule", tooltipPosition: "left" },
          command: () => this.navigateTo("/training"),
        },
        {
          icon: "pi pi-chart-line",
          label: "Stats",
          tooltipOptions: { tooltipLabel: "View Stats", tooltipPosition: "left" },
          command: () => this.navigateTo("/analytics"),
        },
      ];
    }

    if (route.startsWith("/roster")) {
      const actions: MenuItem[] = [
        {
          icon: "pi pi-chart-bar",
          label: "Team Stats",
          tooltipOptions: { tooltipLabel: "Team Stats", tooltipPosition: "left" },
          command: () => this.navigateTo("/analytics"),
        },
      ];
      
      if (userRole === "coach" || userRole === "admin") {
        actions.unshift({
          icon: "pi pi-user-plus",
          label: "Add Player",
          tooltipOptions: { tooltipLabel: "Add Player", tooltipPosition: "left" },
          command: () => this.navigateTo("/roster"),
        });
      }
      
      return actions;
    }

    if (route.startsWith("/analytics")) {
      return [
        {
          icon: "pi pi-download",
          label: "Export",
          tooltipOptions: { tooltipLabel: "Export Report", tooltipPosition: "left" },
          command: () => this.exportReport(),
        },
        {
          icon: "pi pi-share-alt",
          label: "Share",
          tooltipOptions: { tooltipLabel: "Share Dashboard", tooltipPosition: "left" },
          command: () => this.shareDashboard(),
        },
        ...baseActions,
      ];
    }

    if (route.startsWith("/game-tracker")) {
      return [
        {
          icon: "pi pi-plus",
          label: "New Game",
          tooltipOptions: { tooltipLabel: "Start New Game", tooltipPosition: "left" },
          command: () => this.navigateTo("/game-tracker"),
        },
        {
          icon: "pi pi-chart-line",
          label: "Stats",
          tooltipOptions: { tooltipLabel: "Game Stats", tooltipPosition: "left" },
          command: () => this.navigateTo("/analytics"),
        },
      ];
    }

    if (route.startsWith("/wellness")) {
      return [
        {
          icon: "pi pi-plus",
          label: "Log Wellness",
          tooltipOptions: { tooltipLabel: "Log Wellness Check", tooltipPosition: "left" },
          command: () => this.navigateTo("/wellness"),
        },
        {
          icon: "pi pi-chart-line",
          label: "Trends",
          tooltipOptions: { tooltipLabel: "View Trends", tooltipPosition: "left" },
          command: () => this.navigateTo("/analytics"),
        },
      ];
    }

    // Default dashboard actions
    return [
      ...baseActions,
      {
        icon: "pi pi-clock",
        label: "Log Session",
        tooltipOptions: { tooltipLabel: "Log Training Session", tooltipPosition: "left" },
        command: () => this.navigateTo("/performance-tracking"),
      },
      {
        icon: "pi pi-chart-line",
        label: "Quick Stats",
        tooltipOptions: { tooltipLabel: "View Analytics", tooltipPosition: "left" },
        command: () => this.navigateTo("/analytics"),
      },
      {
        icon: "pi pi-heart",
        label: "Wellness",
        tooltipOptions: { tooltipLabel: "Log Wellness", tooltipPosition: "left" },
        command: () => this.navigateTo("/wellness"),
      },
    ];
  });

  ngOnInit(): void {
    this.currentRoute.set(this.router.url);
    
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentRoute.set((event as NavigationEnd).urlAfterRedirects);
        this.isExpanded.set(false);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleExpanded(): void {
    this.isExpanded.update((val) => !val);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isExpanded.set(false);
  }

  openRestTimer(): void {
    // This would ideally emit an event to open the rest timer component
    // For now, we'll just navigate to training
    this.navigateTo("/training");
  }

  exportReport(): void {
    // Trigger export functionality
    this.logger.info("Export report");
    this.isExpanded.set(false);
  }

  shareDashboard(): void {
    // Trigger share functionality
    if (navigator.share) {
      navigator.share({
        title: "FlagFit Pro Analytics",
        text: "Check out my training analytics!",
        url: window.location.href,
      });
    }
    this.isExpanded.set(false);
  }
}
