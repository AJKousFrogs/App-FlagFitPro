import { ChangeDetectionStrategy, Component, output } from "@angular/core";
import { HeaderSearchWidgetComponent } from "../header/header-search-widget.component";

@Component({
  selector: "app-mobile-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderSearchWidgetComponent],
  template: `
    <header class="mobile-header-shell">
      <button (click)="toggleSidebar.emit()" class="mobile-menu-toggle">
        <i class="pi pi-bars"></i>
      </button>
      <div class="mobile-header-center">
        <img src="assets/icons/logo-icon-color.svg" alt="FlagFit Pro" class="mobile-logo" />
      </div>
      <div class="mobile-header-end">
        <app-header-search-widget></app-header-search-widget>
      </div>
    </header>
  `,
  styleUrl: "./mobile-header.component.scss",
})
export class MobileHeaderComponent {
  readonly toggleSidebar = output<void>();
}
