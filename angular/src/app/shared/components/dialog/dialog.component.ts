import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { Dialog } from "primeng/dialog";

@Component({
  selector: "app-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Dialog],
  template: `
    <p-dialog
      [visible]="visible"
      (visibleChange)="handleVisibleChange($event)"
      (onHide)="handleHide()"
      [modal]="modal"
      [closable]="closable"
      [draggable]="draggable"
      [resizable]="resizable"
      [maximizable]="maximizable"
      [baseZIndex]="baseZIndex"
      [blockScroll]="blockScroll"
      [class]="styleClass"
      [contentStyle]="contentStyle"
      [closeOnEscape]="closeOnEscape"
      [dismissableMask]="dismissableMask"
      [appendTo]="appendTo"
    >
      <ng-content select="app-dialog-header"></ng-content>
      <div class="dialog-body">
        <ng-content></ng-content>
      </div>
      <ng-content select="app-dialog-footer"></ng-content>
    </p-dialog>
  `,
  styles: [
    ".dialog-body { margin-top: var(--space-4); }",
  ],
})
export class AppDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() hide = new EventEmitter<void>();
  @Output() onHide = new EventEmitter<void>();

  @Input() modal = true;
  @Input() closable = true;
  @Input() draggable = true;
  @Input() resizable = false;
  @Input() maximizable = false;

  @Input() baseZIndex = 1000;
  @Input() blockScroll = false;
  @Input() contentStyle: Record<string, string> | null = null;
  @Input() styleClass = "";
  @Input() closeOnEscape = true;
  @Input() dismissableMask = false;
  @Input() appendTo: HTMLElement | string | null = null;

  handleVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
    if (!value) {
      this.hide.emit();
      this.onHide.emit();
    }
  }

  handleHide(): void {
    this.visibleChange.emit(false);
    this.hide.emit();
    this.onHide.emit();
  }
}
