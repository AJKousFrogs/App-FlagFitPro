import {
  Component,
  input,
  output,
  signal,
  effect,
  ChangeDetectionStrategy,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type DrawerPosition = "left" | "right" | "top" | "bottom";

/**
 * Drawer Component - Angular 21
 *
 * A drawer component for slide-out panels
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-drawer",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="drawer-overlay" (click)="close()"></div>
      <div
        class="drawer drawer-{{ position() }}"
        [class.open]="isOpen()"
        role="dialog"
        [attr.aria-modal]="modal()"
        [attr.aria-labelledby]="title() ? 'drawer-title-' + id() : null"
      >
        <div class="drawer-header">
          @if (title()) {
            <h2 [id]="'drawer-title-' + id()" class="drawer-title">
              {{ title() }}
            </h2>
          }
          @if (showCloseButton()) {
            <button
              type="button"
              class="drawer-close"
              (click)="close()"
              aria-label="Close drawer"
            >
              <i class="pi pi-times"></i>
            </button>
          }
        </div>
        <div class="drawer-content">
          <ng-content></ng-content>
        </div>
        @if (showFooter()) {
          <div class="drawer-footer">
            <ng-content select="[drawerFooter]"></ng-content>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .drawer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 999;
        animation: overlayFadeIn 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
      }

      @keyframes overlayFadeIn {
        from {
          opacity: 0;
          backdrop-filter: blur(0);
        }
        to {
          opacity: 1;
          backdrop-filter: blur(4px);
        }
      }

      .drawer {
        position: fixed;
        z-index: 1000;
        background: var(--surface-primary, var(--p-surface-0));
        box-shadow: var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
        display: flex;
        flex-direction: column;
        max-width: 100%;
        max-height: 100%;
        overflow: hidden;
      }

      .drawer-left {
        top: 0;
        left: 0;
        bottom: 0;
        width: 400px;
        max-width: 90vw;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .drawer-left.open {
        transform: translateX(0);
      }

      .drawer-right {
        top: 0;
        right: 0;
        bottom: 0;
        width: 400px;
        max-width: 90vw;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .drawer-right.open {
        transform: translateX(0);
      }

      .drawer-top {
        top: 0;
        left: 0;
        right: 0;
        height: 400px;
        max-height: 90vh;
        transform: translateY(-100%);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .drawer-top.open {
        transform: translateY(0);
      }

      .drawer-bottom {
        bottom: 0;
        left: 0;
        right: 0;
        height: 400px;
        max-height: 90vh;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .drawer-bottom.open {
        transform: translateY(0);
      }

      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-5, 1.25rem);
        border-bottom: 1px solid var(--color-border-secondary, var(--p-surface-border));
        background: var(--surface-secondary, var(--p-surface-50));
      }

      .drawer-title {
        margin: 0;
        font-size: var(--font-heading-md, 1.25rem);
        font-weight: var(--font-weight-semibold, 600);
        color: var(--color-text-primary, var(--p-text-color));
      }

      .drawer-close {
        width: 2.5rem;
        height: 2.5rem;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--color-text-secondary, var(--p-text-color-secondary));
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-lg, var(--p-border-radius));
        transition: 
          background-color 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
          color 150ms cubic-bezier(0.25, 0.1, 0.25, 1),
          transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @media (hover: hover) and (pointer: fine) {
        .drawer-close:hover {
          background: var(--surface-tertiary, var(--p-surface-100));
          color: var(--color-text-primary, var(--p-text-color));
          transform: scale(1.1);
        }
      }

      .drawer-close:active {
        transform: scale(0.95);
      }

      .drawer-close:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(var(--ds-primary-green-rgb, 8, 153, 73), 0.3);
      }

      .drawer-content {
        flex: 1;
        padding: var(--space-5, 1.25rem);
        overflow-y: auto;
      }

      .drawer-content::-webkit-scrollbar {
        width: 6px;
      }

      .drawer-content::-webkit-scrollbar-track {
        background: var(--surface-secondary, transparent);
      }

      .drawer-content::-webkit-scrollbar-thumb {
        background: var(--color-border-primary, rgba(0, 0, 0, 0.2));
        border-radius: 3px;
      }

      .drawer-content::-webkit-scrollbar-thumb:hover {
        background: var(--color-text-muted, rgba(0, 0, 0, 0.3));
      }

      .drawer-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-3, 0.75rem);
        padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
        border-top: 1px solid var(--color-border-secondary, var(--p-surface-border));
        background: var(--surface-secondary, var(--p-surface-50));
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .drawer-overlay,
        .drawer-left,
        .drawer-right,
        .drawer-top,
        .drawer-bottom,
        .drawer-close {
          transition: none;
          animation: none;
        }
      }
    `,
  ],
})
export class DrawerComponent {
  // Configuration
  id = input<string>(`drawer-${Math.random().toString(36).substr(2, 9)}`);
  title = input<string>();
  position = input<DrawerPosition>("right");
  modal = input<boolean>(true);
  showCloseButton = input<boolean>(true);
  showFooter = input<boolean>(false);
  open = input<boolean>(false);

  // State
  isOpen = signal<boolean>(false);

  // Outputs
  opened = output<void>();
  closed = output<void>();

  constructor() {
    effect(() => {
      this.isOpen.set(this.open());
      if (this.open()) {
        document.body.style.overflow = "hidden";
        this.opened.emit();
      } else {
        document.body.style.overflow = "";
        this.closed.emit();
      }
    });
  }

  @HostListener("document:keydown.escape", ["$event"])
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  close(): void {
    this.isOpen.set(false);
    document.body.style.overflow = "";
    this.closed.emit();
  }
}
