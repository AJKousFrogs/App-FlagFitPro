import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from "@angular/core";

@Component({
  selector: "app-deferred-global-styles",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    hidden: "",
    "aria-hidden": "true",
  },
  template: "",
  styleUrl: "./deferred-global-styles.component.scss",
})
export class DeferredGlobalStylesComponent {}
