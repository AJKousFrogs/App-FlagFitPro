/**
 * Angular 21 Resource API Service
 *
 * Provides declarative data fetching using Angular's new resource() API.
 * This replaces traditional RxJS-based data fetching with signal-based resources.
 *
 * Benefits:
 * - Automatic loading/error states
 * - Signal-based reactivity (zoneless compatible)
 * - Built-in caching and request deduplication
 * - Declarative data dependencies
 *
 * @version 1.0.0 - Angular 21
 */

import {
  Injectable,
  inject,
  signal,
  computed,
  resource,
  ResourceRef,
  ResourceStatus,
  linkedSignal,
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "./logger.service";

// ============================================================================
// Resource Types
// ============================================================================

export interface ResourceState<T> {
  data: T | undefined;
  status: ResourceStatus;
  error: unknown;
  isLoading: boolean;
  isResolved: boolean;
  isError: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ResourceOptions<T> {
  /** Initial data before first load */
  initialValue?: T;
  /** Cache key for request deduplication */
  cacheKey?: string;
  /** Stale time in ms before refetch */
  staleTime?: number;
}

// ============================================================================
// Resource Service
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class ResourceService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);

  // Cache for resource deduplication
  private resourceCache = new Map<string, ResourceRef<unknown>>();

  /**
   * Create a resource for fetching data with automatic state management
   *
   * @example
   * // In a component:
   * private resourceService = inject(ResourceService);
   *
   * // Create a resource that depends on a signal
   * userId = signal<string>('123');
   * userResource = this.resourceService.createResource(
   *   () => `/api/users/${this.userId()}`,
   *   { cacheKey: 'user' }
   * );
   *
   * // Access in template:
   * @if (userResource.isLoading()) {
   *   <app-skeleton />
   * } @else if (userResource.error()) {
   *   <app-error [error]="userResource.error()" />
   * } @else {
   *   <div>{{ userResource.value()?.name }}</div>
   * }
   */
  createResource<T>(
    urlFn: () => string,
    options: ResourceOptions<T> = {},
  ): ResourceRef<T | undefined> {
    const { cacheKey, initialValue } = options;

    // Check cache for existing resource
    if (cacheKey && this.resourceCache.has(cacheKey)) {
      return this.resourceCache.get(cacheKey) as ResourceRef<T>;
    }

    const resourceRef = resource<T, string>({
      params: urlFn,
      loader: async (loaderParams) => {
        const url = loaderParams.params ?? "";
        // const abortSignal = loaderParams.abortSignal; // Available for cancellation
        this.logger.debug(`[Resource] Fetching: ${url}`);

        try {
          const response = await firstValueFrom(
            this.http.get<T>(url, {
              // Note: AbortSignal integration requires custom handling
            }),
          );
          this.logger.debug(`[Resource] Success: ${url}`);
          return response;
        } catch (error) {
          this.logger.error(`[Resource] Error fetching ${url}:`, error);
          throw error;
        }
      },
    });

    // Cache the resource
    if (cacheKey) {
      this.resourceCache.set(cacheKey, resourceRef as ResourceRef<unknown>);
    }

    return resourceRef;
  }

  /**
   * Create a resource for POST/PUT/DELETE operations
   */
  createMutationResource<TInput, TOutput>(
    urlFn: () => string,
    method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  ): {
    mutate: (data: TInput) => Promise<TOutput>;
    isLoading: () => boolean;
    error: () => unknown;
  } {
    const isLoading = signal(false);
    const error = signal<unknown>(null);

    const mutate = async (data: TInput): Promise<TOutput> => {
      const url = urlFn();
      isLoading.set(true);
      error.set(null);

      try {
        let response: TOutput;

        switch (method) {
          case "POST":
            response = await firstValueFrom(this.http.post<TOutput>(url, data));
            break;
          case "PUT":
            response = await firstValueFrom(this.http.put<TOutput>(url, data));
            break;
          case "PATCH":
            response = await firstValueFrom(
              this.http.patch<TOutput>(url, data),
            );
            break;
          case "DELETE":
            response = await firstValueFrom(this.http.delete<TOutput>(url));
            break;
        }

        this.logger.debug(`[Mutation] ${method} ${url} success`);
        return response;
      } catch (err) {
        this.logger.error(`[Mutation] ${method} ${url} error:`, err);
        error.set(err);
        throw err;
      } finally {
        isLoading.set(false);
      }
    };

    return {
      mutate,
      isLoading: isLoading.asReadonly(),
      error: error.asReadonly(),
    };
  }

  /**
   * Create a paginated resource with automatic page management
   */
  createPaginatedResource<T>(
    baseUrlFn: () => string,
    pageSize: number = 20,
  ): {
    resource: ResourceRef<PaginatedResponse<T> | undefined>;
    page: ReturnType<typeof signal<number>>;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
  } {
    const page = signal(1);

    const resourceRef = resource<PaginatedResponse<T>, string>({
      params: () => {
        const baseUrl = baseUrlFn();
        const separator = baseUrl.includes("?") ? "&" : "?";
        return `${baseUrl}${separator}page=${page()}&pageSize=${pageSize}`;
      },
      loader: async (loaderParams) => {
        const url = loaderParams.params ?? "";
        this.logger.debug(`[PaginatedResource] Fetching: ${url}`);
        return firstValueFrom(this.http.get<PaginatedResponse<T>>(url));
      },
    });

    return {
      resource: resourceRef,
      page,
      nextPage: () => page.update((p) => p + 1),
      prevPage: () => page.update((p) => Math.max(1, p - 1)),
      goToPage: (p: number) => page.set(Math.max(1, p)),
    };
  }

  /**
   * Clear cached resources
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.resourceCache.delete(cacheKey);
    } else {
      this.resourceCache.clear();
    }
    this.logger.debug(`[Resource] Cache cleared: ${cacheKey || "all"}`);
  }

  /**
   * Get resource state as a computed signal
   */
  getResourceState<T>(resourceRef: ResourceRef<T>): () => ResourceState<T> {
    return computed(() => ({
      data: resourceRef.value(),
      status: resourceRef.status(),
      error: resourceRef.error(),
      isLoading: resourceRef.isLoading(),
      isResolved: resourceRef.status() === (4 as unknown as ResourceStatus), // ResourceStatus.Resolved
      isError: resourceRef.status() === (5 as unknown as ResourceStatus), // ResourceStatus.Error
    }));
  }
}

// ============================================================================
// Resource Utilities
// ============================================================================

/**
 * Create a linked signal that syncs with a resource value
 * Useful for forms that need to edit resource data
 */
export function createEditableResource<T>(
  resourceRef: ResourceRef<T>,
  defaultValue: T,
): ReturnType<typeof linkedSignal<T | undefined, T>> {
  return linkedSignal<T | undefined, T>({
    source: () => resourceRef.value(),
    computation: (value) => value ?? defaultValue,
  });
}

/**
 * Combine multiple resources into a single loading state
 */
export function combineResourceLoading(
  ...resources: ResourceRef<unknown>[]
): () => boolean {
  return computed(() => resources.some((r) => r.isLoading()));
}

/**
 * Combine multiple resources into a single error state
 */
export function combineResourceErrors(
  ...resources: ResourceRef<unknown>[]
): () => unknown[] {
  return computed(() =>
    resources.map((r) => r.error()).filter((e) => e !== null),
  );
}
