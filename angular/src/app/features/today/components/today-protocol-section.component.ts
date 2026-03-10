import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ProgressBar } from "primeng/progressbar";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { CardHeaderComponent } from "../../../shared/components/card-header/card-header.component";
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
    CommonModule,
    RouterModule,
    ProgressBar,
    ButtonComponent,
    CardShellComponent,
    CardHeaderComponent,
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
