/**
 * Signal Pattern Utilities
 *
 * Common patterns for signal-based state management
 * Reduces boilerplate in components
 */

import { signal, Signal, WritableSignal } from "@angular/core";

/**
 * Toggle signal between true/false
 * @example
 * toggleSignal(this.showDialog)
 */
export function toggleSignal(sig: WritableSignal<boolean>): void {
  sig.set(!sig());
}

/**
 * Set signal to true
 * @example
 * openDialog(this.showDialog)
 */
export function setSignalTrue(sig: WritableSignal<boolean>): void {
  sig.set(true);
}

/**
 * Set signal to false
 * @example
 * closeDialog(this.showDialog)
 */
export function setSignalFalse(sig: WritableSignal<boolean>): void {
  sig.set(false);
}

/**
 * Toggle visibility signal pattern
 * Creates open/close methods for visibility signals
 * @example
 * const dialog = createTogglableSignal();
 * dialog.open() // visible.set(true)
 * dialog.close() // visible.set(false)
 * dialog.toggle() // visible.set(!visible())
 */
export function createTogglableSignal(initialValue = false): {
  visible: WritableSignal<boolean>;
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: Signal<boolean>;
} {
  const visible = signal(initialValue);

  return {
    visible,
    open: () => visible.set(true),
    close: () => visible.set(false),
    toggle: () => visible.set(!visible()),
    isOpen: visible,
  };
}

/**
 * Create a dialog state manager
 * Manages visibility + form data
 * @example
 * const formDialog = createDialogState<FormData>(defaultData);
 * formDialog.open()
 * formDialog.setData(newData)
 * formDialog.getData()
 */
export function createDialogState<T>(defaultData: T): {
  visible: WritableSignal<boolean>;
  data: WritableSignal<T>;
  open: (initialData?: T) => void;
  close: () => void;
  toggle: () => void;
  getData: Signal<T>;
  isOpen: Signal<boolean>;
} {
  const visible = signal(false);
  const data = signal(defaultData);

  return {
    visible,
    data,
    open: (initialData?: T) => {
      if (initialData) data.set(initialData);
      visible.set(true);
    },
    close: () => visible.set(false),
    toggle: () => visible.set(!visible()),
    getData: data,
    isOpen: visible,
  };
}

/**
 * Create async operation state
 * Manages loading/error states for async operations
 * @example
 * const operation = createAsyncState();
 * await operation.execute(async () => fetchData())
 * operation.isLoading() // false when complete
 * operation.error() // error message if failed
 */
export function createAsyncState<T = void>(): {
  isLoading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  data: WritableSignal<T | null>;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
} {
  const isLoading = signal(false);
  const error = signal<string | null>(null);
  const data = signal<T | null>(null);

  return {
    isLoading,
    error,
    data,
    async execute(fn: () => Promise<T>): Promise<T | null> {
      isLoading.set(true);
      error.set(null);

      try {
        const result = await fn();
        data.set(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        error.set(message);
        return null;
      } finally {
        isLoading.set(false);
      }
    },
    reset: () => {
      isLoading.set(false);
      error.set(null);
      data.set(null);
    },
  };
}

/**
 * Create loading state with optional data
 * @example
 * const loader = createLoadingState();
 * loader.startLoading()
 * await someOperation()
 * loader.stopLoading()
 */
export function createLoadingState(): {
  isLoading: WritableSignal<boolean>;
  startLoading: () => void;
  stopLoading: () => void;
  isNotLoading: Signal<boolean>;
} {
  const isLoading = signal(false);

  return {
    isLoading,
    startLoading: () => isLoading.set(true),
    stopLoading: () => isLoading.set(false),
    isNotLoading: new Signal(() => !isLoading()),
  };
}
