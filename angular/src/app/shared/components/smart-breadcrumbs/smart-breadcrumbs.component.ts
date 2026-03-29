import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";

import { StatusTagComponent } from "../status-tag/status-tag.component";
import { ContextService } from "../../../core/services/context.service";
import { BreadcrumbItem } from "../../../core/services/context.service";

@Component({
  selector: "app-smart-breadcrumbs",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, StatusTagComponent],
  template: `
    @if (breadcrumbItems().length > 0) {
      <nav class="smart-breadcrumbs" aria-label="Breadcrumb">
        <ol class="bc-list">
          @for (item of breadcrumbItems(); track item.label; let last = $last) {
            <li class="bc-item" [class.bc-item--current]="last">

              @if (!last && item.route) {
                <a [routerLink]="item.route" class="bc-link" [attr.aria-label]="item.label">
                  @if (item.icon) {
                    <i class="pi {{ item.icon }} bc-icon" aria-hidden="true"></i>
                  }
                  <span>{{ item.label }}</span>
                </a>
              } @else {
                <span class="bc-current" [attr.aria-current]="'page'">
                  @if (item.icon) {
                    <i class="pi {{ item.icon }} bc-icon" aria-hidden="true"></i>
                  }
                  <span>{{ item.label }}</span>
                  @if (item.badge) {
                    <app-status-tag
                      [value]="item.badge.text"
                      [severity]="item.badge.severity"
                      size="sm"
                      class="bc-badge"
                    />
                  }
                </span>
              }

              @if (!last) {
                <i class="pi pi-angle-right bc-sep" aria-hidden="true"></i>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styleUrl: "./smart-breadcrumbs.component.scss",
})
export class SmartBreadcrumbsComponent {
  private router = inject(Router);
  private contextService = inject(ContextService);

  breadcrumbItems = computed((): BreadcrumbItem[] => {
    const route = this.router.url;
    const items = this.contextService.buildBreadcrumbItems(route);
    return this.contextService.enhanceWithContext(items);
  });
}
