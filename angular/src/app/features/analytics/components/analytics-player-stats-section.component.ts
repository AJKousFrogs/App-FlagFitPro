import { DecimalPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { TableModule } from "primeng/table";
import { TabPanel, Tabs } from "primeng/tabs";
import { PlayerGameStats, PlayerMultiSeasonStats, PlayerSeasonStats } from "../../../core/services/player-statistics.service";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

@Component({
  selector: "app-analytics-player-stats-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    TableModule,
    Tabs,
    TabPanel,
    CardShellComponent,
    StatusTagComponent,
  ],
  templateUrl: "./analytics-player-stats-section.component.html",
  styleUrl: "./analytics-player-stats-section.component.scss",
})
export class AnalyticsPlayerStatsSectionComponent {
  playerGameStats = input.required<PlayerGameStats[]>();
  playerSeasonStats = input<PlayerSeasonStats | null>(null);
  playerMultiSeasonStats = input<PlayerMultiSeasonStats | null>(null);
  gamesMissed = input(0);
  attendanceRate = input(0);
}
