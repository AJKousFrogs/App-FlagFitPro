import { Component, Input } from "@angular/core";

import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-page-header",
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          @if (icon) {
            <i [class]="'pi ' + icon"></i>
          }
          {{ title }}
        </h1>
        @if (subtitle) {
          <p class="page-subtitle">{{ subtitle }}</p>
        }
      </div>
      <ng-content></ng-content>
    </div>
    `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .header-content {
        flex: 1;
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
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
  @Input() title: string = "";
  @Input() subtitle?: string;
  @Input() icon?: string;
}
