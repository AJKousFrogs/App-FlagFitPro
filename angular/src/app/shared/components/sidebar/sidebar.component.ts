import { Component, signal, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

interface NavItem {
  label: string;
  route: string;
  icon: string;
  ariaLabel: string;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div
      class="sidebar"
      [class.sidebar-open]="isOpen()"
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        class="sidebar-logo"
        (click)="navigateToDashboard()"
        title="FlagFit Pro"
        aria-label="Go to dashboard"
      >
        <i class="pi pi-activity icon-20"></i>
      </div>

      <nav class="nav-section" aria-label="Main navigation">
        <a
          *ngFor="let item of navItems; trackBy: trackByRoute"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="nav-item"
          [attr.aria-label]="item.ariaLabel"
          [id]="'nav-' + item.route.replace('/', '')"
        >
          <span class="nav-item-icon">
            <i [class]="'pi ' + item.icon + ' icon-24'"></i>
          </span>
          <span class="nav-item-label">{{ item.label }}</span>
        </a>
      </nav>
    </div>
    <div
      class="sidebar-overlay"
      [class.active]="isOpen()"
      (click)="closeSidebar()"
      aria-hidden="true"
    ></div>
  `,
  styles: [
    `
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        width: 250px;
        background: var(--surface-primary);
        border-right: 1px solid var(--p-surface-200);
        z-index: 1000;
        transition: transform 0.3s ease;
        overflow-y: auto;
      }

      .sidebar-logo {
        padding: var(--space-6);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--color-brand-primary);
        border-bottom: 1px solid var(--p-surface-200);
      }

      .nav-section {
        padding: var(--space-4);
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-2);
        border-radius: var(--p-border-radius);
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.2s;
      }

      .nav-item:hover {
        background: var(--p-surface-50);
        color: var(--color-brand-primary);
      }

      .nav-item.active {
        background: var(--color-brand-light);
        color: var(--color-brand-primary);
        font-weight: 600;
      }

      .nav-item-icon {
        display: flex;
        align-items: center;
      }

      .sidebar-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      }

      @media (max-width: 768px) {
        .sidebar {
          transform: translateX(-100%);
        }

        .sidebar.sidebar-open {
          transform: translateX(0);
        }

        .sidebar-overlay.active {
          display: block;
        }
      }
    `,
  ],
})
export class SidebarComponent {
  isOpen = signal(false);

  navItems: NavItem[] = [
    {
      label: "Overview",
      route: "/dashboard",
      icon: "pi-th-large",
      ariaLabel: "Overview",
    },
    {
      label: "Training",
      route: "/training",
      icon: "pi-bolt",
      ariaLabel: "Training",
    },
    {
      label: "Analytics",
      route: "/analytics",
      icon: "pi-chart-bar",
      ariaLabel: "Analytics",
    },
    {
      label: "Performance",
      route: "/performance-tracking",
      icon: "pi-bullseye",
      ariaLabel: "Performance Tracking",
    },
    {
      label: "Game Tracker",
      route: "/game-tracker",
      icon: "pi-list",
      ariaLabel: "Game Tracker",
    },
    {
      label: "Wellness",
      route: "/wellness",
      icon: "pi-heart",
      ariaLabel: "Wellness",
    },
    {
      label: "Roster",
      route: "/roster",
      icon: "pi-users",
      ariaLabel: "Roster",
    },
    {
      label: "Tournaments",
      route: "/tournaments",
      icon: "pi-trophy",
      ariaLabel: "Tournaments",
    },
    {
      label: "Settings",
      route: "/settings",
      icon: "pi-cog",
      ariaLabel: "Settings",
    },
  ];

  navigateToDashboard(): void {
    // Navigation handled by router
  }

  toggleSidebar(): void {
    this.isOpen.update((val) => !val);
  }

  closeSidebar(): void {
    this.isOpen.set(false);
  }

  trackByRoute(index: number, item: NavItem): string {
    return item.route;
  }
}
