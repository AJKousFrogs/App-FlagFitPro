import { Component, input, computed } from "@angular/core";

import { ButtonComponent } from "../button/button.component";

/**
 * Page Header Component
 * 
 * Design System Compliant - Refactored January 5, 2026
 * Supports composite view patterns via CSS custom property --page-header-display
 * 
 * Usage in composite views:
 * Parent sets CSS variable to hide child headers:
 *   .hub-tab-content { --page-header-display: none; }
 */
@Component({
  selector: "app-page-header",
  standalone: true,
  imports: [
    ButtonComponent,
  ],
  template: `
    <div class="page-header" [class.hidden-in-composite]="hideInComposite()">
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
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  // Angular 21: Use input() signal instead of @Input()
  title = input<string>("");
  subtitle = input<string | undefined>(undefined);
  icon = input<string | undefined>(undefined);
  
  /**
   * When true, header will be hidden when inside a composite view.
   * Composite views set --page-header-display: none via CSS.
   * This input allows explicit control when CSS cascade isn't sufficient.
   */
  hideInComposite = input<boolean>(false);
}
