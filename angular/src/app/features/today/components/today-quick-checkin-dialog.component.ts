import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";

interface QuickMood {
  value: number;
  icon: string;
  label: string;
}

interface QuickEnergyLevel {
  value: number;
  label: string;
}

interface QuickFormData {
  overallFeeling: number | null;
  energyLevel: number | null;
  hasSoreness: boolean | null;
  sleepHours: number | null;
  sorenessLevel: number | null;
  stressLevel: number | null;
  sorenessAreas: string[];
}

@Component({
  selector: "app-today-quick-checkin-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppDialogComponent, DialogHeaderComponent, DialogFooterComponent],
  templateUrl: "./today-quick-checkin-dialog.component.html",
  styleUrl: "./today-quick-checkin-dialog.component.scss",
})
export class TodayQuickCheckinDialogComponent {
  readonly visible = input(false);
  readonly isSaving = input(false);
  readonly isValid = input(false);
  readonly quickFormData = input.required<QuickFormData>();
  readonly quickMoods = input.required<QuickMood[]>();
  readonly quickEnergyLevels = input.required<QuickEnergyLevel[]>();
  readonly quickReadinessScore = input(0);
  readonly quickReadinessClass = input.required<string>();

  readonly visibleChange = output<boolean>();
  readonly submit = output<void>();
  readonly setOverallFeeling = output<number>();
  readonly setEnergyLevel = output<number>();
  readonly setHasSoreness = output<boolean>();

  close(): void {
    this.visibleChange.emit(false);
  }
}
