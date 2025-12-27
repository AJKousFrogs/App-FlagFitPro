/**
 * Unsaved Changes Guard
 *
 * Prevents users from accidentally navigating away from pages with unsaved changes.
 * Components must implement the CanComponentDeactivate interface.
 */

import { inject } from "@angular/core";
import { CanDeactivateFn } from "@angular/router";
import { ConfirmDialogService } from "../services/confirm-dialog.service";

/**
 * Interface that components must implement to use this guard
 */
export interface CanComponentDeactivate {
  /**
   * Return true if component has unsaved changes
   */
  hasUnsavedChanges(): boolean;

  /**
   * Optional: Custom message to show in the confirmation dialog
   */
  getUnsavedChangesMessage?(): string;
}

/**
 * Type guard to check if a component implements CanComponentDeactivate
 */
function isCanComponentDeactivate(component: unknown): component is CanComponentDeactivate {
  return (
    component !== null &&
    typeof component === "object" &&
    "hasUnsavedChanges" in component &&
    typeof (component as CanComponentDeactivate).hasUnsavedChanges === "function"
  );
}

/**
 * Functional guard that checks for unsaved changes before navigation
 */
export const unsavedChangesGuard: CanDeactivateFn<unknown> = async (component) => {
  const confirmService = inject(ConfirmDialogService);

  // If component doesn't implement the interface, allow navigation
  if (!isCanComponentDeactivate(component)) {
    return true;
  }

  // If no unsaved changes, allow navigation
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  // Get custom message or use default
  const message = component.getUnsavedChangesMessage?.() ||
    "You have unsaved changes. Are you sure you want to leave this page?";

  // Show confirmation dialog
  return confirmService.confirm({
    title: "Unsaved Changes",
    message,
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Leave",
    rejectLabel: "Stay",
    acceptSeverity: "danger",
    defaultFocus: "reject",
  });
};

/**
 * Helper mixin for components that need unsaved changes tracking
 * 
 * Usage:
 * ```typescript
 * export class MyComponent implements CanComponentDeactivate {
 *   private formDirty = false;
 *   
 *   hasUnsavedChanges(): boolean {
 *     return this.formDirty;
 *   }
 * }
 * ```
 */
export abstract class UnsavedChangesMixin {
  protected isDirty = false;

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  protected markDirty(): void {
    this.isDirty = true;
  }

  protected markClean(): void {
    this.isDirty = false;
  }
}
