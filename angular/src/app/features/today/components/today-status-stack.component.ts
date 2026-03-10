import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AcwrBaselineComponent } from "../../../shared/components/acwr-baseline/acwr-baseline.component";
import { AppBannerComponent } from "../../../shared/components/app-banner/app-banner.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { TodayViewModel } from "../resolution/today-state.resolver";

@Component({
  selector: "app-today-status-stack",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppBannerComponent,
    AcwrBaselineComponent,
    CardShellComponent,
  ],
  templateUrl: "./today-status-stack.component.html",
  styleUrl: "./today-status-stack.component.scss",
})
export class TodayStatusStackComponent {
  errorState = input<TodayViewModel["errorState"]>();
  blockingCoachAlertBanner = input<TodayViewModel["banners"][number] | null>(null);
  blockingCoachAlertPrimaryCta = input<{
    label: string;
    action: string;
    variant?: "primary" | "secondary";
  } | null>(null);
  blockingCoachAlertSecondaryCta = input<{
    label: string;
    action: string;
    variant?: "primary" | "secondary";
  } | null>(null);
  coachAttribution = input<string | null>(null);
  coachModifiedTime = input<string | null>(null);
  visibleBanners = input<TodayViewModel["banners"]>([]);
  acwrBaseline = input<TodayViewModel["acwrBaseline"]>();

  ctaClick = output<string>();
}
