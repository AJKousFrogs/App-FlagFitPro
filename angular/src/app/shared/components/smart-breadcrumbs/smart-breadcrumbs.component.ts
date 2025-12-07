import {
  Component,
  OnInit,
  computed,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { DropdownModule } from "primeng/dropdown";
import { TagModule } from "primeng/tag";
import { MenuItem } from "primeng/api";
import { ContextService, QuickAction } from "../../../core/services/context.service";

@Component({
  selector: "app-smart-breadcrumbs",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    BreadcrumbModule,
    DropdownModule,
    TagModule
],
  template: `
    <nav class="smart-breadcrumbs" aria-label="Navigation path">
      <div class="breadcrumbs-container">
        <p-breadcrumb
          [model]="breadcrumbItems()"
          styleClass="custom-breadcrumb"
          >
          <ng-template pTemplate="item" let-item>
            <div class="breadcrumb-item" [class.current]="item.data?.current">
              @if (item.icon) {
                <i [class]="item.icon"></i>
              }
              @if (item.routerLink && !item.data?.current) {
                <a
                  [routerLink]="item.routerLink"
                  class="breadcrumb-link"
                  >
                  {{ item.label }}
                </a>
              }
              @if (!item.routerLink || item.data?.current) {
                <span class="breadcrumb-text">
                  {{ item.label }}
                </span>
              }
              @if (item.data?.badge) {
                <p-tag
                  [value]="item.data.badge.text"
                  [severity]="item.data.badge.severity"
                  size="small"
                  class="breadcrumb-badge"
                  >
                </p-tag>
              }
            </div>
          </ng-template>
        </p-breadcrumb>
    
        <!-- Quick Actions Dropdown -->
        <p-dropdown
          [options]="quickActionsDropdown()"
          optionLabel="label"
          placeholder="Quick Actions"
          appendTo="body"
          (onChange)="executeQuickAction($event.value)"
          [showClear]="true"
          class="quick-actions-dropdown"
          >
          <ng-template let-action pTemplate="item">
            <div class="quick-action-item">
              <i [class]="action.icon"></i>
              <span>{{ action.label }}</span>
            </div>
          </ng-template>
        </p-dropdown>
      </div>
    </nav>
    `,
  styles: [
    `
      .smart-breadcrumbs {
        padding: var(--space-4) var(--space-6);
        background: var(--surface-primary);
        border-bottom: 1px solid var(--p-surface-200);
      }

      .breadcrumbs-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4);
        flex-wrap: wrap;
      }

      :host ::ng-deep .custom-breadcrumb {
        background: transparent;
        border: none;
        padding: 0;
      }

      :host ::ng-deep .custom-breadcrumb .p-breadcrumb-list {
        margin: 0;
        padding: 0;
      }

      :host ::ng-deep .custom-breadcrumb .p-breadcrumb-item {
        padding: 0;
      }

      .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .breadcrumb-item.current {
        color: var(--text-primary);
        font-weight: 600;
      }

      .breadcrumb-item i {
        font-size: 0.875rem;
      }

      .breadcrumb-link {
        color: var(--text-secondary);
        text-decoration: none;
        transition: color 0.2s;
      }

      .breadcrumb-link:hover {
        color: var(--color-brand-primary);
      }

      .breadcrumb-text {
        color: inherit;
      }

      .breadcrumb-badge {
        margin-left: var(--space-2);
      }

      .quick-actions-dropdown {
        min-width: 180px;
      }

      .quick-action-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .quick-action-item i {
        font-size: 0.875rem;
      }

      @media (max-width: 768px) {
        .smart-breadcrumbs {
          padding: var(--space-3) var(--space-4);
        }

        .breadcrumbs-container {
          flex-direction: column;
          align-items: flex-start;
        }

        .quick-actions-dropdown {
          width: 100%;
        }
      }
    `,
  ],
})
export class SmartBreadcrumbsComponent implements OnInit {
  private router = inject(Router);
  private contextService = inject(ContextService);

  breadcrumbItems = computed(() => {
    const route = this.router.url;
    const items = this.contextService.buildBreadcrumbItems(route);
    const enhanced = this.contextService.enhanceWithContext(items);
    // Convert to PrimeNG MenuItem format
    return enhanced.map((item) => ({
      label: item.label,
      routerLink: item.route,
      icon: item.icon,
      data: item, // Store original item for template access
    }));
  });

  quickActionsDropdown = computed(() => {
    const currentPage = this.contextService.getCurrentPage();
    const actions = this.contextService.getQuickActions(currentPage);
    return actions.map((action) => ({
      label: action.label,
      icon: action.icon,
      route: action.route,
      action: action.action,
      badge: action.badge,
    }));
  });

  ngOnInit(): void {
    // Component initialization
  }

  executeQuickAction(action: QuickAction | null): void {
    if (!action) return;

    if (action.route) {
      this.router.navigate([action.route]);
    } else if (action.action) {
      action.action();
    }
  }
}

