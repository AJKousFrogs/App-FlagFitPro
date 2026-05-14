import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

/**
 * List Row — Phase 1 mobile-first primitive.
 *
 * Image-led list row matching the Equinox class list reference:
 * 64px thumbnail on the left, title + subline + tertiary (e.g. instructor,
 * time) in the middle, optional trailing slot (badge / chevron / icon
 * button). Renders as a button when (click) is bound, otherwise as a
 * plain row.
 *
 * Touch-target compliant — min-height 72px exceeds the 44px AAA bar.
 * Use this for Training schedule lists, Roster rows, video lists, etc.
 *
 * Usage:
 *   <app-list-row
 *     thumbnail="https://…/exercise.jpg"
 *     title="Resistance Day B"
 *     subline="Strength"
 *     tertiary="1:50pm"
 *     (click)="open(...)"
 *   />
 *
 * For icon-led rows pass `thumbnailIcon` (PrimeIcons class) instead of
 * `thumbnail`. For initials avatars pass `thumbnailInitials`.
 */
@Component({
  selector: "app-list-row",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div
      class="list-row"
      [class.list-row--interactive]="interactive()"
      [attr.role]="interactive() ? 'button' : null"
      [attr.tabindex]="interactive() ? 0 : null"
      [attr.aria-label]="ariaLabel() || (interactive() ? title() : null)"
      (click)="interactive() && onActivate()"
      (keydown.enter)="interactive() && onActivate()"
      (keydown.space)="interactive() && onActivate($event)"
    >
      <div class="list-row__thumb" [class.list-row__thumb--icon]="!!thumbnailIcon()">
        @if (thumbnail()) {
          <img [src]="thumbnail()" [alt]="thumbnailAlt() || ''" loading="lazy" />
        } @else if (thumbnailIcon()) {
          <i class="pi" [class]="thumbnailIcon()" aria-hidden="true"></i>
        } @else if (thumbnailInitials()) {
          <span class="list-row__initials">{{ thumbnailInitials() }}</span>
        }
      </div>
      <div class="list-row__body">
        <p class="list-row__title">{{ title() }}</p>
        @if (subline()) {
          <p class="list-row__subline">{{ subline() }}</p>
        }
        @if (tertiary()) {
          <p class="list-row__tertiary">{{ tertiary() }}</p>
        }
      </div>
      <div class="list-row__trailing">
        <ng-content></ng-content>
        @if (showChevron()) {
          <i class="pi pi-chevron-right list-row__chevron" aria-hidden="true"></i>
        }
      </div>
    </div>
  `,
  styleUrl: "./list-row.component.scss",
})
export class ListRowComponent {
  readonly title = input.required<string>();
  readonly subline = input<string>("");
  readonly tertiary = input<string>("");
  readonly thumbnail = input<string>("");
  readonly thumbnailAlt = input<string>("");
  readonly thumbnailIcon = input<string>("");
  readonly thumbnailInitials = input<string>("");
  readonly showChevron = input<boolean>(false);
  readonly ariaLabel = input<string>("");
  /** Pass true when the row is clickable; the row becomes role="button", tabindex=0, and emits activated. */
  readonly interactive = input<boolean>(false);

  readonly activated = output<void>();

  onActivate(event?: KeyboardEvent): void {
    if (event) event.preventDefault();
    this.activated.emit();
  }
}
