/**
 * Global Search Panel Component
 *
 * Slide-out search panel with real-time search results
 * Features:
 * - Real-time search with debouncing
 * - Recent searches
 * - Categorized results with highlighting
 * - Keyboard navigation
 * - Instant suggestions
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterModule } from "@angular/router";
import { IconButtonComponent } from "../button/icon-button.component";
import { InputText } from "primeng/inputtext";
import { TIMEOUTS } from "../../../core/constants/app.constants";
import { AppDialogComponent } from "../dialog/dialog.component";

import { Subject, debounceTime, distinctUntilChanged, tap } from "rxjs";
import {
  SearchResult,
  SearchService,
} from "../../../core/services/search.service";

/** Debounce delay for search input in milliseconds */
const SEARCH_DEBOUNCE_MS = 300;

/** Debounce delay for suggestions (shorter for responsiveness) */
const SUGGESTION_DEBOUNCE_MS = 150;

@Component({
  selector: "app-search-panel",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, InputText, AppDialogComponent, IconButtonComponent],
  templateUrl: "./search-panel.component.html",
  styleUrl: "./search-panel.component.scss",
  host: {
    "(document:keydown.meta.k)": "onKeyboardShortcut($event)",
    "(document:keydown.control.k)": "onKeyboardShortcut($event)",
  },
})
export class SearchPanelComponent implements OnDestroy {
  searchInput = viewChild.required<ElementRef<HTMLInputElement>>("searchInput");

  readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Use a signal for visibility to ensure proper change detection
  private readonly _visible = signal(false);

  // Getter/setter for two-way binding with p-dialog [(visible)]
  get visible(): boolean {
    return this._visible();
  }
  set visible(value: boolean) {
    this._visible.set(value);
    // Sync back to service if dialog is closed via mask click
    if (!value && this.searchService.isOpen()) {
      this.searchService.close();
    }
  }

  searchQuery = "";
  readonly selectedIndex = signal(0);

  /** Index for Quick Actions keyboard navigation (2x2 grid) */
  readonly quickActionIndex = signal(0);

  /** Quick action routes for keyboard navigation */
  private readonly quickActionRoutes = [
    "/training",
    "/exercise-library",
    "/performance/insights",
    "/roster",
  ];

  /** Whether to show suggestions dropdown */
  readonly showSuggestions = signal(false);

  /** Subject for debounced search */
  private readonly searchSubject = new Subject<string>();

  /** Subject for debounced suggestions */
  private readonly suggestionSubject = new Subject<string>();

  /** Type labels for result badges */
  private readonly typeLabels: Record<string, string> = {
    exercise: "Exercise",
    program: "Program",
    player: "Player",
    team: "Team",
    video: "Video",
    article: "Article",
  };

  /** Popular searches to show when empty (UX Audit Fix #6) */
  readonly popularSearches = [
    "Sprint Training",
    "Quarterback Drills",
    "Receiver Routes",
    "Agility Drills",
    "Strength Training",
    "Recovery Protocol",
    "Conditioning",
    "Footwork Drills",
  ];

