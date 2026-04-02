import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation,
} from "@angular/core";

@Component({
  selector: "app-header-search",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./header-search.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class HeaderSearchComponent {
  readonly placeholder = input<string>("");
  readonly shortcutModifier = input<string>("");

  readonly search = output<void>();
}

