import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";

export type BackdropTone = "default" | "light";

@Component({
  selector: "app-backdrop",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div
        [class]="backdropClasses()"
        [style.z-index]="zIndex() ?? null"
        aria-hidden="true"
        (click)="handleClick($event)"
      ></div>
    }
  `,
})
export class BackdropComponent {
  visible = input(true);
  tone = input<BackdropTone>("default");
  blur = input(true);
  dismissible = input(true);
  styleClass = input("");
  zIndex = input<number | null>(null);

  backdropClick = output<MouseEvent>();

  readonly backdropClasses = computed(() =>
    [
      "app-backdrop",
      `app-backdrop--${this.tone()}`,
      this.blur() ? "app-backdrop--blur" : "",
      this.styleClass(),
    ]
      .filter(Boolean)
      .join(" "),
  );

  handleClick(event: MouseEvent): void {
    if (!this.dismissible()) {
      return;
    }
    this.backdropClick.emit(event);
  }
}
