import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  signal,
  effect,
  ElementRef,
  inject,
  afterNextRender,
  ViewChild,
  HostListener,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
 * - Full keyboard accessibility (WCAG 2.1 AA)
 * - Focus trap with Tab cycling
 * - Focus restoration on close
 * - Stacking context management for multiple modals
 * - Scrollable content handling
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
        border-radius: 3px;
      }

      .modal-content-scrollable::-webkit-scrollbar-thumb {
        background: var(--color-border-primary);
        border-radius: 3px;
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
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  @ViewChild('dialogElement') dialogElement?: ElementRef;

  // Visibility
  visible = signal<boolean>(false);

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
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
  >("center");
  blockScroll = input<boolean>(true);
  dismissableMask = input<boolean>(false);
  closeOnEscape = input<boolean>(true);
  scrollable = input<boolean>(false);

  // Accessibility enhancements
  enableFocusTrap = input<boolean>(true);
  restoreFocus = input<boolean>(true);

  // Focus management
  private lastFocusedElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;

  // Stacking context (shared across all modal instances)
  private static modalStack: string[] = [];
  private static baseZIndex = 1100;

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
    "success" | "info" | "warning" | "danger" | "secondary" | "primary"
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
    // Focus management on show
    if (this.enableFocusTrap() || this.restoreFocus()) {
      // Store currently focused element
      this.lastFocusedElement = document.activeElement as HTMLElement;
    }

    // Add to modal stack for stacking context
    ModalComponent.modalStack.push(this.modalId);
    this.updateModalZIndex();

    // Setup focus trap after modal is rendered
    setTimeout(() => {
      this.setupFocusTrap();
      this.focusFirstElement();
    }, 100);

    this.onShow.emit();
  }

  handleCancel(): void {
    this.onCancel.emit();
    this.close();
  }

  handleConfirm(): void {
    this.onConfirm.emit();
  }

  // Focus trap implementation
  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  handleTabKey(event: KeyboardEvent): void {
    // Only trap focus if this modal is visible and on top
    if (!this.visible() || !this.enableFocusTrap()) return;
    if (ModalComponent.modalStack[ModalComponent.modalStack.length - 1] !== this.modalId) return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    // Check if active element is within this modal
    const modalElement = this.getModalElement();
    if (!modalElement?.contains(activeElement)) {
      // Focus escaped, bring it back
      event.preventDefault();
      firstElement.focus();
      return;
    }

    // Handle Shift+Tab on first element
    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Handle Tab on last element
    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  }

  private setupFocusTrap(): void {
    if (!this.enableFocusTrap()) return;

    this.focusableElements = this.getFocusableElements();
  }

  private getFocusableElements(): HTMLElement[] {
    const modalElement = this.getModalElement();
    if (!modalElement) return [];

    const selector = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]',
    ].join(',');

    const elements = Array.from(modalElement.querySelectorAll<HTMLElement>(selector));

    // Filter out elements that are not visible
    return elements.filter(el => {
      return el.offsetParent !== null &&
             !el.hasAttribute('hidden') &&
             getComputedStyle(el).visibility !== 'hidden';
    });
  }

  private getModalElement(): HTMLElement | null {
    // Get the PrimeNG dialog element
    const dialogMask = document.querySelector('.p-dialog-mask:last-of-type');
    if (dialogMask) {
      return dialogMask.querySelector('.p-dialog') as HTMLElement;
    }
    return null;
  }

  private focusFirstElement(): void {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  private restoreFocusToElement(): void {
    if (!this.restoreFocus()) return;

    if (this.lastFocusedElement) {
      // Check if element still exists in DOM
      if (document.body.contains(this.lastFocusedElement)) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          this.lastFocusedElement?.focus();
        });
      } else {
        // Element was removed, focus body
        document.body.focus();
      }
    }

    this.lastFocusedElement = null;
  }

  private updateModalZIndex(): void {
    const modalElement = this.getModalElement();
    if (!modalElement) return;

    const stackIndex = ModalComponent.modalStack.indexOf(this.modalId);
    const zIndex = ModalComponent.baseZIndex + (stackIndex * 10);

    // Update modal z-index
    const dialogMask = modalElement.closest('.p-dialog-mask') as HTMLElement;
    if (dialogMask) {
      dialogMask.style.zIndex = zIndex.toString();
    }
  }

  private removeFromModalStack(): void {
    const index = ModalComponent.modalStack.indexOf(this.modalId);
    if (index > -1) {
      ModalComponent.modalStack.splice(index, 1);
    }

    // Update z-index for remaining modals
    this.updateStackedModalsZIndex();
  }

  private updateStackedModalsZIndex(): void {
    // This would need to be implemented with a service if we want
    // to update other modal instances. For now, new modals will
    // naturally get higher z-index values
  }

  // Public methods
  open(): void {
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);

    // Remove from stack
    this.removeFromModalStack();

    // Restore focus
    setTimeout(() => {
      this.restoreFocusToElement();
    }, 200); // Wait for modal close animation
  }

  toggle(): void {
    this.visible.update(v => !v);
  }
}
