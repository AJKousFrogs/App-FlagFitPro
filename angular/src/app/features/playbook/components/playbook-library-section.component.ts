import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
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
    SearchInputComponent,
    ProgressBarComponent,
    SelectComponent,
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

  readonly searchInput = output<string>();
  readonly categoryChange = output<PlayCategory | null | undefined>();
  readonly statusChange = output<"memorized" | "learning" | null | undefined>();
  readonly selectPlay = output<Play>();
  readonly startQuiz = output<void>();

  emitCategoryChange(value: unknown): void {
    this.categoryChange.emit(
      (value as PlayCategory | null | undefined) ?? null,
    );
  }

  emitStatusChange(value: unknown): void {
    this.statusChange.emit(
      (value as "memorized" | "learning" | null | undefined) ?? null,
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
