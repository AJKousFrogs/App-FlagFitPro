import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select, type SelectChangeEvent } from "primeng/select";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Play, PlayCategory } from "../playbook.models";

@Component({
  selector: "app-playbook-library-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    InputText,
    ProgressBar,
    Select,
    EmptyStateComponent,
    ButtonComponent,
    CardShellComponent,
    StatusTagComponent,
  ],
  templateUrl: "./playbook-library-section.component.html",
  styleUrl: "./playbook-library-section.component.scss",
})
export class PlaybookLibrarySectionComponent {
  readonly filteredPlays = input.required<Play[]>();
  readonly memorizedCount = input.required<number>();
  readonly totalPlays = input.required<number>();
  readonly progressPercent = input.required<number>();
  readonly searchQuery = input.required<string>();
  readonly categoryOptions = input.required<{ label: string; value: PlayCategory }[]>();
  readonly statusOptions = input.required<{ label: string; value: "memorized" | "learning" }[]>();
  readonly emptyDescription = input.required<string>();

  readonly searchInput = output<Event>();
  readonly categoryChange = output<PlayCategory | null | undefined>();
  readonly statusChange = output<"memorized" | "learning" | null | undefined>();
  readonly selectPlay = output<Play>();
  readonly startQuiz = output<void>();

  emitCategoryChange(event: SelectChangeEvent): void {
    this.categoryChange.emit(
      (event.value as PlayCategory | null | undefined) ?? null,
    );
  }

  emitStatusChange(event: SelectChangeEvent): void {
    this.statusChange.emit(
      (event.value as "memorized" | "learning" | null | undefined) ?? null,
    );
  }

  getCategoryLabel(category: PlayCategory): string {
    const found = this.categoryOptions().find((item) => item.value === category);
    return found?.label || category;
  }

  getCategorySeverity(
    category: PlayCategory,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (category) {
      case "offense":
        return "success";
      case "defense":
        return "info";
      case "special-teams":
        return "warning";
      default:
        return "secondary";
    }
  }
}
