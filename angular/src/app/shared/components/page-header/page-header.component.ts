import { ChangeDetectionStrategy, Component, input } from "@angular/core";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div
      class="page-header"
      [class.hidden-in-composite]="hideInComposite()"
      [class.page-header--hero]="variant() === 'hero'"
    >
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
  styleUrl: "./page-header.component.scss",
})
export class PageHeaderComponent {
  title = input<string>("");
  subtitle = input<string | undefined>(undefined);
  icon = input<string | undefined>(undefined);
  variant = input<"default" | "hero">("default");

  /**
   * When true, header will be hidden when inside a composite view.
   * Composite views set --page-header-display: none via CSS.
   * This input allows explicit control when CSS cascade isn't sufficient.
   */
  hideInComposite = input<boolean>(false);
}
