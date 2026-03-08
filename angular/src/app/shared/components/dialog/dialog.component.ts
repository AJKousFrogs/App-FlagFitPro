import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from "@angular/core";
import { Dialog } from "primeng/dialog";

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
      [class]="styleClass()"
      [contentStyle]="contentStyle()"
      [closeOnEscape]="closeOnEscape()"
      [dismissableMask]="dismissableMask()"
      [appendTo]="appendTo()"
      [focusOnShow]="focusOnShow()"
      [breakpoints]="breakpoints()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.role]="role()"
    >
      <ng-content select="app-dialog-header, [dialogHeader]"></ng-content>
      <div class="dialog-body">
        <ng-content></ng-content>
      </div>
      <ng-content select="app-dialog-footer, [dialogFooter]"></ng-content>
    </p-dialog>
  `,
  styles: [
    ".dialog-body { margin-top: var(--space-4); }",
  ],
})
export class AppDialogComponent {
  visible = model(false);
  hide = output<void>();
  onHide = output<void>();

  modal = input(true);
  closable = input(true);
  draggable = input(true);
  resizable = input(false);
  maximizable = input(false);

  baseZIndex = input(1000);
  blockScroll = input(false);
  contentStyle = input<Record<string, string> | null>(null);
  styleClass = input("");
  closeOnEscape = input(true);
  dismissableMask = input(false);
  appendTo = input<HTMLElement | string | null>(null);
  focusOnShow = input(true);
  breakpoints = input<Record<string, string> | null>(null);
  ariaLabel = input<string | null>(null);
  role = input("dialog");

  handleVisibleChange(value: boolean): void {
    this.visible.set(value);
    if (!value) {
      this.hide.emit();
      this.onHide.emit();
    }
  }

  handleHide(): void {
    this.visible.set(false);
    this.hide.emit();
    this.onHide.emit();
  }
}
