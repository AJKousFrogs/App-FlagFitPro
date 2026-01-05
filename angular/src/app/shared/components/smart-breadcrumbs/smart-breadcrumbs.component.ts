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
    @if (breadcrumbItems().length > 0) {
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
    }
  `,
  styleUrl: "./smart-breadcrumbs.component.scss",
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
