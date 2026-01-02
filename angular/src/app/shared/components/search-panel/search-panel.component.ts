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
import { TooltipModule } from "primeng/tooltip";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import {
  SearchService,
  SearchResult,
} from "../../../core/services/search.service";

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
    TooltipModule,
    ProgressSpinnerModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '700px', maxWidth: '95vw', top: '10%' }"
      [showHeader]="false"
      [dismissableMask]="true"
      [closable]="true"
      position="top"
      styleClass="command-palette-dialog"
    >
      <div class="search-panel">
        <!-- Search Input -->
        <div class="search-input-wrapper">
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
          <div class="input-actions">
            @if (searchQuery) {
              <p-button
                icon="pi pi-times"
                [text]="true"
                [rounded]="true"
                (onClick)="clearSearch()"
                class="clear-btn"
                pTooltip="Clear search (Esc)"
                tooltipPosition="bottom"
              ></p-button>
            } @else {
              <div class="esc-hint">ESC</div>
            }
          </div>
        </div>

        <div class="panel-content custom-scrollbar">
          <!-- Loading State -->
          @if (searchService.loading()) {
            <div class="loading-state">
              <p-progressSpinner
                [style]="{ width: '32px', height: '32px' }"
                strokeWidth="4"
              ></p-progressSpinner>
              <span>Searching across everything...</span>
            </div>
          }

          <!-- Results -->
          @if (!searchService.loading() && searchService.hasResults()) {
            <div class="search-results">
              <div class="section-label">Search Results</div>
              @for (
                result of searchService.results();
                track result.id;
                let i = $index
              ) {
                <div
                  class="search-result-item"
                  [class.selected]="selectedIndex() === i"
                  (click)="selectResult(result); $event.stopPropagation()"
                  (mouseenter)="selectedIndex.set(i)"
                >
                  <div class="result-icon-box" [class]="'type-' + result.type">
                    <i [class]="result.icon"></i>
                  </div>
                  <div class="result-info">
                    <div class="result-main">
                      <span class="result-title">{{ result.title }}</span>
                      <span class="result-badge">{{ getTypeLabel(result.type) }}</span>
                    </div>
                    @if (result.subtitle) {
                      <div class="result-subtitle">{{ result.subtitle }}</div>
                    }
                  </div>
                  <i class="pi pi-chevron-right enter-icon"></i>
                </div>
              }
            </div>
          }

          <!-- No Results -->
          @if (
            !searchService.loading() && searchQuery && !searchService.hasResults()
          ) {
            <div class="no-results">
              <div class="no-results-icon">
                <i class="pi pi-search"></i>
              </div>
              <h3>No results found</h3>
              <p>We couldn't find anything matching "<strong>{{ searchQuery }}</strong>"</p>
              <div class="no-results-suggestions">
                <span>Try searching for:</span>
                <div class="suggestion-chips">
                  <span class="suggestion-chip" (click)="searchFor('Sprint'); $event.stopPropagation()">Sprint</span>
                  <span class="suggestion-chip" (click)="searchFor('Quarterback'); $event.stopPropagation()">Quarterback</span>
                  <span class="suggestion-chip" (click)="searchFor('Drills'); $event.stopPropagation()">Drills</span>
                </div>
              </div>
            </div>
          }

          <!-- Recent Searches (when no query) -->
          @if (!searchQuery && searchService.recentSearches().length > 0) {
            <div class="recent-searches">
              <div class="section-header">
                <div class="section-title">
                  <i class="pi pi-history"></i>
                  <span>Recent Searches</span>
                </div>
                <button class="clear-recent-link" (click)="clearRecentSearches(); $event.stopPropagation()">
                  Clear history
                </button>
              </div>
              <div class="recent-grid">
                @for (recent of searchService.recentSearches(); track recent) {
                  <div class="recent-tag" (click)="searchFor(recent); $event.stopPropagation()">
                    <span>{{ recent }}</span>
                    <i class="pi pi-arrow-up-left"></i>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Quick Links (when no query) -->
          @if (!searchQuery) {
            <div class="quick-links">
              <div class="section-header">
                <div class="section-title">
                  <i class="pi pi-bolt"></i>
                  <span>Quick Actions</span>
                </div>
              </div>
              <div class="quick-links-grid">
                <div class="quick-link-card" (click)="navigateTo('/training'); $event.stopPropagation()">
                  <div class="quick-link-icon training">
                    <i class="pi pi-calendar"></i>
                  </div>
                  <div class="quick-link-text">
                    <span class="link-label">Training</span>
                    <span class="link-desc">Today's plan</span>
                  </div>
                </div>
                <div class="quick-link-card" (click)="navigateTo('/exercise-library'); $event.stopPropagation()">
                  <div class="quick-link-icon exercises">
                    <i class="pi pi-bolt"></i>
                  </div>
                  <div class="quick-link-text">
                    <span class="link-label">Exercises</span>
                    <span class="link-desc">Browse library</span>
                  </div>
                </div>
                <div class="quick-link-card" (click)="navigateTo('/analytics'); $event.stopPropagation()">
                  <div class="quick-link-icon analytics">
                    <i class="pi pi-chart-line"></i>
                  </div>
                  <div class="quick-link-text">
                    <span class="link-label">Analytics</span>
                    <span class="link-desc">View trends</span>
                  </div>
                </div>
                <div class="quick-link-card" (click)="navigateTo('/roster'); $event.stopPropagation()">
                  <div class="quick-link-icon roster">
                    <i class="pi pi-users"></i>
                  </div>
                  <div class="quick-link-text">
                    <span class="link-label">Roster</span>
                    <span class="link-desc">Team members</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Keyboard Hints -->
        <div class="command-palette-footer">
          <div class="keyboard-hint">
            <span class="key-combo"><kbd>↑</kbd><kbd>↓</kbd></span>
            <span>Navigate</span>
          </div>
          <div class="keyboard-hint">
            <span class="key-combo"><kbd>↵</kbd></span>
            <span>Select</span>
          </div>
          <div class="keyboard-hint">
            <span class="key-combo"><kbd>Esc</kbd></span>
            <span>Close</span>
          </div>
          <div class="keyboard-hint search-type-hint">
            <span>Searching <strong>Global Content</strong></span>
          </div>
        </div>
      </div>
    </p-dialog>
  `,
  styleUrl: './search-panel.component.scss',
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
