/**
 * Angular Aria Tabs Component
 *
 * Accessible tab interface following WAI-ARIA tabs pattern.
 * Provides keyboard navigation and proper ARIA attributes.
 *
 * Features:
 * - Arrow key navigation
 * - Home/End key support
 * - Automatic/manual activation modes
 * - ARIA tablist, tab, and tabpanel roles
 * - Focus management
 *
 * @version 1.0.0 - Angular 21 Aria
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  afterNextRender,
  Injector,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export interface AriaTab {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: string;
}

@Component({
  selector: "aria-tabs",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="aria-tabs" [class]="tabsClasses()">
      <!-- Tab List -->
      <div
        role="tablist"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-orientation]="orientation()"
        class="aria-tablist"
        (keydown)="handleKeydown($event)"
      >
        @for (tab of tabs(); track tab.id; let i = $index) {
          <button
            #tabButton
            type="button"
            role="tab"
            [id]="getTabId(tab.id)"
            [attr.aria-selected]="selectedTab() === tab.id"
            [attr.aria-controls]="getPanelId(tab.id)"
            [attr.aria-disabled]="tab.disabled"
            [disabled]="tab.disabled"
            [tabindex]="selectedTab() === tab.id ? 0 : -1"
            class="aria-tab"
            [class.selected]="selectedTab() === tab.id"
            [class.disabled]="tab.disabled"
            (click)="selectTab(tab.id)"
            (focus)="focusedIndex.set(i)"
          >
            @if (tab.icon) {
              <i [class]="'pi ' + tab.icon" aria-hidden="true"></i>
            }
            <span>{{ tab.label }}</span>
          </button>
        }
      </div>

      <!-- Tab Panels -->
      <div class="aria-tabpanels">
        @for (tab of tabs(); track tab.id) {
          <div
            role="tabpanel"
            [id]="getPanelId(tab.id)"
            [attr.aria-labelledby]="getTabId(tab.id)"
            [hidden]="selectedTab() !== tab.id"
            [tabindex]="0"
            class="aria-tabpanel"
          >
            <ng-content [select]="'[slot=' + tab.id + ']'" />
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './aria-tabs.component.scss',
})
export class AriaTabsComponent {
  private elementRef = inject(ElementRef);
  private injector = inject(Injector);

  // Inputs
  tabs = input.required<AriaTab[]>();
  defaultTab = input<string | null>(null);
  orientation = input<"horizontal" | "vertical">("horizontal");
  activationMode = input<"automatic" | "manual">("automatic");

  // ARIA inputs
  ariaLabel = input<string>("Tab navigation");

  // Outputs
  tabChanged = output<string>();

  // Internal state
  selectedTab = signal<string>("");
  focusedIndex = signal<number>(0);

  // Computed
  tabsClasses = computed(() => {
    return this.orientation() === "vertical" ? "vertical" : "";
  });

  private tabIds = new Map<string, { tabId: string; panelId: string }>();

  constructor() {
    // Initialize selected tab
    effect(
      () => {
        const tabsList = this.tabs();
        const defaultTabId = this.defaultTab();

        if (tabsList.length > 0 && !this.selectedTab()) {
          const initialTab = defaultTabId || tabsList[0].id;
          this.selectedTab.set(initialTab);
        }

        // Generate unique IDs for tabs
        tabsList.forEach((tab) => {
          if (!this.tabIds.has(tab.id)) {
            const uniqueId = Math.random().toString(36).slice(2);
            this.tabIds.set(tab.id, {
              tabId: `aria-tab-${uniqueId}`,
              panelId: `aria-panel-${uniqueId}`,
            });
          }
        });
      },
      { allowSignalWrites: true },
    );
  }

  getTabId(tabId: string): string {
    return this.tabIds.get(tabId)?.tabId || `aria-tab-${tabId}`;
  }

  getPanelId(tabId: string): string {
    return this.tabIds.get(tabId)?.panelId || `aria-panel-${tabId}`;
  }

  selectTab(tabId: string): void {
    const tab = this.tabs().find((t) => t.id === tabId);
    if (tab && !tab.disabled) {
      this.selectedTab.set(tabId);
      this.tabChanged.emit(tabId);
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    const tabsList = this.tabs();
    const enabledTabs = tabsList.filter((t) => !t.disabled);
    const currentIndex = this.focusedIndex();

    let newIndex = currentIndex;
    let shouldPrevent = true;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        newIndex = this.getNextEnabledIndex(currentIndex, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        newIndex = this.getNextEnabledIndex(currentIndex, -1);
        break;
      case "Home":
        newIndex =
          enabledTabs.length > 0 ? tabsList.indexOf(enabledTabs[0]) : 0;
        break;
      case "End":
        newIndex =
          enabledTabs.length > 0
            ? tabsList.indexOf(enabledTabs[enabledTabs.length - 1])
            : tabsList.length - 1;
        break;
      default:
        shouldPrevent = false;
    }

    if (shouldPrevent) {
      event.preventDefault();
      this.focusedIndex.set(newIndex);
      this.focusTab(newIndex);

      // In automatic mode, also select the tab
      if (this.activationMode() === "automatic") {
        this.selectTab(tabsList[newIndex].id);
      }
    }
  }

  private getNextEnabledIndex(currentIndex: number, direction: number): number {
    const tabsList = this.tabs();
    let newIndex = currentIndex;

    do {
      newIndex = (newIndex + direction + tabsList.length) % tabsList.length;
    } while (tabsList[newIndex].disabled && newIndex !== currentIndex);

    return newIndex;
  }

  private focusTab(index: number): void {
    afterNextRender(
      () => {
        const tabButtons =
          this.elementRef.nativeElement.querySelectorAll("[role='tab']");
        (tabButtons[index] as HTMLElement)?.focus();
      },
      { injector: this.injector },
    );
  }
}
