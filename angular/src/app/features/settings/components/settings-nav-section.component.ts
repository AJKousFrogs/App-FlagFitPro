import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

export interface SettingsNavItem {
  id: string;
  icon: string;
  label: string;
}

@Component({
  selector: "app-settings-nav-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./settings-nav-section.component.html",
  styleUrl: "./settings-nav-section.component.scss",
})
export class SettingsNavSectionComponent {
  readonly items = input.required<SettingsNavItem[]>();
  readonly activeId = input<string>("");

  readonly selectSection = output<string>();

  onSelect(sectionId: string): void {
    this.selectSection.emit(sectionId);
  }
}
