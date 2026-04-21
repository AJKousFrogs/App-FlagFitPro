import { Injectable, signal, computed } from "@angular/core";

export interface LoadingState {
  id: string;
  message: string;
  cancellable: boolean;
  onCancel?: () => void;
}

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private activeLoaders = signal<LoadingState[]>([]);

  // Computed value to check if any loader is active
  public isLoading = computed(() => this.activeLoaders().length > 0);

  // Get the most recent loader message
  public currentMessage = computed(() => {
    const loaders = this.activeLoaders();
    return loaders.length > 0
      ? loaders[loaders.length - 1].message
      : "Loading...";
  });

  // Get current active loaders
  public loaders = computed(() => this.activeLoaders());

  /**
   * Show a loading indicator
   */
  show(
    message = "Loading...",
    id: string | null = null,
    cancellable = false,
    onCancel?: () => void,
  ): string {
    const loaderId = id || `loader-${Date.now()}`;

    this.activeLoaders.update((loaders) => [
      ...loaders.filter((l) => l.id !== loaderId),
      { id: loaderId, message, cancellable, onCancel },
    ]);

    return loaderId;
  }

  /**
   * Hide a specific loading indicator or all of them
   */
  hide(id: string | null = null): void {
    if (id) {
      this.activeLoaders.update((loaders) =>
        loaders.filter((l) => l.id !== id),
      );
    } else {
      this.activeLoaders.set([]);
    }
  }

  /**
   * Utility to wrap a promise with loading state
   */
  async useLoading<T>(
    promise: Promise<T>,
    message = "Loading...",
  ): Promise<T> {
    const id = this.show(message);
    try {
      return await promise;
    } finally {
      this.hide(id);
    }
  }
}
