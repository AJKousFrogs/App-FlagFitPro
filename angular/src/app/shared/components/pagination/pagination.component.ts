import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";

/**
 * Pagination Component - Angular 19+
 *
 * A reusable pagination component for navigating through paginated data
 * Uses Angular signals for reactive state management
 */
@Component({
  selector: "app-pagination",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule],
  template: `
    <nav
      class="pagination-container"
      [class.pagination-compact]="variant() === 'compact'"
      [attr.aria-label]="ariaLabel() || 'Pagination'"
    >
      <!-- Page Info -->
      @if (showPageInfo()) {
        <div class="pagination-info">
          <span class="pagination-text">
            Showing {{ startItem() }} - {{ endItem() }} of {{ totalItems() }}
          </span>
        </div>
      }

      <!-- Pagination Controls -->
      <div class="pagination-controls">
        <!-- First Page -->
        @if (showFirstLast()) {
          <p-button
            icon="pi pi-angle-double-left"
            [text]="true"
            [disabled]="currentPage() === 1"
            (onClick)="goToPage(1)"
            [attr.aria-label]="'Go to first page'"
            class="pagination-btn pagination-first"
          >
          </p-button>
        }

        <!-- Previous Page -->
        <p-button
          icon="pi pi-angle-left"
          [text]="true"
          [disabled]="currentPage() === 1"
          (onClick)="goToPage(currentPage() - 1)"
          [attr.aria-label]="'Go to previous page'"
          class="pagination-btn pagination-prev"
        >
        </p-button>

        <!-- Page Numbers -->
        @if (variant() !== "compact") {
          <div class="pagination-pages">
            @for (page of visiblePages(); track page) {
              @if (page === "ellipsis") {
                <span class="pagination-ellipsis">...</span>
              } @else {
                <button
                  type="button"
                  class="pagination-page"
                  [class.active]="page === currentPage()"
                  (click)="goToPage(page)"
                  [attr.aria-label]="'Go to page ' + page"
                  [attr.aria-current]="page === currentPage() ? 'page' : null"
                >
                  {{ page }}
                </button>
              }
            }
          </div>
        } @else {
          <div class="pagination-page-info">
            <span class="current-page">{{ currentPage() }}</span>
            <span class="separator">/</span>
            <span class="total-pages">{{ totalPages() }}</span>
          </div>
        }

        <!-- Next Page -->
        <p-button
          icon="pi pi-angle-right"
          [text]="true"
          [disabled]="currentPage() === totalPages()"
          (onClick)="goToPage(currentPage() + 1)"
          [attr.aria-label]="'Go to next page'"
          class="pagination-btn pagination-next"
        >
        </p-button>

        <!-- Last Page -->
        @if (showFirstLast()) {
          <p-button
            icon="pi pi-angle-double-right"
            [text]="true"
            [disabled]="currentPage() === totalPages()"
            (onClick)="goToPage(totalPages())"
            [attr.aria-label]="'Go to last page'"
            class="pagination-btn pagination-last"
          >
          </p-button>
        }
      </div>

      <!-- Items Per Page Selector -->
      @if (showItemsPerPage()) {
        <div class="pagination-items-per-page">
          <label for="items-per-page-select">Items per page:</label>
          <select
            id="items-per-page-select"
            [value]="itemsPerPage()"
            (change)="onItemsPerPageChange($any($event.target).value)"
            class="items-per-page-select"
          >
            @for (option of itemsPerPageOptions(); track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </div>
      }
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pagination-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4, 1rem);
        padding: var(--space-4, 1rem);
        flex-wrap: wrap;
      }

      .pagination-info {
        display: flex;
        align-items: center;
      }

      .pagination-text {
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: var(--space-1, 0.25rem);
      }

      .pagination-btn {
        min-width: 2.5rem;
        height: 2.5rem;
      }

      .pagination-pages {
        display: flex;
        align-items: center;
        gap: var(--space-1, 0.25rem);
      }

      .pagination-page {
        min-width: 2.5rem;
        height: 2.5rem;
        padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
        border: 1px solid var(--p-surface-border, #dee2e6);
        background: var(--p-surface-0, #ffffff);
        color: var(--text-primary, #1a1a1a);
        border-radius: var(--p-border-radius, 0.5rem);
        cursor: pointer;
        transition: all 0.2s;
        font-size: var(--font-body-md, 1rem);
      }

      .pagination-page:hover:not(.active):not(:disabled) {
        background: var(--p-surface-50, #f8faf9);
        border-color: var(--color-brand-primary, #089949);
      }

      .pagination-page.active {
        background: var(--color-brand-primary, #089949);
        color: var(--color-text-on-primary, #ffffff);
        border-color: var(--color-brand-primary, #089949);
        font-weight: 600;
      }

      .pagination-page:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pagination-ellipsis {
        padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
        color: var(--text-secondary, #6b7280);
      }

      .pagination-page-info {
        display: flex;
        align-items: center;
        gap: var(--space-1, 0.25rem);
        padding: 0 var(--space-2, 0.5rem);
        font-size: var(--font-body-md, 1rem);
        color: var(--text-primary, #1a1a1a);
      }

      .current-page {
        font-weight: 600;
      }

      .separator {
        color: var(--text-secondary, #6b7280);
      }

      .pagination-items-per-page {
        display: flex;
        align-items: center;
        gap: var(--space-2, 0.5rem);
      }

      .pagination-items-per-page label {
        font-size: var(--font-body-sm, 0.875rem);
        color: var(--text-secondary, #6b7280);
      }

      .items-per-page-select {
        padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
        border: 1px solid var(--p-surface-border, #dee2e6);
        border-radius: var(--p-border-radius, 0.5rem);
        background: var(--p-surface-0, #ffffff);
        color: var(--text-primary, #1a1a1a);
        font-size: var(--font-body-sm, 0.875rem);
        cursor: pointer;
      }

      .items-per-page-select:hover {
        border-color: var(--color-brand-primary, #089949);
      }

      /* Compact variant */
      .pagination-compact {
        justify-content: center;
      }

      .pagination-compact .pagination-info {
        display: none;
      }

      .pagination-compact .pagination-items-per-page {
        display: none;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .pagination-container {
          flex-direction: column;
          align-items: stretch;
        }

        .pagination-controls {
          justify-content: center;
        }

        .pagination-pages {
          display: none;
        }

        .pagination-page-info {
          display: flex;
        }
      }
    `,
  ],
})
export class PaginationComponent {
  // Configuration
  currentPage = input.required<number>();
  totalItems = input.required<number>();
  itemsPerPage = input<number>(10);
  itemsPerPageOptions = input<number[]>([10, 25, 50, 100]);
  maxVisiblePages = input<number>(5);
  variant = input<"default" | "compact">("default");
  showPageInfo = input<boolean>(true);
  showFirstLast = input<boolean>(true);
  showItemsPerPage = input<boolean>(false);
  ariaLabel = input<string>();

  // Outputs
  pageChange = output<number>();
  itemsPerPageChange = output<number>();

  // Computed values
  totalPages = computed(() => {
    return Math.ceil(this.totalItems() / this.itemsPerPage());
  });

  startItem = computed(() => {
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItem = computed(() => {
    const end = this.currentPage() * this.itemsPerPage();
    return Math.min(end, this.totalItems());
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = this.maxVisiblePages();
    const pages: (number | "ellipsis")[] = [];

    if (total <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible range
      let start = Math.max(2, current - Math.floor(maxVisible / 2));
      let end = Math.min(total - 1, start + maxVisible - 3);

      // Adjust if we're near the end
      if (end === total - 1) {
        start = Math.max(2, total - maxVisible + 2);
      }

      // Add ellipsis before range if needed
      if (start > 2) {
        pages.push("ellipsis");
      }

      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis after range if needed
      if (end < total - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  onItemsPerPageChange(value: string): void {
    const newItemsPerPage = parseInt(value, 10);
    this.itemsPerPageChange.emit(newItemsPerPage);
  }
}
