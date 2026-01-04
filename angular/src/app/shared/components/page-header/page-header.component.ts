import { Component, input } from "@angular/core";

import { ButtonComponent } from "../button/button.component";

@Component({
  selector: "app-page-header",
  standalone: true,
  imports: [
    ButtonComponent,
  ],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          @if (icon()) {
            <i [class]="'pi ' + icon()"></i>
          }
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="page-subtitle">{{ subtitle() }}</p>
        }
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  // Angular 21: Use input() signal instead of @Input()
  title = input<string>("");
  subtitle = input<string | undefined>(undefined);
  icon = input<string | undefined>(undefined);
}
