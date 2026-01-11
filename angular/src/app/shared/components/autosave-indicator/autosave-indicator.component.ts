/**
 * Autosave Indicator Component
 *
 * Visual feedback component that shows autosave status.
 * Displays saving, saved, or error states with animations.
 *
 * Usage:
 * <app-autosave-indicator [status]="autosaveStatus()" />
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { getTimeAgo } from "../../utils/date.utils";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

@Component({
  selector: "app-autosave-indicator",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="autosave-indicator"
      [class]="statusClass()"
      [attr.aria-live]="ariaLive()"
    >
      <div class="indicator-content">
        <i [class]="iconClass()" aria-hidden="true"></i>
        <span class="indicator-text">{{ statusText() }}</span>
      </div>
    </div>
  `,
  styleUrl: "./autosave-indicator.component.scss",
})
export class AutosaveIndicatorComponent {
  // Inputs
  status = input<AutosaveStatus>("idle");
  lastSaved = input<Date | null>(null);

  // Computed properties
  statusClass = computed(() => {
    const status = this.status();
    return `status-${status}`;
  });

  iconClass = computed(() => {
    const status = this.status();
    switch (status) {
      case "saving":
        return "pi pi-spin pi-spinner";
      case "saved":
        return "pi pi-check-circle";
      case "error":
        return "pi pi-exclamation-triangle";
      default:
        return "";
    }
  });

  statusText = computed(() => {
    const status = this.status();
    const lastSaved = this.lastSaved();

    switch (status) {
      case "saving":
        return "Saving...";
      case "saved":
        if (lastSaved) {
          return `Saved ${this.formatTimestamp(lastSaved)}`;
        }
        return "Saved";
      case "error":
        return "Save failed";
      default:
        return "";
    }
  });

  ariaLive = computed(() => {
    const status = this.status();
    // Announce saving and error states assertively, saved state politely
    return status === "saving" || status === "error" ? "assertive" : "polite";
  });

  /**
   * Format timestamp relative to now
   */
  private formatTimestamp = (date: Date): string => getTimeAgo(date);
}
