import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

import { ButtonComponent } from "../button/button.component";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { Goal } from "./training-builder.models";

@Component({
  selector: "app-training-builder-goals-step",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, StatusTagComponent],
  templateUrl: "./training-builder-goals-step.component.html",
  styleUrl: "./training-builder-goals-step.component.scss",
})
export class TrainingBuilderGoalsStepComponent {
  goals = input.required<readonly Goal[]>();
  selectedGoalIds = input.required<readonly string[]>();

  toggleGoal = output<string>();
  next = output<void>();

  isSelected(goalId: string): boolean {
    return this.selectedGoalIds().includes(goalId);
  }

  trackByGoalId(index: number, goal: Goal): string {
    return goal.id;
  }

  iconClass(goal: Goal): string {
    return `goal-icon ${goal.id === "speed" ? "goal-icon--speed" : ""} ${
      goal.id === "agility" ? "goal-icon--agility" : ""
    } ${goal.id === "endurance" ? "goal-icon--endurance" : ""} ${
      goal.id === "skills" ? "goal-icon--skills" : ""
    }`.trim();
  }
}
