import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { PlayerStatus, STATUS_OPTIONS } from "../roster.models";

@Component({
  selector: "app-roster-status-options",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./roster-status-options.component.html",
  styleUrl: "./roster-status-options.component.scss",
})
export class RosterStatusOptionsComponent {
  readonly options = STATUS_OPTIONS;
  readonly selected = input.required<PlayerStatus>();
  readonly selectedChange = output<PlayerStatus>();
  /** e.g. "Set status to" or "Set bulk status to" */
  readonly ariaLabelPrefix = input.required<string>();

  pick(value: PlayerStatus): void {
    this.selectedChange.emit(value);
  }
}
