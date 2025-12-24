import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SkipToContentComponent } from "./shared/components/skip-to-content/skip-to-content.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, SkipToContentComponent],
  template: `
    <app-skip-to-content />
    <main id="main-content" tabindex="-1">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      main {
        outline: none;
      }

      /* Screen reader only class (global) */
      :host ::ng-deep .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ],
})
export class AppComponent {}

