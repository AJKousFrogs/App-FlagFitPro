import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

/**
 * Root — just the router outlet. The persistent UI (frame, bottom nav, FAB) is
 * the routed ShellComponent; screens render inside it. Phase E rebuild.
 */
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class AppComponent {}
