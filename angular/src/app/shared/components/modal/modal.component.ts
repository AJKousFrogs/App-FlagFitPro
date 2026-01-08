import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  model,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";

/**
 * Modal Component - Angular 21 Premium Edition
 *
 * A wrapper around PrimeNG Dialog with premium styling and animations
 * Uses Angular 21 signals for reactive state management
 * Features:
 * - Smooth scale-in animation
 * - Backdrop blur effect
 * - Multiple size variants
 * - Customizable footer actions
 * - Keyboard accessibility
 */
@Component({
  selector: "app-modal",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="modal()"
      [closable]="closable()"
      [draggable]="draggable()"
      [resizable]="resizable()"
      [header]="header()"
      [style]="dialogStyle()"
      [styleClass]="dialogStyleClass()"
      [position]="position()"
      [blockScroll]="blockScroll()"
      [dismissableMask]="dismissableMask()"
      [closeOnEscape]="closeOnEscape()"
      (onHide)="handleHide()"
      (onShow)="handleShow()"
    >
      <!-- Custom header template -->
      @if (showCustomHeader()) {
        <ng-template pTemplate="header">
          <div class="modal-header-custom">
            @if (headerIcon()) {
              <div class="modal-header-icon" [class]="'icon-' + headerIconColor()">
                <i [class]="'pi ' + headerIcon()"></i>
              </div>
            }
            <div class="modal-header-text">
              <h2 class="modal-title">{{ header() }}</h2>
              @if (headerSubtitle()) {
                <p class="modal-subtitle">{{ headerSubtitle() }}</p>
              }
            </div>
          </div>
        </ng-template>
      }

      <!-- Modal content -->
      <div class="modal-content" [class.modal-content-scrollable]="scrollable()">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      @if (showFooter()) {
        <ng-template pTemplate="footer">
          <div class="modal-footer" [class]="'modal-footer-' + footerAlignment()">
            <!-- Custom footer content -->
            <ng-content select="[footer]"></ng-content>
            
            <!-- Default buttons -->
            @if (showDefaultButtons()) {
              <div class="modal-footer-buttons">
                @if (showCancelButton()) {
                  <p-button
                    [label]="cancelLabel()"
                    [icon]="cancelIcon()"
                    severity="secondary"
                    [text]="true"
                    (onClick)="handleCancel()"
                    [disabled]="cancelDisabled()"
                    styleClass="modal-btn modal-btn-cancel"
                  />
                }
                @if (showConfirmButton()) {
                  <p-button
                    [label]="confirmLabel()"
                    [icon]="confirmIcon()"
                    [severity]="confirmSeverity()"
                    (onClick)="handleConfirm()"
                    [disabled]="confirmDisabled()"
                    [loading]="confirmLoading()"
                    styleClass="modal-btn modal-btn-confirm"
                  />
                }
              </div>
            }
          </div>
        </ng-template>
      }
    </p-dialog>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ================================
         DIALOG CONTAINER
         ================================ */

      :host ::ng-deep .p-dialog {
        border-radius: var(--radius-xl);
        box-shadow: 
          0 25px 50px -12px rgba(0, 0, 0, 0.25),
          0 12px 24px -8px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        animation: modal-scale-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes modal-scale-in {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      /* ================================
         BACKDROP
         ================================ */

      :host ::ng-deep .p-dialog-mask {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        animation: backdrop-fade 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
      }

      @keyframes backdrop-fade {
        from {
          opacity: 0;
          backdrop-filter: blur(0);
        }
        to {
          opacity: 1;
          backdrop-filter: blur(4px);
        }
      }

      /* ================================
         HEADER
         ================================ */

      :host ::ng-deep .p-dialog-header {
        padding: var(--space-5);
        border-bottom: 1px solid var(--color-border-secondary);
        background: var(--surface-primary);
      }

      :host ::ng-deep .p-dialog-title {
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: 1.3;
      }

      .modal-header-custom {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .modal-header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-lg);
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .icon-primary {
        background: var(--ds-primary-green-subtle);
        color: var(--ds-primary-green);
      }

      .icon-success {
        background: var(--color-status-success-light);
        color: var(--color-status-success);
      }

      .icon-warning {
        background: var(--color-status-warning-light);
        color: #92400e;
      }

      .icon-error {
        background: var(--color-status-error-light);
        color: var(--color-status-error);
      }

      .icon-info {
        background: var(--color-status-info-light);
        color: var(--color-status-info);
      }

      .modal-header-text {
        flex: 1;
        min-width: 0;
      }

      .modal-title {
        margin: 0;
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: 1.3;
      }

      .modal-subtitle {
        margin: var(--space-1) 0 0 0;
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        line-height: 1.4;
      }

      /* ================================
         CLOSE BUTTON
         ================================ */

      :host ::ng-deep .p-dialog-header-close {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--radius-lg);
        color: var(--color-text-secondary);
        transition: 
          background-color 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
          color 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
          transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @media (hover: hover) and (pointer: fine) {
        :host ::ng-deep .p-dialog-header-close:hover {
          background: var(--surface-tertiary);
          color: var(--color-text-primary);
          transform: scale(1.1);
        }
      }

      :host ::ng-deep .p-dialog-header-close:active {
        transform: scale(0.95);
      }

      :host ::ng-deep .p-dialog-header-close:focus-visible {
        outline: 2px solid var(--ds-primary-green);
        outline-offset: 2px;
        box-shadow: 0 0 0 3px rgba(var(--ds-primary-green-rgb), 0.3);
      }

      :host ::ng-deep .p-dialog-header-close:focus:not(:focus-visible) {
        outline: none;
      }

      /* ================================
         CONTENT
         ================================ */

      :host ::ng-deep .p-dialog-content {
        padding: var(--space-5);
        background: var(--surface-primary);
      }

      .modal-content {
        color: var(--color-text-primary);
        line-height: 1.6;
      }

      .modal-content-scrollable {
        max-height: 60vh;
        overflow-y: auto;
        padding-right: var(--space-2);
      }

      .modal-content-scrollable::-webkit-scrollbar {
        width: 6px;
      }

      .modal-content-scrollable::-webkit-scrollbar-track {
        background: var(--surface-secondary);
        border-radius: var(--radius-sm);
      }

      .modal-content-scrollable::-webkit-scrollbar-thumb {
        background: var(--color-border-primary);
        border-radius: var(--radius-sm);
      }

      .modal-content-scrollable::-webkit-scrollbar-thumb:hover {
        background: var(--color-text-muted);
      }

      /* ================================
         FOOTER
         ================================ */

      :host ::ng-deep .p-dialog-footer {
        padding: var(--space-4) var(--space-5);
        border-top: 1px solid var(--color-border-secondary);
        background: var(--surface-secondary);
      }

      .modal-footer {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .modal-footer-left {
        justify-content: flex-start;
      }

      .modal-footer-center {
        justify-content: center;
      }

      .modal-footer-right {
        justify-content: flex-end;
      }

      .modal-footer-between {
        justify-content: space-between;
      }

      .modal-footer-buttons {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-left: auto;
      }

      :host ::ng-deep .modal-btn {
        min-width: 100px;
      }

      :host ::ng-deep .modal-btn-cancel {
        color: var(--color-text-secondary);
      }

      @media (hover: hover) and (pointer: fine) {
        :host ::ng-deep .modal-btn-cancel:hover {
          color: var(--color-text-primary);
        }
      }

      /* ================================
         SIZE VARIANTS
         ================================ */

      :host ::ng-deep .modal-sm {
        width: 400px;
        max-width: 95vw;
      }

      :host ::ng-deep .modal-md {
        width: 560px;
        max-width: 95vw;
      }

      :host ::ng-deep .modal-lg {
        width: 800px;
        max-width: 95vw;
      }

      :host ::ng-deep .modal-xl {
        width: 1140px;
        max-width: 95vw;
      }

      :host ::ng-deep .modal-full {
        width: 95vw;
        height: 90vh;
      }

      :host ::ng-deep .modal-full .p-dialog-content {
        flex: 1;
        overflow-y: auto;
      }

      /* ================================
         RESPONSIVE
         ================================ */

      @media (max-width: 640px) {
        :host ::ng-deep .p-dialog {
          margin: var(--space-4);
          max-height: calc(100vh - var(--space-8));
        }

        :host ::ng-deep .p-dialog-header {
          padding: var(--space-4);
        }

        :host ::ng-deep .p-dialog-content {
          padding: var(--space-4);
        }

        :host ::ng-deep .p-dialog-footer {
          padding: var(--space-3) var(--space-4);
        }

        .modal-footer {
          flex-direction: column;
          gap: var(--space-2);
        }

        .modal-footer-buttons {
          width: 100%;
          flex-direction: column-reverse;
          margin-left: 0;
        }

        :host ::ng-deep .modal-btn {
          width: 100%;
        }
      }

      /* ================================
         REDUCED MOTION
         ================================ */

      @media (prefers-reduced-motion: reduce) {
        :host ::ng-deep .p-dialog {
          animation: none;
        }

        :host ::ng-deep .p-dialog-mask {
          animation: none;
        }

        :host ::ng-deep .p-dialog-header-close {
          transition: none;
        }
      }

      /* ================================
         DARK MODE
         ================================ */

      :host-context([data-theme="dark"]),
      :host-context(.dark-theme) {
        :host ::ng-deep .p-dialog-mask {
          background: rgba(0, 0, 0, 0.7);
        }
      }
    `,
  ],
})
export class ModalComponent {
  // Visibility
  visible = model<boolean>(false);

  // Configuration inputs
  modal = input<boolean>(true);
  closable = input<boolean>(true);
  draggable = input<boolean>(false);
  resizable = input<boolean>(false);
  header = input<string>();
  headerSubtitle = input<string>();
  headerIcon = input<string>();
  headerIconColor = input<"primary" | "success" | "warning" | "error" | "info">("primary");
  size = input<"sm" | "md" | "lg" | "xl" | "full">("md");
  position = input<
    | "center"
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "topleft"
    | "topright"
    | "bottomleft"
    | "bottomright"
  >("center");
  blockScroll = input<boolean>(true);
  dismissableMask = input<boolean>(false);
  closeOnEscape = input<boolean>(true);
  scrollable = input<boolean>(false);

  // Footer configuration
  showFooter = input<boolean>(false);
  showDefaultButtons = input<boolean>(true);
  footerAlignment = input<"left" | "center" | "right" | "between">("right");
  showCancelButton = input<boolean>(true);
  showConfirmButton = input<boolean>(true);
  cancelLabel = input<string>("Cancel");
  cancelIcon = input<string>("");
  cancelDisabled = input<boolean>(false);
  confirmLabel = input<string>("Confirm");
  confirmIcon = input<string>("");
  confirmDisabled = input<boolean>(false);
  confirmLoading = input<boolean>(false);
  confirmSeverity = input<
    "success" | "info" | "warn" | "danger" | "secondary" | "primary"
  >("primary");

  // Events
  onHide = output<void>();
  onShow = output<void>();
  onCancel = output<void>();
  onConfirm = output<void>();

  // Computed values
  showCustomHeader = computed(() => {
    return !!this.headerIcon() || !!this.headerSubtitle();
  });

  dialogStyle = computed(() => {
    const sizeMap: Record<string, Record<string, string>> = {
      sm: { width: "400px", maxWidth: "95vw" },
      md: { width: "560px", maxWidth: "95vw" },
      lg: { width: "800px", maxWidth: "95vw" },
      xl: { width: "1140px", maxWidth: "95vw" },
      full: { width: "95vw", height: "90vh" },
    };
    return sizeMap[this.size()] || sizeMap['md'];
  });

  dialogStyleClass = computed(() => {
    return `modal-${this.size()}`;
  });

  // Event handlers
  onVisibleChange(value: boolean): void {
    this.visible.set(value);
    if (!value) {
      this.onHide.emit();
    }
  }

  handleHide(): void {
    this.visible.set(false);
    this.onHide.emit();
  }

  handleShow(): void {
    this.onShow.emit();
  }

  handleCancel(): void {
    this.onCancel.emit();
    this.close();
  }

  handleConfirm(): void {
    this.onConfirm.emit();
  }

  // Public methods
  open(): void {
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  toggle(): void {
    this.visible.update(v => !v);
  }
}
