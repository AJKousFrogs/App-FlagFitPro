import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { SearchResult, SearchService } from "../../core/services/search.service";

@Component({
  selector: "app-search",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MainLayoutComponent,
    PageHeaderComponent,
    SearchInputComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    ButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="search-page ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Search"
          subtitle="Find players, exercises, videos, programs, and team content"
          icon="pi-search"
        />

        <section class="search-page__controls ds-card-surface">
          <app-search-input
            [formControl]="searchControl"
            placeholder="Search players, exercises, videos, and more..."
            ariaLabel="Search across FlagFit Pro"
          />
        </section>

        @if (searchService.loading()) {
          <section class="search-page__state ds-card-surface">
            <app-loading
              [visible]="true"
              variant="skeleton"
              message="Searching across FlagFit Pro..."
            />
          </section>
        } @else if (searchService.error()) {
          <section class="search-page__state ds-card-surface">
            <app-page-error-state
              title="Unable to search right now"
              [message]="searchService.error() || 'Something went wrong while searching.'"
              (retry)="repeatSearch()"
            />
          </section>
        } @else if (hasQuery() && searchService.results().length === 0) {
          <section class="search-page__state ds-card-surface">
            <app-empty-state
              [useCard]="false"
              icon="pi-search"
              heading="No results found"
              [description]="'Try broader terms or search a different keyword.'"
            />
          </section>
        } @else if (!hasQuery()) {
          <section class="search-page__suggestions">
            <div class="search-card ds-card-surface">
              <div class="search-card__header">
                <h2>Quick Links</h2>
              </div>
              <div class="quick-links-grid">
                @for (link of quickLinks; track link.route) {
                  <button type="button" class="quick-link-card" (click)="goTo(link.route)">
                    <i [class]="'pi ' + link.icon"></i>
                    <div>
                      <div class="quick-link-card__label">{{ link.label }}</div>
                      <div class="quick-link-card__description">{{ link.description }}</div>
                    </div>
                  </button>
                }
              </div>
            </div>

            <div class="search-card ds-card-surface">
              <div class="search-card__header">
                <h2>Recent Searches</h2>
                @if (searchService.recentSearches().length > 0) {
                  <app-button variant="text" size="sm" (clicked)="clearRecentSearches()">
                    Clear
                  </app-button>
                }
              </div>

              @if (searchService.recentSearches().length > 0) {
                <div class="search-tags">
                  @for (recent of searchService.recentSearches(); track recent) {
                    <button type="button" class="search-tag" (click)="runSearch(recent)">
                      {{ recent }}
                    </button>
                  }
                </div>
              } @else {
                <p class="search-card__empty">No recent searches yet.</p>
              }
            </div>
          </section>
        } @else {
          <section class="search-page__results ds-card-surface">
            <div class="results-header">
              <h2>Search Results</h2>
              <span>{{ searchService.totalResults() }} found</span>
            </div>

            <div class="results-list">
              @for (result of searchService.results(); track result.id) {
                <button
                  type="button"
                  class="result-item"
                  (click)="openResult(result)"
                >
                  <div class="result-item__icon" [class]="'type-' + result.type">
                    <i [class]="result.icon"></i>
                  </div>
                  <div class="result-item__body">
                    <div class="result-item__top">
                      <span
                        class="result-item__title"
                        [innerHTML]="result.highlightedTitle || result.title"
                      ></span>
                      <span class="result-item__type">{{ result.type }}</span>
                    </div>
                    @if (result.subtitle) {
                      <div
                        class="result-item__subtitle"
                        [innerHTML]="result.highlightedSubtitle || result.subtitle"
                      ></div>
                    }
                    @if (result.description) {
                      <div class="result-item__description">
                        {{ result.description }}
                      </div>
                    }
                  </div>
                  <i class="pi pi-chevron-right result-item__chevron"></i>
                </button>
              }
            </div>
          </section>
        }
      </div>
    </app-main-layout>
  `,
  styleUrl: "./search.component.scss",
})
export class SearchComponent {
  private readonly searchServiceInternal = inject(SearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchService = this.searchServiceInternal;
  readonly searchControl = new FormControl("", { nonNullable: true });
  readonly hasQuery = signal(false);

  readonly quickLinks = [
    {
      label: "Training",
      description: "Schedule, workouts, and planning",
      icon: "pi-calendar",
      route: "/training",
    },
    {
      label: "Exercise Library",
      description: "Browse drills and movements",
      icon: "pi-book",
      route: "/exercise-library",
    },
    {
      label: "Performance",
      description: "Insights, load monitoring, and performance tests",
      icon: "pi-chart-line",
      route: "/performance/insights",
    },
    {
      label: "Roster",
      description: "Players, staff, and team context",
      icon: "pi-users",
      route: "/roster",
    },
  ] as const;

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const query = (params.get("q") ?? "").trim();
        this.hasQuery.set(query.length > 0);
        if (this.searchControl.value !== query) {
          this.searchControl.setValue(query, { emitEvent: false });
        }
        if (query.length >= 2) {
          void this.searchService.search(query);
        } else if (!query) {
          this.searchService.clearResults();
        }
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.hasQuery.set(query.trim().length > 0);
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: query.trim() || null },
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
      });
  }

  runSearch(query: string): void {
    this.searchControl.setValue(query);
  }

  repeatSearch(): void {
    const query = this.searchControl.value.trim();
    if (query.length >= 2) {
      void this.searchService.search(query);
    }
  }

  openResult(result: SearchResult): void {
    void this.router.navigateByUrl(result.route);
  }

  goTo(route: string): void {
    void this.router.navigate([route]);
  }

  clearRecentSearches(): void {
    this.searchService.clearRecentSearches();
  }
}
