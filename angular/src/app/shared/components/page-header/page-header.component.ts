import { Component, input } from "@angular/core";

import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-page-header",
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          @if (icon()) {
            <i [class]="'pi ' + icon()"></i>
          }
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="page-subtitle">{{ subtitle() }}</p>
        }
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      /* Uses standardized layout-system.scss classes */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5) var(--space-6);
        background-color: var(--surface-primary, #ffffff);
        border: 1px solid var(--color-border-primary, #e0e0e0);
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .header-content {
        flex: 1;
        min-width: 0;
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-semibold);
        line-height: var(--line-height-tight);
        margin: 0 0 var(--space-2) 0;
        color: var(--color-text-primary);
      }

      .page-subtitle {
        font-size: var(--text-base);
        font-weight: var(--font-weight-normal);
        line-height: var(--line-height-normal);
        color: var(--color-text-secondary);
        margin: 0;
      }

      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  // Angular 21: Use input() signal instead of @Input()
  title = input<string>("");
  subtitle = input<string | undefined>(undefined);
  icon = input<string | undefined>(undefined);
}
