/**
 * Global Search Panel Component
 *
 * Slide-out search panel with real-time search results
 * Features:
 * - Real-time search with debouncing
 * - Recent searches
 * - Categorized results
 * - Keyboard navigation
 */

import {
  Component,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  HostListener,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { SearchService, SearchResult } from "../../../core/services/search.service";

@Component({
  selector: "app-search-panel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    ProgressSpinnerModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '600px', maxWidth: '95vw' }"
      [showHeader]="false"
      [dismissableMask]="true"
      [closable]="true"
      position="top"
      styleClass="search-dialog"
    >
      <div class="search-panel">
        <!-- Search Input -->
        <div class="search-input-container">
          <i class="pi pi-search search-icon"></i>
          <input
            #searchInput
            type="text"
            pInputText
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            (keydown.enter)="onEnter()"
            (keydown.escape)="close()"
            (keydown.arrowdown)="onArrowDown($event)"
            (keydown.arrowup)="onArrowUp($event)"
            placeholder="Search exercises, programs, players..."
            class="search-input"
            autocomplete="off"
          />
          @if (searchQuery) {
            <p-button
              icon="pi pi-times"
              [text]="true"
              [rounded]="true"
              (onClick)="clearSearch()"
              class="clear-btn"
            ></p-button>
          }
        </div>

        <!-- Loading State -->
        @if (searchService.loading()) {
          <div class="loading-state">
            <p-progressSpinner
              [style]="{ width: '30px', height: '30px' }"
            ></p-progressSpinner>
            <span>Searching...</span>
          </div>
        }

        <!-- Results -->
        @if (!searchService.loading() && searchService.hasResults()) {
          <div class="search-results">
            @for (result of searchService.results(); track result.id; let i = $index) {
              <div
                class="search-result-item"
                [class.selected]="selectedIndex() === i"
                (click)="selectResult(result)"
                (mouseenter)="selectedIndex.set(i)"
              >
                <div class="result-icon" [class]="'type-' + result.type">
                  <i [class]="result.icon"></i>
                </div>
                <div class="result-content">
                  <div class="result-title">{{ result.title }}</div>
                  @if (result.subtitle) {
                    <div class="result-subtitle">{{ result.subtitle }}</div>
                  }
                </div>
                <div class="result-type">{{ getTypeLabel(result.type) }}</div>
              </div>
            }
          </div>
        }

        <!-- No Results -->
        @if (!searchService.loading() && searchQuery && !searchService.hasResults()) {
          <div class="no-results">
            <i class="pi pi-search"></i>
            <p>No results found for "{{ searchQuery }}"</p>
            <span>Try different keywords or check spelling</span>
          </div>
        }

        <!-- Recent Searches (when no query) -->
        @if (!searchQuery && searchService.recentSearches().length > 0) {
          <div class="recent-searches">
            <div class="section-header">
              <span>Recent Searches</span>
              <p-button
                label="Clear"
                [text]="true"
                size="small"
                (onClick)="clearRecentSearches()"
              ></p-button>
            </div>
            @for (recent of searchService.recentSearches(); track recent) {
              <div
                class="recent-item"
                (click)="searchFor(recent)"
              >
                <i class="pi pi-history"></i>
                <span>{{ recent }}</span>
              </div>
            }
          </div>
        }

        <!-- Quick Links (when no query) -->
        @if (!searchQuery) {
          <div class="quick-links">
            <div class="section-header">
              <span>Quick Links</span>
            </div>
            <div class="quick-links-grid">
              <div class="quick-link" (click)="navigateTo('/training')">
                <i class="pi pi-calendar"></i>
                <span>Training</span>
              </div>
              <div class="quick-link" (click)="navigateTo('/exercise-library')">
                <i class="pi pi-bolt"></i>
                <span>Exercises</span>
              </div>
              <div class="quick-link" (click)="navigateTo('/analytics')">
                <i class="pi pi-chart-line"></i>
                <span>Analytics</span>
              </div>
              <div class="quick-link" (click)="navigateTo('/roster')">
                <i class="pi pi-users"></i>
                <span>Roster</span>
              </div>
            </div>
          </div>
        }

        <!-- Keyboard Hints -->
        <div class="keyboard-hints">
          <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span><kbd>Enter</kbd> to select</span>
          <span><kbd>Esc</kbd> to close</span>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      ::ng-deep .search-dialog {
        .p-dialog-content {
          padding: 0;
          border-radius: var(--p-border-radius);
          overflow: hidden;
        }
      }

      .search-panel {
        background: var(--surface-primary);
      }

      .search-input-container {
        display: flex;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--p-surface-200);
        gap: var(--space-3);
      }

      .search-icon {
        color: var(--text-secondary);
        font-size: 1.25rem;
      }

      .search-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 1.125rem;
        padding: var(--space-2);
      }

      .search-input:focus {
        outline: 2px solid var(--color-brand-primary, #089949);
        outline-offset: 2px;
      }

      .search-input:focus:not(:focus-visible) {
        outline: none;
      }

      .clear-btn {
        color: var(--text-secondary);
      }

      .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-6);
        color: var(--text-secondary);
      }

      .search-results {
        max-height: 400px;
        overflow-y: auto;
      }

      .search-result-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        cursor: pointer;
        transition: background 0.2s;
      }

      .search-result-item:hover,
      .search-result-item.selected {
        background: var(--p-surface-100);
      }

      .result-icon {
        width: 40px;
        height: 40px;
        border-radius: var(--p-border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.125rem;
      }

      .result-icon.type-exercise {
        background: var(--p-blue-100);
        color: var(--p-blue-600);
      }

      .result-icon.type-program {
        background: var(--p-green-100);
        color: var(--p-green-600);
      }

      .result-icon.type-player {
        background: var(--p-purple-100);
        color: var(--p-purple-600);
      }

      .result-icon.type-video {
        background: var(--p-red-100);
        color: var(--p-red-600);
      }

      .result-icon.type-team {
        background: var(--p-orange-100);
        color: var(--p-orange-600);
      }

      .result-content {
        flex: 1;
        min-width: 0;
      }

      .result-title {
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .result-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .result-type {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .no-results {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-8);
        color: var(--text-secondary);
        text-align: center;
      }

      .no-results i {
        font-size: 2.5rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }

      .no-results p {
        margin: 0 0 var(--space-2);
        font-weight: 500;
        color: var(--text-primary);
      }

      .no-results span {
        font-size: 0.875rem;
      }

      .recent-searches,
      .quick-links {
        padding: var(--space-4);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-3);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-tertiary);
      }

      .recent-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        cursor: pointer;
        border-radius: var(--p-border-radius);
        transition: background 0.2s;
      }

      .recent-item:hover {
        background: var(--p-surface-100);
      }

      .recent-item i {
        color: var(--text-tertiary);
      }

      .quick-links-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
      }

      .quick-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4);
        border-radius: var(--p-border-radius);
        background: var(--p-surface-50);
        cursor: pointer;
        transition: all 0.2s;
      }

      .quick-link:hover {
        background: var(--p-surface-100);
        transform: translateY(-2px);
      }

      .quick-link i {
        font-size: 1.5rem;
        color: var(--color-brand-primary);
      }

      .quick-link span {
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .keyboard-hints {
        display: flex;
        justify-content: center;
        gap: var(--space-6);
        padding: var(--space-3);
        border-top: 1px solid var(--p-surface-200);
        background: var(--p-surface-50);
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }

      kbd {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        background: var(--p-surface-200);
        border-radius: 4px;
        font-family: inherit;
        font-size: 0.75rem;
        margin-right: 0.25rem;
      }

      @media (max-width: 768px) {
        .quick-links-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .keyboard-hints {
          display: none;
        }
      }
    `,
  ],
})
export class SearchPanelComponent {
  @ViewChild("searchInput") searchInput!: ElementRef<HTMLInputElement>;

  searchService = inject(SearchService);
  private router = inject(Router);

  visible = false;
  searchQuery = "";
  selectedIndex = signal(0);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Sync visibility with service
    effect(() => {
      const isOpen = this.searchService.isOpen();
      if (isOpen !== this.visible) {
        this.visible = isOpen;
        if (isOpen) {
          setTimeout(() => this.focusInput(), 100);
        }
      }
    });
  }

  @HostListener("document:keydown.meta.k", ["$event"])
  @HostListener("document:keydown.control.k", ["$event"])
  onKeyboardShortcut(event: Event): void {
    event.preventDefault();
    this.open();
  }

  open(): void {
    this.visible = true;
    this.searchService.open();
    setTimeout(() => this.focusInput(), 100);
  }

  close(): void {
    this.visible = false;
    this.searchService.close();
  }

  private focusInput(): void {
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  onSearchChange(query: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.searchService.search(query);
      this.selectedIndex.set(0);
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = "";
    this.searchService.clearResults();
    this.focusInput();
  }

  searchFor(query: string): void {
    this.searchQuery = query;
    this.searchService.search(query);
  }

  onEnter(): void {
    const results = this.searchService.results();
    if (results.length > 0) {
      this.selectResult(results[this.selectedIndex()]);
    }
  }

  onArrowDown(event: Event): void {
    event.preventDefault();
    const results = this.searchService.results();
    if (this.selectedIndex() < results.length - 1) {
      this.selectedIndex.update((i) => i + 1);
    }
  }

  onArrowUp(event: Event): void {
    event.preventDefault();
    if (this.selectedIndex() > 0) {
      this.selectedIndex.update((i) => i - 1);
    }
  }

  selectResult(result: SearchResult): void {
    this.router.navigateByUrl(result.route);
    this.close();
    this.clearSearch();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.close();
  }

  clearRecentSearches(): void {
    this.searchService.clearRecentSearches();
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      exercise: "Exercise",
      program: "Program",
      player: "Player",
      team: "Team",
      video: "Video",
      article: "Article",
    };
    return labels[type] || type;
  }
}
