import { CommonModule } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from "@angular/core";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";

export interface TabItem {
  header: string;
  content?: string;
  disabled?: boolean;
  icon?: string;
  value?: string | number;
}

/**
 * Tabs Component - Angular 21 + PrimeNG 21
 *
 * A wrapper around PrimeNG Tabs for consistent tab behavior
 * Uses Angular 21 signals for reactive state management
 * Updated for PrimeNG v21 (Modular Tabs API)
 */
@Component({
  selector: "app-tabs",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tabs, TabList, Tab, TabPanels, TabPanel],
  template: `
    <p-tabs
      [value]="activeIndex()"
      [class]="styleClass()"
    >
      <p-tablist [class]="scrollable() ? 'p-tabs-scrollable' : ''">
        @for (tab of tabs(); track tab.header; let i = $index) {
          <p-tab 
            [value]="tab.value ?? i" 
            [disabled]="tab.disabled || false"
            (click)="onChange.emit({ index: i, originalEvent: $event })"
          >
            @if (tab.icon) {
              <i [class]="tab.icon" class="mr-2"></i>
            }
            {{ tab.header }}
          </p-tab>
        }
      </p-tablist>
      <p-tabpanels>
        @for (tab of tabs(); track tab.header; let i = $index) {
          <p-tabpanel [value]="tab.value ?? i">
            <ng-content [select]="'[tab-' + i + ']'"></ng-content>
          </p-tabpanel>
        }
      </p-tabpanels>
      <ng-content></ng-content>
    </p-tabs>
  `,
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  // Configuration
  tabs = input<TabItem[]>([]);
  activeIndex = input<number>(0);
  scrollable = input<boolean>(false);
  styleClass = input<string>();

  // Events
  onChange = output<{ index: number; originalEvent: Event }>();
}
