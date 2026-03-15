import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-header-search-widget",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="search-widget">
      <i class="pi pi-search"></i>
    </button>
  `,
  styleUrl: "./header-search-widget.component.scss",
})
export class HeaderSearchWidgetComponent {}
