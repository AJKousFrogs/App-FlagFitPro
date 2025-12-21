import { Component, input, output, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

/**
 * Modal Component - Angular 21
 * 
 * A wrapper around PrimeNG Dialog with consistent styling
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="modal()"
      [closable]="closable()"
      [draggable]="draggable()"
      [resizable]="resizable()"
      [header]="header()"
      [style]="style()"
      [styleClass]="styleClass()"
      [position]="position()"
      [blockScroll]="blockScroll()"
      [dismissableMask]="dismissableMask()"
      (onHide)="handleHide()"
      (onShow)="handleShow()">
      
      <ng-content></ng-content>
      
      @if (showFooter()) {
        <ng-template pTemplate="footer">
          @if (showCancelButton()) {
            <p-button
              [label]="cancelLabel()"
              [icon]="cancelIcon()"
              [severity]="'secondary'"
              [text]="true"
              (onClick)="onCancel.emit()">
            </p-button>
          }
          @if (showConfirmButton()) {
            <p-button
              [label]="confirmLabel()"
              [icon]="confirmIcon()"
              [severity]="confirmSeverity()"
              (onClick)="onConfirm.emit()">
            </p-button>
          }
          <ng-content select="[footer]"></ng-content>
        </ng-template>
      }
    </p-dialog>
  `,
  styles: [`
    :host {
      display: block;
    }

    :host ::ng-deep .p-dialog {
      border-radius: var(--p-border-radius);
      box-shadow: var(--p-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.15));
    }

    :host ::ng-deep .p-dialog-header {
      background-color: var(--p-surface-0);
      border-bottom: 1px solid var(--p-surface-border);
      padding: 1.25rem;
    }

    :host ::ng-deep .p-dialog-content {
      padding: 1.25rem;
    }

    :host ::ng-deep .p-dialog-footer {
      background-color: var(--p-surface-0);
      border-top: 1px solid var(--p-surface-border);
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class ModalComponent {
  // Visibility
  visible = signal<boolean>(false);
  
  // Configuration inputs
  modal = input<boolean>(true);
  closable = input<boolean>(true);
  draggable = input<boolean>(false);
  resizable = input<boolean>(false);
  header = input<string>();
  style = input<Record<string, string>>({ width: '50vw' });
  styleClass = input<string>();
  position = input<'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('center');
  blockScroll = input<boolean>(true);
  dismissableMask = input<boolean>(false);
  
  // Footer configuration
  showFooter = input<boolean>(false);
  showCancelButton = input<boolean>(false);
  showConfirmButton = input<boolean>(false);
  cancelLabel = input<string>('Cancel');
  cancelIcon = input<string>('pi pi-times');
  confirmLabel = input<string>('Confirm');
  confirmIcon = input<string>('pi pi-check');
  confirmSeverity = input<'success' | 'info' | 'warning' | 'danger' | 'secondary'>('primary');
  
  // Events
  onHide = output<void>();
  onShow = output<void>();
  onCancel = output<void>();
  onConfirm = output<void>();
  
  // Event handlers
  handleHide(): void {
    this.visible.set(false);
    this.onHide.emit();
  }
  
  handleShow(): void {
    this.visible.set(true);
    this.onShow.emit();
  }
  
  // Public methods
  open(): void {
    this.visible.set(true);
  }
  
  close(): void {
    this.visible.set(false);
  }
}

