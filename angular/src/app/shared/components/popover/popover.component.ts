import {
  Component,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
  effect,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type PopoverPosition = "top" | "right" | "bottom" | "left";

/**
 * Popover Component - Angular 21
 *
 * A popover component for displaying contextual information
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-popover",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="popover-wrapper" #wrapper>
      <ng-content select="[popoverTrigger]"></ng-content>
      @if (isOpen()) {
        <div
          class="popover"
          [class]="'popover-' + position()"
          [style.top.px]="top()"
          [style.left.px]="left()"
          role="tooltip"
          [attr.aria-hidden]="!isOpen()"
        >
          <div class="popover-content">
            <ng-content></ng-content>
          </div>
          <div class="popover-arrow" [class]="'arrow-' + position()"></div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        position: relative;
      }

      .popover-wrapper {
        position: relative;
        display: inline-block;
      }

      .popover {
        position: absolute;
        z-index: 1000;
        min-width: var(--grid-min-width-md);
        max-width: var(--element-max-width-sm);
        background: var(--p-surface-0);
        border: var(--border-1) solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        box-shadow: var(--shadow-md);
        animation: popoverFadeIn 0.2s ease;
      }

      @keyframes popoverFadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .popover-content {
        padding: var(--space-4);
      }

      .popover-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
      }

      /* Top */
      .popover-top {
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: var(--space-2);
      }

      .popover-top .arrow-top {
        bottom: calc(var(--space-2) * -1);
        left: 50%;
        transform: translateX(-50%);
        border-width: var(--space-2) var(--space-2) 0;
        border-color: var(--p-surface-border) transparent transparent
          transparent;
      }

      /* Right */
      .popover-right {
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-left: var(--space-2);
      }

      .popover-right .arrow-right {
        left: calc(var(--space-2) * -1);
        top: 50%;
        transform: translateY(-50%);
        border-width: var(--space-2) var(--space-2) var(--space-2) 0;
        border-color: transparent var(--p-surface-border) transparent
          transparent;
      }

      /* Bottom */
      .popover-bottom {
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: var(--space-2);
      }

      .popover-bottom .arrow-bottom {
        top: calc(var(--space-2) * -1);
        left: 50%;
        transform: translateX(-50%);
        border-width: 0 var(--space-2) var(--space-2) var(--space-2);
        border-color: transparent transparent var(--p-surface-border)
          transparent;
      }

      /* Left */
      .popover-left {
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-right: var(--space-2);
      }

      .popover-left .arrow-left {
        right: calc(var(--space-2) * -1);
        top: 50%;
        transform: translateY(-50%);
        border-width: var(--space-2) 0 var(--space-2) var(--space-2);
        border-color: transparent transparent transparent
          var(--p-surface-border);
      }
    `,
  ],
})
export class PopoverComponent {
  wrapper = viewChild<ElementRef>("wrapper");

  // Configuration
  position = input<PopoverPosition>("bottom");
  trigger = input<"hover" | "click">("hover");
  isOpenByDefault = input<boolean>(false);

  // State
  isOpen = signal<boolean>(false);
  top = signal<number>(0);
  left = signal<number>(0);

  // Outputs
  opened = output<void>();
  closed = output<void>();

  constructor() {
    // Sync isOpenByDefault input with isOpen signal
    effect(() => {
      this.isOpen.set(this.isOpenByDefault());
    });
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.trigger() === "click" && this.isOpen()) {
      const wrapperEl = this.wrapper()?.nativeElement;
      if (wrapperEl && !wrapperEl.contains(event.target)) {
        this.close();
      }
    }
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.isOpen.set(true);
    this.calculatePosition();
    this.opened.emit();
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  private calculatePosition(): void {
    const wrapperEl = this.wrapper()?.nativeElement;
    if (!wrapperEl) return;

    const rect = wrapperEl.getBoundingClientRect();
    const position = this.position();

    switch (position) {
      case "top":
        this.top.set(rect.top - wrapperEl.offsetHeight - 8);
        this.left.set(rect.left + rect.width / 2);
        break;
      case "right":
        this.top.set(rect.top + rect.height / 2);
        this.left.set(rect.right + 8);
        break;
      case "bottom":
        this.top.set(rect.bottom + 8);
        this.left.set(rect.left + rect.width / 2);
        break;
      case "left":
        this.top.set(rect.top + rect.height / 2);
        this.left.set(rect.left - wrapperEl.offsetWidth - 8);
        break;
    }
  }
}
