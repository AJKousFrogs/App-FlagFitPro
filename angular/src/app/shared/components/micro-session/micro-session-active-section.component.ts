import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { ProgressBarComponent } from "../progress-bar/progress-bar.component";
import { Slider } from "primeng/slider";
import { TextareaComponent } from "../textarea/textarea.component";

import { ButtonComponent } from "../button/button.component";
import { MicroSessionData, MicroSessionStep, SessionStatus } from "./micro-session.models";
import { formatTimeMMSS } from "../../utils/format.utils";

@Component({
  selector: "app-micro-session-active-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ProgressBarComponent, Slider, TextareaComponent, ButtonComponent],
  templateUrl: "./micro-session-active-section.component.html",
  styleUrl: "./micro-session-active-section.component.scss",
})
export class MicroSessionActiveSectionComponent {
  session = input.required<MicroSessionData>();
  currentStatus = input.required<SessionStatus>();
  currentStepIndex = input.required<number>();
  currentStep = input.required<MicroSessionStep>();
  overallProgress = input.required<number>();
  stepProgress = input.required<number>();
  timerClass = input.required<string>();
  stepTimeRemaining = input.required<number>();
  totalElapsedTime = input.required<number>();
  followUpRating = input.required<number>();
  followUpNotes = input.required<string>();
  followUpSubmitted = input.required<boolean>();
  submitting = input.required<boolean>();

  resume = output<void>();
  pause = output<void>();
  nextStep = output<void>();
  complete = output<void>();
  followUpRatingChange = output<number | null | undefined>();
  followUpNotesInput = output<string>();
  submitFollowUp = output<void>();
  done = output<void>();

  readonly formatTime = formatTimeMMSS;
  readonly Math = Math;
}
