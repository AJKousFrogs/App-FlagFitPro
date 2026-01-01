/**
 * Keyboard Shortcuts Modal Component
 *
 * Displays all available keyboard shortcuts in a modal dialog.
 * Triggered by Ctrl+/ or Cmd+/ or ?
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import {
  KeyboardShortcutsService,
  KeyboardShortcut,
  ShortcutCategory,
} from "../../../core/services/keyboard-shortcuts.service";

@Component({
  selector: "app-keyboard-shortcuts-modal",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule, ButtonModule, DividerModule],
  template: `
    <p-dialog
      [visible]="shortcutsService.isHelpModalOpen()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '600px', maxWidth: '95vw', maxHeight: '85vh' }"
      styleClass="shortcuts-modal"
      header="Keyboard Shortcuts"
    >
      <ng-template pTemplate="header">
        <div class="modal-header">
          <div class="header-icon">
            <i class="pi pi-keyboard"></i>
          </div>
          <div class="header-text">
            <h2>Keyboard Shortcuts</h2>
            <p>
              Press <kbd>{{ shortcutsService.modifierKey() }}</kbd> +
              <kbd>/</kbd> or <kbd>?</kbd> to toggle
            </p>
          </div>
        </div>
      </ng-template>

      <div class="shortcuts-content">
        <!-- Navigation -->
        <div class="shortcut-category">
          <h3 class="category-title">
            <i class="pi pi-compass"></i>
            Navigation
          </h3>
          <div class="shortcut-list">
            @for (shortcut of navigationShortcuts(); track shortcut.id) {
              <div class="shortcut-item">
                <span class="shortcut-description">{{
                  shortcut.description
                }}</span>
                <div class="shortcut-keys">
                  @for (key of formatKeyParts(shortcut.keys[0]); track $index) {
                    <kbd>{{ key }}</kbd>
                    @if (!$last) {
                      <span class="key-separator">+</span>
                    }
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Actions -->
        <div class="shortcut-category">
          <h3 class="category-title">
            <i class="pi pi-bolt"></i>
            Actions
          </h3>
          <div class="shortcut-list">
            @for (shortcut of actionShortcuts(); track shortcut.id) {
              <div class="shortcut-item">
                <span class="shortcut-description">{{
                  shortcut.description
                }}</span>
                <div class="shortcut-keys">
                  @for (key of formatKeyParts(shortcut.keys[0]); track $index) {
                    <kbd>{{ key }}</kbd>
                    @if (!$last) {
                      <span class="key-separator">+</span>
                    }
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <p-divider></p-divider>

        <!-- View -->
        <div class="shortcut-category">
          <h3 class="category-title">
            <i class="pi pi-eye"></i>
            View
          </h3>
          <div class="shortcut-list">
            @for (shortcut of viewShortcuts(); track shortcut.id) {
              <div class="shortcut-item">
                <span class="shortcut-description">{{
                  shortcut.description
                }}</span>
                <div class="shortcut-keys">
                  @for (key of formatKeyParts(shortcut.keys[0]); track $index) {
                    <kbd>{{ key }}</kbd>
                    @if (!$last) {
                      <span class="key-separator">+</span>
                    }
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Help -->
        <div class="shortcut-category">
          <h3 class="category-title">
            <i class="pi pi-question-circle"></i>
            Help
          </h3>
          <div class="shortcut-list">
            @for (shortcut of helpShortcuts(); track shortcut.id) {
              <div class="shortcut-item">
                <span class="shortcut-description">{{
                  shortcut.description
                }}</span>
                <div class="shortcut-keys">
                  @for (key of formatKeyParts(shortcut.keys[0]); track $index) {
                    <kbd>{{ key }}</kbd>
                    @if (!$last) {
                      <span class="key-separator">+</span>
                    }
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Recently Used -->
        @if (shortcutsService.recentlyUsed().length > 0) {
          <p-divider></p-divider>
          <div class="shortcut-category recently-used">
            <h3 class="category-title">
              <i class="pi pi-history"></i>
              Recently Used
            </h3>
            <div class="shortcut-list">
              @for (
                shortcut of shortcutsService.recentlyUsed();
                track shortcut.id
              ) {
                <div class="shortcut-item">
                  <span class="shortcut-description">{{
                    shortcut.description
                  }}</span>
                  <div class="shortcut-keys">
                    @for (
                      key of formatKeyParts(shortcut.keys[0]);
                      track $index
                    ) {
                      <kbd>{{ key }}</kbd>
                      @if (!$last) {
                        <span class="key-separator">+</span>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Platform hint -->
        <div class="platform-hint">
          <i class="pi pi-info-circle"></i>
          <span>
            @if (shortcutsService.isMac()) {
              You're on macOS. Use <kbd>⌘</kbd> (Command) for shortcuts.
            } @else {
              Use <kbd>Ctrl</kbd> for shortcuts.
            }
          </span>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="modal-footer">
          <p-button
            label="Close"
            icon="pi pi-times"
            [text]="true"
            (onClick)="shortcutsService.closeHelpModal()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      /* Modal Header */
      .modal-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ds-primary-green-subtle);
        color: var(--ds-primary-green);
        border-radius: var(--radius-lg);
        font-size: 1.5rem;
      }

      .header-text h2 {
        margin: 0;
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .header-text p {
        margin: var(--space-1) 0 0;
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
      }

      /* Content */
      .shortcuts-content {
        max-height: 60vh;
        overflow-y: auto;
        padding-right: var(--space-2);
      }

      .shortcuts-content::-webkit-scrollbar {
        width: 6px;
      }

      .shortcuts-content::-webkit-scrollbar-track {
        background: var(--surface-secondary);
        border-radius: 3px;
      }

      .shortcuts-content::-webkit-scrollbar-thumb {
        background: var(--color-border-primary);
        border-radius: 3px;
      }

      /* Category */
      .shortcut-category {
        margin-bottom: var(--space-4);
      }

      .category-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-3);
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .category-title i {
        color: var(--ds-primary-green);
      }

      .recently-used .category-title {
        color: var(--color-text-secondary);
      }

      .recently-used .category-title i {
        color: var(--color-text-muted);
      }

      /* Shortcut List */
      .shortcut-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-2) var(--space-3);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        transition: background-color 150ms ease;
      }

      .shortcut-item:hover {
        background: var(--surface-tertiary);
      }

      .shortcut-description {
        font-size: var(--font-body-sm);
        color: var(--color-text-primary);
      }

      .shortcut-keys {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .key-separator {
        color: var(--color-text-muted);
        font-size: var(--font-body-xs);
      }

      /* Keyboard Key Styling */
      kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 var(--space-2);
        font-family: var(--font-family-mono);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-sm);
        box-shadow:
          0 1px 2px rgba(0, 0, 0, 0.05),
          inset 0 -1px 0 rgba(0, 0, 0, 0.1);
      }

      /* Platform Hint */
      .platform-hint {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-4);
        padding: var(--space-3);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        font-size: var(--font-body-xs);
        color: var(--color-text-secondary);
      }

      .platform-hint i {
        color: var(--color-status-info);
      }

      .platform-hint kbd {
        margin: 0 var(--space-1);
      }

      /* Footer */
      .modal-footer {
        display: flex;
        justify-content: flex-end;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .modal-header {
          gap: var(--space-3);
        }

        .header-icon {
          width: 40px;
          height: 40px;
          font-size: 1.25rem;
        }

        .header-text h2 {
          font-size: var(--font-heading-sm);
        }

        .shortcut-item {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-2);
        }

        .shortcut-keys {
          align-self: flex-end;
        }
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .shortcut-item {
          transition: none;
        }
      }

      /* Dialog Styling Override */
      :host ::ng-deep .shortcuts-modal {
        .p-dialog-header {
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border-secondary);
        }

        .p-dialog-content {
          padding: var(--space-5);
        }

        .p-dialog-footer {
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--color-border-secondary);
        }
      }
    `,
  ],
})
export class KeyboardShortcutsModalComponent {
  shortcutsService = inject(KeyboardShortcutsService);

  // Computed shortcuts by category
  navigationShortcuts = computed(
    () =>
      this.shortcutsService
        .shortcutsByCategory()
        .get("navigation")
        ?.filter((s) => s.enabled !== false) || [],
  );

  actionShortcuts = computed(
    () =>
      this.shortcutsService
        .shortcutsByCategory()
        .get("actions")
        ?.filter((s) => s.enabled !== false) || [],
  );

  viewShortcuts = computed(
    () =>
      this.shortcutsService
        .shortcutsByCategory()
        .get("view")
        ?.filter((s) => s.enabled !== false) || [],
  );

  helpShortcuts = computed(
    () =>
      this.shortcutsService
        .shortcutsByCategory()
        .get("help")
        ?.filter((s) => s.enabled !== false) || [],
  );

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.shortcutsService.closeHelpModal();
    }
  }

  /**
   * Format key string into parts for display
   */
  formatKeyParts(keys: string): string[] {
    const parts = keys.split("+");
    const isMac = this.shortcutsService.isMac();

    return parts.map((part) => {
      switch (part.toLowerCase()) {
        case "ctrl":
          return isMac ? "⌃" : "Ctrl";
        case "cmd":
          return "⌘";
        case "alt":
          return isMac ? "⌥" : "Alt";
        case "shift":
          return isMac ? "⇧" : "Shift";
        case "enter":
          return "↵";
        case "escape":
          return "Esc";
        case "space":
          return "Space";
        case "arrowup":
          return "↑";
        case "arrowdown":
          return "↓";
        case "arrowleft":
          return "←";
        case "arrowright":
          return "→";
        case "?":
          return "?";
        case "/":
          return "/";
        default:
          return part.toUpperCase();
      }
    });
  }
}
