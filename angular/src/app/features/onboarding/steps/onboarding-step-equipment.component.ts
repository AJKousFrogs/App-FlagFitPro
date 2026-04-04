import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { EQUIPMENT_OPTIONS } from "../constants/onboarding-options";
import { OnboardingStateService } from "../services/onboarding-state.service";

@Component({
  selector: "app-onboarding-step-equipment",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <i class="pi pi-box step-icon"></i>
        <div>
          <h3>Available Equipment</h3>
          <p class="step-description">What do you have access to for training?</p>
        </div>
      </div>
      <div class="equipment-grid" role="group" aria-label="Available equipment">
        @for (item of equipmentOptions; track item.value) {
          <button type="button" role="checkbox" class="equipment-card"
            [class.selected]="state.formData.equipmentAvailable.includes(item.value)"
            [class.none-card]="item.value === 'none'"
            [attr.aria-checked]="state.formData.equipmentAvailable.includes(item.value)"
            [attr.data-cy]="'equipment-' + item.value"
            (click)="state.toggleEquipment(item.value)"
            (keydown.enter)="state.toggleEquipment(item.value)"
            (keydown.space)="state.toggleEquipment(item.value); $event.preventDefault()">
            <span class="equipment-check">
              @if (state.formData.equipmentAvailable.includes(item.value)) { <i class="pi pi-check"></i> }
            </span>
            <i [class]="item.icon" class="equipment-icon"></i>
            <span class="equipment-label">{{ item.label }}</span>
          </button>
        }
      </div>
      <div class="info-box success">
        <i class="pi pi-lightbulb"></i>
        <span>We'll recommend exercises based on what you have available. Bodyweight exercises are always an option!</span>
      </div>
    </div>
  `,
})
export class OnboardingStepEquipmentComponent {
  readonly state = inject(OnboardingStateService);
  readonly equipmentOptions = EQUIPMENT_OPTIONS;
}
