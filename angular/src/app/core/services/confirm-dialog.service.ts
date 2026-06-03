/**
 * Confirmation Dialog Service
 *
 * Provides a centralized way to show confirmation dialogs
 * for destructive actions throughout the application.
 */

import { Injectable } from "@angular/core";

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptIcon?: string;
  rejectIcon?: string;
  acceptSeverity?:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "help"
    | "contrast";
  rejectSeverity?:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "help"
    | "contrast";
  defaultFocus?: "accept" | "reject" | "close";
}

export type ConfirmationType =
  | "delete"
  | "remove"
  | "archive"
  | "logout"
  | "discard"
  | "reset"
  | "leave"
  | "custom";

@Injectable({
  providedIn: "root",
})
export class ConfirmDialogService {
  // Predefined confirmation configurations
  private readonly presets: Record<string, Partial<ConfirmDialogOptions>> = {
    delete: {
      title: "Confirm Deletion",
      icon: "pi pi-trash",
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      acceptSeverity: "danger",
      defaultFocus: "reject",
    },
    remove: {
      title: "Confirm Removal",
      icon: "pi pi-times-circle",
      acceptLabel: "Remove",
      rejectLabel: "Cancel",
      acceptSeverity: "warning",
      defaultFocus: "reject",
    },
    archive: {
      title: "Archive Item",
      icon: "pi pi-inbox",
      acceptLabel: "Archive",
      rejectLabel: "Cancel",
      acceptSeverity: "secondary",
      defaultFocus: "accept",
    },
    logout: {
      title: "Confirm Logout",
      icon: "pi pi-sign-out",
      acceptLabel: "Logout",
      rejectLabel: "Stay",
      acceptSeverity: "primary",
      defaultFocus: "reject",
    },
    discard: {
      title: "Discard Changes",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Discard",
      rejectLabel: "Keep Editing",
      acceptSeverity: "danger",
      defaultFocus: "reject",
    },
    reset: {
      title: "Confirm Reset",
      icon: "pi pi-refresh",
      acceptLabel: "Reset",
      rejectLabel: "Cancel",
      acceptSeverity: "warning",
      defaultFocus: "reject",
    },
    leave: {
      title: "Leave Page?",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Leave",
      rejectLabel: "Stay",
      acceptSeverity: "danger",
      defaultFocus: "reject",
    },
  };

  /**
   * Show a confirmation dialog and return a promise
   */
  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    // Native confirm — PrimeNG's <p-confirmDialog> isn't part of the rebuilt UI.
    // Components that need a styled confirm use an inline confirm gate (e.g. the
    // Settings delete-account flow) rather than this service.
    const title = options.title ? `${options.title}\n\n` : "";
    const ok =
      typeof window !== "undefined" && typeof window.confirm === "function"
        ? window.confirm(`${title}${options.message}`)
        : true;
    return Promise.resolve(ok);
  }

  /**
   * Show a preset confirmation dialog
   */
  confirmPreset(
    type: ConfirmationType,
    message: string,
    customOptions?: Partial<ConfirmDialogOptions>,
  ): Promise<boolean> {
    const preset = this.presets[type] || {};
    return this.confirm({
      ...preset,
      message,
      ...customOptions,
    });
  }

  /**
   * Confirm deletion of an item
   */
  confirmDelete(itemName: string, customMessage?: string): Promise<boolean> {
    return this.confirmPreset(
      "delete",
      customMessage ||
        `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    );
  }

  /**
   * Confirm removal of an item (less severe than delete)
   */
  confirmRemove(itemName: string, customMessage?: string): Promise<boolean> {
    return this.confirmPreset(
      "remove",
      customMessage || `Are you sure you want to remove "${itemName}"?`,
    );
  }

  /**
   * Confirm archiving an item
   */
  confirmArchive(itemName: string, customMessage?: string): Promise<boolean> {
    return this.confirmPreset(
      "archive",
      customMessage ||
        `Are you sure you want to archive "${itemName}"? You can restore it later.`,
    );
  }

  /**
   * Confirm logout
   */
  confirmLogout(): Promise<boolean> {
    return this.confirmPreset(
      "logout",
      "Are you sure you want to log out? Any unsaved changes will be lost.",
    );
  }

  /**
   * Confirm discarding unsaved changes
   */
  confirmDiscard(context?: string): Promise<boolean> {
    const message = context
      ? `You have unsaved changes in ${context}. Are you sure you want to discard them?`
      : "You have unsaved changes. Are you sure you want to discard them?";
    return this.confirmPreset("discard", message);
  }

  /**
   * Confirm resetting form/data
   */
  confirmReset(context?: string): Promise<boolean> {
    const message = context
      ? `Are you sure you want to reset ${context}? This will clear all current data.`
      : "Are you sure you want to reset? This will clear all current data.";
    return this.confirmPreset("reset", message);
  }

  /**
   * Confirm leaving page with unsaved changes
   */
  confirmLeave(): Promise<boolean> {
    return this.confirmPreset(
      "leave",
      "You have unsaved changes. Are you sure you want to leave this page?",
    );
  }

  /**
   * Confirm bulk action
   */
  confirmBulkAction(
    action: string,
    count: number,
    itemType: string,
  ): Promise<boolean> {
    return this.confirm({
      title: `Confirm Bulk ${action}`,
      message: `Are you sure you want to ${action.toLowerCase()} ${count} ${itemType}${count > 1 ? "s" : ""}?`,
      icon: "pi pi-exclamation-triangle",
      acceptLabel: action,
      rejectLabel: "Cancel",
      acceptSeverity: action.toLowerCase() === "delete" ? "danger" : "warning",
      defaultFocus: "reject",
    });
  }

  /**
   * Confirm status change
   */
  confirmStatusChange(
    itemName: string,
    fromStatus: string,
    toStatus: string,
  ): Promise<boolean> {
    return this.confirm({
      title: "Confirm Status Change",
      message: `Are you sure you want to change "${itemName}" from ${fromStatus} to ${toStatus}?`,
      icon: "pi pi-sync",
      acceptLabel: "Change Status",
      rejectLabel: "Cancel",
      acceptSeverity: "primary",
      defaultFocus: "accept",
    });
  }

}
