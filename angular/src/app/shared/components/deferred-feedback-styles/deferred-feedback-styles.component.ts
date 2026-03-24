import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from "@angular/core";

@Component({
  selector: "app-deferred-feedback-styles",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    hidden: "",
    "aria-hidden": "true",
  },
  template: "",
  styleUrl: "./deferred-feedback-styles.component.scss",
})
export class DeferredFeedbackStylesComponent {}
