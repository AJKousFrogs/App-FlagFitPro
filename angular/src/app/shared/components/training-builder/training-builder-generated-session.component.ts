import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

import { ButtonComponent } from "../button/button.component";
import { CardShellComponent } from "../card-shell/card-shell.component";
import { StatusTagComponent, StatusTagSeverity } from "../status-tag/status-tag.component";
import { Timeline } from "primeng/timeline";
import { TrainingTimelineEvent } from "./training-builder.models";

@Component({
  selector: "app-training-builder-generated-session",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Timeline, ButtonComponent, CardShellComponent, StatusTagComponent],
  templateUrl: "./training-builder-generated-session.component.html",
  styleUrl: "./training-builder-generated-session.component.scss",
})
export class TrainingBuilderGeneratedSessionComponent {
  totalDuration = input.required<number>();
  exerciseCount = input.required<number>();
  intensity = input.required<string>();
  intensitySeverity = input.required<StatusTagSeverity>();
  timelineEvents = input.required<TrainingTimelineEvent[]>();
  isSaving = input<boolean>(false);

  previous = output<void>();
  preview = output<TrainingTimelineEvent>();
  modify = output<TrainingTimelineEvent>();
  start = output<void>();
  save = output<void>();
}
