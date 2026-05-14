import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { Dialog } from "primeng/dialog";

/**
 * Bottom Sheet — Phase 1 mobile-first primitive.
 *
 * Wraps PrimeNG <p-dialog> with the bottom-sheet CSS variant that
 * already lives in scss/utilities/_mobile-responsive.scss
 * (.p-dialog.mobile-bottom-sheet, animation slideUpFromBottom). The
 * variant slides up from the bottom, pins to the viewport edge, and
 * rounds only its top corners — the correct mobile primitive for any
 * non-destructive secondary action.
 *
 * Today 416 dialogs ship in the app and exactly 1 uses the bottom-sheet
 * variant (FIFTY_BAD_THINGS item 28). This component makes it trivial
 * to adopt — Phase 3 will convert Player Details, Add/Edit Player,
 * Filters, Pinned, Members as a sweep.
 *
 * Usage:
 *   <app-bottom-sheet [(visible)]="filtersOpen" title="Filters">
 *     <app-bottom-sheet-header>Filters</app-bottom-sheet-header>
 *     <form>…</form>
 *     <ng-container slot="footer">
 *       <app-button (clicked)="apply()">Apply</app-button>
 *     </ng-container>
 *   </app-bottom-sheet>
 */
@Component({
  selector: "app-bottom-sheet",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [Dialog],
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="handleVisibleChange($event)"
      (onHide)="handleHide()"
      [modal]="true"
      [closable]="closable()"
      [draggable]="false"
      [resizable]="false"
      [closeOnEscape]="closeOnEscape()"
      [dismissableMask]="dismissableMask()"
      [blockScroll]="true"
      [class]="resolvedClass()"
      [position]="'bottom'"
      [appendTo]="appendTo()"
      [attr.aria-label]="ariaLabel() || title()"
      [attr.aria-modal]="'true'"
    >
      @if (title() || showHandle()) {
        <div class="bottom-sheet__chrome">
          @if (showHandle()) {
            <span class="bottom-sheet__handle" aria-hidden="true"></span>
          }
          @if (title()) {
            <h2 class="bottom-sheet__title">{{ title() }}</h2>
          }
        </div>
      }
      <div class="bottom-sheet__body">
        <ng-content></ng-content>
      </div>
      @if (hasFooter()) {
        <div class="bottom-sheet__footer">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      }
    </p-dialog>
  `,
  styleUrl: "./bottom-sheet.component.scss",
})
export class BottomSheetComponent {
  readonly visible = model.required<boolean>();
  readonly title = input<string>("");
  readonly ariaLabel = input<string>("");
  readonly closable = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);
  readonly dismissableMask = input<boolean>(true);
  readonly showHandle = input<boolean>(true);
  /** Pass true if a footer slot is provided so the chrome reserves space. */
  readonly hasFooter = input<boolean>(false);
  readonly appendTo = input<"body" | string>("body");
  /** Extra classes to add to the underlying p-dialog. */
  readonly extraClass = input<string>("");

  readonly closed = output<void>();

  readonly resolvedClass = computed(() =>
    ["mobile-bottom-sheet", "app-bottom-sheet", this.extraClass()].filter(Boolean).join(" "),
  );

  handleVisibleChange(next: boolean): void {
    this.visible.set(next);
  }

  handleHide(): void {
    this.visible.set(false);
    this.closed.emit();
  }
}
