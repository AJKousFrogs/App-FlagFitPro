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
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { ButtonComponent } from "../button/button.component";
import { DividerModule } from "primeng/divider";
import { KeyboardShortcutsService } from "../../../core/services/keyboard-shortcuts.service";

@Component({
  selector: "app-keyboard-shortcuts-modal",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule, DividerModule, ButtonComponent],
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
          <app-button
            variant="text"
            iconLeft="pi-times"
            (clicked)="shortcutsService.closeHelpModal()"
            >Close</app-button
          >
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: "./keyboard-shortcuts-modal.component.scss",
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
