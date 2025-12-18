import { Component, input, output, signal, effect, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * Drawer Component - Angular 21
 * 
 * A drawer component for slide-out panels
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: 'app-drawer',
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
        [attr.aria-labelledby]="title() ? 'drawer-title-' + id() : null">
        <div class="drawer-header">
          @if (title()) {
            <h2 [id]="'drawer-title-' + id()" class="drawer-title">{{ title() }}</h2>
          }
          @if (showCloseButton()) {
            <button
              type="button"
              class="drawer-close"
              (click)="close()"
              aria-label="Close drawer">
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
  styles: [`
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
      z-index: 999;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .drawer {
      position: fixed;
      z-index: 1000;
      background: var(--p-surface-0);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
      transition: transform 0.3s ease;
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
      transition: transform 0.3s ease;
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
      transition: transform 0.3s ease;
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
      transition: transform 0.3s ease;
    }

    .drawer-bottom.open {
      transform: translateY(0);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid var(--p-surface-border);
    }

    .drawer-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--p-text-color);
    }

    .drawer-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      color: var(--p-text-color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--p-border-radius);
      transition: background 0.2s;
    }

    .drawer-close:hover {
      background: var(--p-surface-100);
    }

    .drawer-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .drawer-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid var(--p-surface-border);
    }
  `]
})
export class DrawerComponent {
  // Configuration
  id = input<string>(`drawer-${Math.random().toString(36).substr(2, 9)}`);
  title = input<string>();
  position = input<DrawerPosition>('right');
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
        document.body.style.overflow = 'hidden';
        this.opened.emit();
      } else {
        document.body.style.overflow = '';
        this.closed.emit();
      }
    });
  }
  
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }
  
  close(): void {
    this.isOpen.set(false);
    document.body.style.overflow = '';
    this.closed.emit();
  }
}

