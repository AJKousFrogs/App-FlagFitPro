/**
 * Data State Management Utilities
 *
 * Common patterns for managing data loading, pagination, filtering
 * Reduces boilerplate across components
 */

import { signal, computed, WritableSignal, Signal } from "@angular/core";

/**
 * Pagination state
 */
export interface PaginationState {
  currentPage: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  totalCount: WritableSignal<number>;
  hasNextPage: Signal<boolean>;
  hasPreviousPage: Signal<boolean>;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
}

/**
 * Create pagination state manager
 * @example
 * const pagination = createPagination(25);
 * pagination.nextPage()
 * pagination.goToPage(5)
 */
export function createPagination(pageSize = 10): PaginationState {
  const currentPage = signal(1);
  const pageSize_ = signal(pageSize);
  const totalCount = signal(0);

  const hasNextPage = computed(
    () => currentPage() * pageSize_() < totalCount(),
  );
  const hasPreviousPage = computed(() => currentPage() > 1);

  return {
    currentPage,
    pageSize: pageSize_,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    nextPage: () => {
      if (hasNextPage()) {
        currentPage.set(currentPage() + 1);
      }
    },
    previousPage: () => {
      if (hasPreviousPage()) {
        currentPage.set(currentPage() - 1);
      }
    },
    goToPage: (page: number) => {
      if (page > 0) {
        currentPage.set(page);
      }
    },
    reset: () => {
      currentPage.set(1);
      totalCount.set(0);
    },
  };
}

/**
 * Filterable list state
 */
export interface FilteredListState<T> {
  allItems: WritableSignal<T[]>;
  searchQuery: WritableSignal<string>;
  filteredItems: Signal<T[]>;
  setFilterFn: (fn: (item: T, query: string) => boolean) => void;
  clear: () => void;
}

/**
 * Create filtered list state
 * @example
 * const list = createFilteredList<User>([]);
 * list.searchQuery.set('john')
 * list.filteredItems() // filtered results
 */
export function createFilteredList<T>(
  initialItems: T[] = [],
  defaultFilterFn?: (item: T, query: string) => boolean,
): FilteredListState<T> {
  const allItems = signal(initialItems);
  const searchQuery = signal("");
  let filterFn = defaultFilterFn || ((item: T, query: string) => {
    return JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
  });

  const filteredItems = computed(() => {
    const query = searchQuery();
    if (!query) return allItems();
    return allItems().filter((item) => filterFn(item, query));
  });

  return {
    allItems,
    searchQuery,
    filteredItems,
    setFilterFn: (fn) => {
      filterFn = fn;
    },
    clear: () => {
      allItems.set([]);
      searchQuery.set("");
    },
  };
}

/**
 * Loading state with retry capability
 */
export interface LoadableState<T> {
  data: WritableSignal<T | null>;
  isLoading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  retry: () => Promise<void>;
  reset: () => void;
  hasError: Signal<boolean>;
}

/**
 * Create loadable data state
 * @example
 * const data = createLoadableState<User>(async () => fetchUser());
 * await data.retry()
 */
export function createLoadableState<T>(
  loadFn: () => Promise<T>,
): LoadableState<T> {
  const data = signal<T | null>(null);
  const isLoading = signal(false);
  const error = signal<string | null>(null);
  const hasError = computed(() => error() !== null);

  return {
    data,
    isLoading,
    error,
    hasError,
    async retry() {
      isLoading.set(true);
      error.set(null);

      try {
        const result = await loadFn();
        data.set(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data";
        error.set(message);
      } finally {
        isLoading.set(false);
      }
    },
    reset() {
      data.set(null);
      isLoading.set(false);
      error.set(null);
    },
  };
}

/**
 * Sortable list state
 */
export interface SortConfig<T> {
  field: keyof T;
  ascending: boolean;
}

export interface SortableListState<T> extends FilteredListState<T> {
  sort: WritableSignal<SortConfig<T> | null>;
  setSortField: (field: keyof T) => void;
  toggleSort: () => void;
  sortedItems: Signal<T[]>;
}

/**
 * Create sortable and filterable list
 */
export function createSortableList<T>(
  initialItems: T[] = [],
  filterFn?: (item: T, query: string) => boolean,
): SortableListState<T> {
  const base = createFilteredList(initialItems, filterFn);
  const sort = signal<SortConfig<T> | null>(null);

  const sortedItems = computed(() => {
    const items = base.filteredItems();
    const sortConfig = sort();

    if (!sortConfig) return items;

    const sorted = [...items].sort((a, b) => {
      const aVal = a[sortConfig.field];
      const bVal = b[sortConfig.field];

      if (aVal < bVal) return sortConfig.ascending ? -1 : 1;
      if (aVal > bVal) return sortConfig.ascending ? 1 : -1;
      return 0;
    });

    return sorted;
  });

  return {
    ...base,
    sort,
    setSortField: (field: keyof T) => {
      const current = sort();
      if (current?.field === field) {
        sort.set({ field, ascending: !current.ascending });
      } else {
        sort.set({ field, ascending: true });
      }
    },
    toggleSort: () => {
      const current = sort();
      if (current) {
        sort.set({ ...current, ascending: !current.ascending });
      }
    },
    sortedItems,
  };
}
