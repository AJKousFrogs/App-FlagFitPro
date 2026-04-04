import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/ui-components";
import { ProtocolBlockComponent } from "../../training/daily-protocol/components/protocol-block.component";
import {
  DailyProtocol,
  ProtocolBlock,
} from "../../training/daily-protocol/daily-protocol.models";

@Component({
  selector: "app-today-protocol-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ProgressBarComponent,
    ButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    ProtocolBlockComponent,
  ],
  templateUrl: "./today-protocol-section.component.html",
  styleUrl: "./today-protocol-section.component.scss",
})
export class TodayProtocolSectionComponent {
  protocol = input<Partial<DailyProtocol> | null>(null);
  blocks = input<ProtocolBlock[]>([]);
  trainingAllowed = input(false);
  isGenerating = input(false);

  refresh = output<void>();
  generate = output<void>();
  exerciseComplete = output<void>();
}
