import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { AppLoadingComponent } from "../loading/loading.component";
import { PageErrorStateComponent } from "../page-error-state/page-error-state.component";

@Component({
  selector: "app-staff-dashboard-load-state",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLoadingComponent, PageErrorStateComponent],
  templateUrl: "./staff-dashboard-load-state.component.html",
})
export class StaffDashboardLoadStateComponent {
  readonly loading = input(false);
  readonly loadError = input<string | null>(null);
  readonly loadingMessage = input.required<string>();
  readonly errorTitle = input.required<string>();

  readonly retry = output<void>();
}
