import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { SpeedDialModule } from "primeng/speeddial";
import { MenuItem } from "primeng/api";

@Component({
  selector: "app-quick-actions-fab",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SpeedDialModule],
  template: `
    <div class="quick-actions-container" [class.expanded]="isExpanded()">
      <p-speedDial
        [model]="quickActions()"
        direction="up"
        [transitionDelay]="80"
        buttonClassName="p-button-lg p-button-rounded p-button-primary"
        [mask]="true"
        [maskClassName]="'quick-actions-mask'"
        (onClick)="toggleExpanded()"
        (onShow)="isExpanded.set(true)"
        (onHide)="isExpanded.set(false)"
      ></p-speedDial>
    </div>
  `,
  styles: [
    `
      .quick-actions-container {
        position: fixed;
        bottom: calc(env(safe-area-inset-bottom, 0px) + 80px);
        right: 1rem;
        z-index: 1000;
      }

      :host ::ng-deep .quick-actions-mask {
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(2px);
      }

      :host ::ng-deep .p-speeddial-button {
        width: 56px;
        height: 56px;
        background: var(--color-brand-primary);
        border: none;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
        transition: all 0.2s;
      }

      :host ::ng-deep .p-speeddial-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(8, 153, 73, 0.4);
      }

      :host ::ng-deep .p-speeddial-action {
        background: var(--color-brand-primary);
        border: none;
        width: 48px;
        height: 48px;
      }

      :host ::ng-deep .p-speeddial-action:hover {
        background: var(--color-brand-secondary);
        transform: scale(1.1);
      }

      @media (min-width: 769px) {
        .quick-actions-container {
          display: none;
        }
      }
    `,
  ],
})
export class QuickActionsFABComponent {
  private router = inject(Router);

  isExpanded = signal(false);

  quickActions = computed<MenuItem[]>(() => [
    {
      icon: "pi pi-play",
      label: "Start Training",
      command: () => this.startQuickTraining(),
    },
    {
      icon: "pi pi-clock",
      label: "Log Session",
      command: () => this.logSession(),
    },
    {
      icon: "pi pi-chart-line",
      label: "Quick Stats",
      command: () => this.viewQuickStats(),
    },
  ]);

  toggleExpanded(): void {
    this.isExpanded.update((val) => !val);
  }

  startQuickTraining(): void {
    this.router.navigate(["/training"]);
    this.isExpanded.set(false);
  }

  logSession(): void {
    // Navigate to performance tracking or open a quick log modal
    this.router.navigate(["/performance-tracking"]);
    this.isExpanded.set(false);
  }

  viewQuickStats(): void {
    this.router.navigate(["/analytics"]);
    this.isExpanded.set(false);
  }
}

