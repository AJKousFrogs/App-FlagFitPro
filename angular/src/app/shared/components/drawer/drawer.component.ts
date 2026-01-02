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
  styleUrl: './drawer.component.scss',
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
