import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { TagModule } from "primeng/tag";
import { ContextService } from "../../../core/services/context.service";

@Component({
  selector: "app-smart-breadcrumbs",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, BreadcrumbModule, TagModule],
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
                <a [routerLink]="item.routerLink" class="breadcrumb-link">
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
        gap: 0.5rem;
      }

      :host ::ng-deep .custom-breadcrumb .p-breadcrumb-item {
        padding: 0;
      }

      /* Separator styling */
      :host ::ng-deep .custom-breadcrumb .p-breadcrumb-separator {
        margin: 0 0.75rem;
        color: var(--text-tertiary, #64748b);
        font-size: 0.75rem;
      }

      :host ::ng-deep .custom-breadcrumb .p-breadcrumb-separator .p-icon {
        width: 0.75rem;
        height: 0.75rem;
      }

      .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        color: var(--text-secondary);
        font-size: 0.9375rem;
        padding: 0.375rem 0;
      }

      .breadcrumb-item.current {
        color: var(--text-primary);
        font-weight: 600;
      }

      .breadcrumb-item i {
        font-size: 1rem;
        opacity: 0.7;
      }

      .breadcrumb-item.current i {
        opacity: 1;
        color: var(--ds-primary-green, #089949);
      }

      .breadcrumb-link {
        color: var(--text-secondary);
        text-decoration: none;
        transition: color 0.2s;
      }

      .breadcrumb-link:hover {
        color: var(--ds-primary-green, #089949);
      }

      .breadcrumb-text {
        color: inherit;
      }

      .breadcrumb-badge {
        margin-left: 0.5rem;
      }

      @media (max-width: 768px) {
        .smart-breadcrumbs {
          padding: var(--space-3) var(--space-4);
        }
      }
    `,
  ],
})
export class SmartBreadcrumbsComponent {
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
}
