import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Tabs, TabPanel } from "primeng/tabs";

export interface TabItem {
  header: string;
  content: string;
  disabled?: boolean;
  icon?: string;
}

/**
 * Tabs Component - Angular 21 + PrimeNG 21
 *
 * A wrapper around PrimeNG Tabs for consistent tab behavior
 * Uses Angular 21 signals for reactive state management
 * Updated for PrimeNG v20+ (Tabs replaces TabView)
 */
@Component({
  selector: "app-tabs",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tabs, TabPanel],
  template: `
    <p-tabs
      [activeIndex]="activeIndex()"
      [scrollable]="scrollable()"
      [styleClass]="styleClass()"
      (onChange)="onChange.emit($event)"
    >
      @for (tab of tabs(); track tab.header) {
        <p-tabpanel
          [header]="tab.header"
          [disabled]="tab.disabled || false"
          [leftIcon]="tab.icon"
        >
          <ng-content [select]="'[tab-' + $index + ']'"></ng-content>
        </p-tabpanel>
      }
      <ng-content></ng-content>
    </p-tabs>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      :host ::ng-deep .p-tabview-nav {
        background-color: var(--p-surface-0);
        border-bottom: 1px solid var(--p-surface-border);
      }

      :host ::ng-deep .p-tabview-nav-link {
        padding: 1rem 1.5rem;
        color: var(--p-text-color-secondary);
        transition: all 0.2s ease;
      }

      :host ::ng-deep .p-tabview-nav-link:hover {
        color: var(--p-text-color);
        background-color: var(--p-surface-50);
      }

      :host ::ng-deep .p-tabview-nav-link.p-highlight {
        color: var(--p-primary-color);
        border-bottom-color: var(--p-primary-color);
      }

      :host ::ng-deep .p-tabview-panels {
        padding: 1.5rem;
        background-color: var(--p-surface-0);
      }
    `,
  ],
})
export class TabsComponent {
  // Configuration
  tabs = input<TabItem[]>([]);
  activeIndex = input<number>(0);
  scrollable = input<boolean>(false);
  styleClass = input<string>();

  // Events
  onChange = output<any>();
}
