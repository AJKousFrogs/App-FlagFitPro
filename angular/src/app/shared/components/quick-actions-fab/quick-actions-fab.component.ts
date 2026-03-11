import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";

import { NavigationEnd, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";

interface QuickActionItem {
  icon: string;
  label: string;
  route?: string;
  action?: () => void;
  color?: string;
}

@Component({
  selector: "app-quick-actions-fab",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (showFAB()) {
      <!-- Backdrop -->
      @if (isExpanded()) {
        <div class="fab-backdrop" (click)="closeMenu()"></div>
      }

      <div class="quick-actions-container" [class.expanded]="isExpanded()">
        <!-- Action Items -->
        @if (isExpanded()) {
          <div class="action-items">
            @for (
              action of quickActions();
              track action.label;
              let i = $index
            ) {
              <button
                class="action-item"
                [style.animation-delay]="i * 0.04 + 's'"
                (click)="executeAction(action)"
              >
                <span class="action-label">{{ action.label }}</span>
                <div class="action-icon">
                  <i [class]="'pi ' + action.icon"></i>
                </div>
              </button>
            }
          </div>
        }

        <!-- Main FAB Button -->
        <button
          class="main-fab"
          [class.active]="isExpanded()"
          (click)="toggleMenu()"
          aria-label="Merlin AI quick actions"
        >
          <div class="fab-icon">
            <i class="pi pi-sparkles merlin-icon"></i>
            <div class="fab-close">
              <i class="pi pi-times"></i>
            </div>
          </div>
        </button>
      </div>
    }
  `,
  styleUrl: "./quick-actions-fab.component.scss",
})
export class QuickActionsFABComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  isExpanded = signal(false);
  currentRoute = signal("");

  // Routes where FAB should be hidden
  private hiddenRoutes = [
    "/login",
    "/register",
    "/reset-password",
    "/update-password",
    "/",
    "/onboarding",
  ];

  showFAB = computed(() => {
    const route = this.currentRoute();
    const isAuthenticated = this.authService.isAuthenticated();
    return (
      isAuthenticated &&
      !this.hiddenRoutes.some((r) => route === r || route.startsWith("/auth"))
    );
  });

  // Quick actions - always show these core actions
  quickActions = computed<QuickActionItem[]>(() => {
    return [
      {
        icon: "pi-comments",
        label: "Merlin AI Chat",
        route: "/ai-coach",
      },
      {
        icon: "pi-heart",
        label: "Log Wellness",
        route: "/wellness",
      },
      {
        icon: "pi-chart-line",
        label: "View Analytics",
        route: "/analytics",
      },
      {
        icon: "pi-bolt",
        label: "Start Training",
        route: "/training",
      },
      {
        icon: "pi-play",
        label: "Today's Practice",
        route: "/training/daily",
      },
    ];
  });

  ngOnInit(): void {
    this.currentRoute.set(this.router.url);

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentRoute.set((event as NavigationEnd).urlAfterRedirects);
        this.isExpanded.set(false);
      });
  }

  toggleMenu(): void {
    this.isExpanded.update((val) => !val);
  }

  closeMenu(): void {
    this.isExpanded.set(false);
  }

  executeAction(action: QuickActionItem): void {
    if (action.route) {
      this.router.navigate([action.route]);
    } else if (action.action) {
      action.action();
    }
    this.isExpanded.set(false);
  }
}
