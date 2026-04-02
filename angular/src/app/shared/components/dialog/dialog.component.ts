import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from "@angular/core";
import { Dialog } from "primeng/dialog";
import { DIALOG_BREAKPOINTS } from "../../../core/utils/design-tokens.util";

type AppDialogShell = "default" | "settings";
type AppDialogSize = "auto" | "sm" | "md" | "lg" | "xl" | "2xl";

@Component({
  selector: "app-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Dialog],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="handleVisibleChange($event)"
      (onHide)="handleHide()"
      [modal]="modal()"
      [closable]="closable()"
      [draggable]="draggable()"
      [resizable]="resizable()"
      [maximizable]="maximizable()"
      [baseZIndex]="baseZIndex()"
      [blockScroll]="blockScroll()"
      [class]="dialogClasses()"
      [contentStyle]="contentStyle()"
      [closeOnEscape]="closeOnEscape()"
      [dismissableMask]="dismissableMask()"
      [appendTo]="appendTo()"
      [focusOnShow]="focusOnShow()"
      [breakpoints]="resolvedBreakpoints()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-modal]="modal() ? 'true' : null"
      [attr.role]="role()"
      [style.--app-dialog-scroll-max-height]="scrollMaxHeight()"
      [style.--app-dialog-mobile-max-height]="mobileMaxHeight()"
    >
      <ng-content select="app-dialog-header, [dialogHeader]"></ng-content>
      <div class="dialog-body">
        <ng-content></ng-content>
      </div>
      <ng-content select="app-dialog-footer, [dialogFooter]"></ng-content>
    </p-dialog>
  `,
  styleUrl: "./dialog.component.scss",
})
export class AppDialogComponent {
  visible = model(false);
  hide = output<void>();
  onHide = output<void>();
  private hasEmittedClose = false;

  modal = input(true);
  closable = input(true);
  draggable = input(true);
  resizable = input(false);
  maximizable = input(false);

  baseZIndex = input(1000);
  blockScroll = input(false);
  contentStyle = input<Record<string, string> | null>(null);
  styleClass = input("");
  shell = input<AppDialogShell>("default");
  dialogSize = input<AppDialogSize>("auto");
  scrollableContent = input(false);
  scrollMaxHeight = input<string | null>(null);
  mobileStickyFooter = input(false);
  mobileMaxHeight = input<string | null>(null);
  closeOnEscape = input(true);
  dismissableMask = input(false);
  appendTo = input<HTMLElement | string | null>(null);
  focusOnShow = input(true);
  breakpoints = input<Record<string, string> | null>(null);
  ariaLabel = input<string | null>(null);
  role = input("dialog");

  protected readonly dialogClasses = computed(() => {
    const classes = [
      this.styleClass(),
      this.shell() !== "default" ? `app-dialog-shell--${this.shell()}` : "",
      this.dialogSize() !== "auto"
        ? `app-dialog-size--${this.dialogSize()}`
        : "",
      this.scrollableContent() ? "app-dialog-scrollable" : "",
      this.mobileStickyFooter() ? "app-dialog-mobile-sticky-footer" : "",
    ].filter(Boolean);

    return classes.join(" ");
  });

  protected readonly resolvedBreakpoints = computed(() => {
    const explicitBreakpoints = this.breakpoints();
    if (explicitBreakpoints) {
      return explicitBreakpoints;
    }

    switch (this.dialogSize()) {
      case "sm":
      case "md":
      case "lg":
        return DIALOG_BREAKPOINTS.standard;
      case "xl":
      case "2xl":
        return DIALOG_BREAKPOINTS.wide;
      default:
        return null;
    }
  });

  handleVisibleChange(value: boolean): void {
    this.visible.set(value);
    if (!value) {
      this.emitCloseIfNeeded();
    } else {
      this.hasEmittedClose = false;
    }
  }

  handleHide(): void {
    this.visible.set(false);
    this.emitCloseIfNeeded();
  }

  private emitCloseIfNeeded(): void {
    if (this.hasEmittedClose) {
      return;
    }
    this.hasEmittedClose = true;
    this.hide.emit();
    this.onHide.emit();
  }
}
