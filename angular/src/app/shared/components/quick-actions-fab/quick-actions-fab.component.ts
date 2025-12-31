import { CommonModule } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnDestroy,
    OnInit,
    signal,
} from "@angular/core";

import { NavigationEnd, Router } from "@angular/router";
import { TooltipModule } from "primeng/tooltip";
import { filter, Subscription } from "rxjs";
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule],
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
            @for (action of quickActions(); track action.label; let i = $index) {
              <button 
                class="action-item"
                [style.animation-delay]="(i * 0.04) + 's'"
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
        >
          <div class="fab-icon">
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvE6wGt8diMxqRhHi__HyjI-mheOoOW8m8fg&s" 
              alt="Merlin"
              class="merlin-img"
            />
            <div class="fab-close">
              <i class="pi pi-times"></i>
            </div>
          </div>
        </button>
      </div>
    }
  `,
  styles: [
    `
      /* Backdrop */
      .fab-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 9998;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Container */
      .quick-actions-container {
        position: fixed;
        bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 16px;
      }

      /* Action Items Container */
      .action-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: flex-end;
        padding-right: 6px; /* Align with main FAB center */
      }

      /* Individual Action Item */
      .action-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        opacity: 0;
        transform: translateY(10px);
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .action-label {
        width: 160px;
        padding: 12px 20px;
        background: var(--surface-primary, #ffffff);
        border-radius: 25px;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
        white-space: nowrap;
        text-align: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        transition: all 0.2s ease;
      }

      .action-item:hover .action-label {
        background: var(--ds-primary-green, #089949);
        color: white;
      }

      .action-icon {
        width: 52px;
        height: 52px;
        min-width: 52px;
        min-height: 52px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #0ab85a 0%, #089949 100%);
        box-shadow: 0 4px 16px rgba(8, 153, 73, 0.3);
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .action-icon i {
        font-size: 1.25rem;
        color: #ffffff !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
      }

      .action-item:hover .action-icon {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(8, 153, 73, 0.4);
      }

      /* Main FAB Button */
      .main-fab {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        padding: 0;
        cursor: pointer;
        background: linear-gradient(135deg, #0ab85a 0%, #089949 100%);
        box-shadow: 
          0 6px 24px rgba(8, 153, 73, 0.4),
          0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      }

      .main-fab:hover {
        transform: scale(1.08);
        box-shadow: 
          0 8px 32px rgba(8, 153, 73, 0.5),
          0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .main-fab:active {
        transform: scale(0.95);
      }

      .main-fab.active {
        background: #1a1a1a;
      }

      .fab-icon {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .merlin-img {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        object-fit: cover;
        transition: all 0.3s ease;
      }

      .main-fab.active .merlin-img {
        opacity: 0;
        transform: scale(0.5) rotate(90deg);
      }

      .fab-close {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0.5) rotate(-90deg);
        transition: all 0.3s ease;
      }

      .fab-close i {
        font-size: 1.5rem;
        color: white;
      }

      .main-fab.active .fab-close {
        opacity: 1;
        transform: scale(1) rotate(0deg);
      }

      /* Hide on mobile - bottom nav handles navigation */
      @media (max-width: 768px) {
        .quick-actions-container {
          display: none;
        }
        .fab-backdrop {
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

  // Quick actions - always show these core actions
  quickActions = computed<QuickActionItem[]>(() => {
    return [
      {
        icon: "pi-comments",
        label: "AI Coach Chat",
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
