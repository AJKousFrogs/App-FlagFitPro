import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { SemanticMeaningRendererComponent } from "../../../shared/components/semantic-meaning-renderer/semantic-meaning-renderer.component";
import type { ActionRequiredMeaning } from "../../../core/semantics/semantic-meaning.types";

@Component({
  selector: "app-player-dashboard-setup-card",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    CardShellComponent,
    SemanticMeaningRendererComponent,
  ],
  templateUrl: "./player-dashboard-setup-card.component.html",
  styleUrl: "./player-dashboard-setup-card.component.scss",
})
export class PlayerDashboardSetupCardComponent {
  readonly hasCompletedOnboarding = input.required<boolean>();
  readonly actionRequiredMeaning = input<ActionRequiredMeaning | null>(null);
  readonly contactCoach = output<void>();
}