  constructor() {
    // Setup debounced search stream
    this.searchSubject
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        tap((query) => {
          this.showSuggestions.set(false);
          this.searchService.search(query);
          this.selectedIndex.set(0);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    // Setup debounced suggestions stream
    this.suggestionSubject
      .pipe(
        debounceTime(SUGGESTION_DEBOUNCE_MS),
        distinctUntilChanged(),
        tap((query) => {
          if (query.length >= 2) {
            this.searchService.getInstantSuggestions(query);
            this.showSuggestions.set(true);
          } else {
            this.showSuggestions.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    // Sync visibility with service
    effect(() => {
      const isOpen = this.searchService.isOpen();
      if (isOpen !== this._visible()) {
        this._visible.set(isOpen);
        if (isOpen) {
          setTimeout(() => this.focusInput(), TIMEOUTS.UI_MICRO_DELAY);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.suggestionSubject.complete();
  }

  onKeyboardShortcut(event: Event): void {
    event.preventDefault();
    this.open();
  }

  open(): void {
    this._visible.set(true);
    this.searchService.open();
    this.quickActionIndex.set(0);
    this.selectedIndex.set(0);
    setTimeout(() => this.focusInput(), TIMEOUTS.UI_MICRO_DELAY);
  }

  close(): void {
    this._visible.set(false);
    this.searchService.close();
    this.showSuggestions.set(false);
    this.quickActionIndex.set(0);
  }

  private focusInput(): void {
    const input = this.searchInput();
    if (input?.nativeElement) {
      input.nativeElement.focus();
    }
  }

  onSearchChange(query: string): void {
    // Emit to suggestion stream for fast feedback
    this.suggestionSubject.next(query);

    // Emit to search stream for actual search
    this.searchSubject.next(query);
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement | null)?.value ?? "";
    this.searchQuery = query;
    this.onSearchChange(query);
  }

  clearSearch(): void {
    this.searchQuery = "";
    this.searchService.clearResults();
    this.showSuggestions.set(false);
    this.quickActionIndex.set(0);
    this.selectedIndex.set(0);
    this.focusInput();
  }

  searchFor(query: string): void {
    this.searchQuery = query;
    this.showSuggestions.set(false);
    void this.searchService.search(query);
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.showSuggestions.set(false);
    void this.searchService.search(suggestion);
    this.focusInput();
  }

  openFullSearch(): void {
    const query = this.searchQuery.trim();
    void this.router.navigate(["/search"], {
      queryParams: { q: query || null },
    });
    this.close();
  }

  onEnter(): void {
    // If suggestions are showing, select the first suggestion
    if (this.showSuggestions() && this.searchService.suggestions().length > 0) {
      this.selectSuggestion(this.searchService.suggestions()[0]);
      return;
    }

    // If we have search results, select the current result
    const results = this.searchService.results();
    if (results.length > 0) {
      this.selectResult(results[this.selectedIndex()]);
      return;
    }

    // If no query, navigate to selected quick action
    if (!this.searchQuery) {
      const route = this.quickActionRoutes[this.quickActionIndex()];
      if (route) {
        this.navigateTo(route);
      }
      return;
    }

    this.openFullSearch();
  }

  onArrowDown(event: Event): void {
    event.preventDefault();

    // If we have search results, navigate results
    const results = this.searchService.results();
    if (results.length > 0) {
      if (this.selectedIndex() < results.length - 1) {
        this.selectedIndex.update((i) => i + 1);
      }
      return;
    }

    // If no query, navigate Quick Actions grid (2x2)
    if (!this.searchQuery) {
      const current = this.quickActionIndex();
      // Move down in 2x2 grid (0->2, 1->3)
      if (current < 2) {
        this.quickActionIndex.set(current + 2);
      }
    }
  }

  onArrowUp(event: Event): void {
    event.preventDefault();

    // If we have search results, navigate results
    const results = this.searchService.results();
    if (results.length > 0) {
      if (this.selectedIndex() > 0) {
        this.selectedIndex.update((i) => i - 1);
      }
      return;
    }

    // If no query, navigate Quick Actions grid (2x2)
    if (!this.searchQuery) {
      const current = this.quickActionIndex();
      // Move up in 2x2 grid (2->0, 3->1)
      if (current >= 2) {
        this.quickActionIndex.set(current - 2);
      }
    }
  }

  onArrowLeft(event: Event): void {
    // Only for Quick Actions when no query - don't prevent default when typing
    if (!this.searchQuery && this.searchService.results().length === 0) {
      event.preventDefault();
      const current = this.quickActionIndex();
      // Move left in 2x2 grid (1->0, 3->2)
      if (current % 2 === 1) {
        this.quickActionIndex.set(current - 1);
      }
    }
  }

  onArrowRight(event: Event): void {
    // Only for Quick Actions when no query - don't prevent default when typing
    if (!this.searchQuery && this.searchService.results().length === 0) {
      event.preventDefault();
      const current = this.quickActionIndex();
      // Move right in 2x2 grid (0->1, 2->3)
      if (current % 2 === 0) {
        this.quickActionIndex.set(current + 1);
      }
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
    return this.typeLabels[type] || type;
  }

  /**
   * Highlight matching text in suggestion
   */
  highlightSuggestion(suggestion: string): string {
    if (!this.searchQuery) return suggestion;

    const escapedQuery = this.searchQuery.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    return suggestion.replace(regex, "<mark>$1</mark>");
  }
}
