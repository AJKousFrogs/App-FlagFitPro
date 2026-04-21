import { Component, ChangeDetectionStrategy } from "@angular/core";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

@Component({
  selector: "app-qb-assessment-tools",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, ButtonComponent, CardShellComponent],
  template: `
    <div class="qb-assessment-tools-page">
      <app-page-header
        title="QB Assessment Tools"
        subtitle="Evaluate quarterback performance and skills"
        icon="pi-clipboard"
      ></app-page-header>

      <div class="tools-grid">
        <app-card-shell class="tool-card" title="Throwing Accuracy Test">
          <p>
            Assess your throwing accuracy across different distances and
            scenarios.
          </p>
          <app-button iconLeft="pi-play">Start Assessment</app-button>
        </app-card-shell>

        <app-card-shell class="tool-card" title="Footwork Evaluation">
          <p>Evaluate your footwork mechanics and pocket presence.</p>
          <app-button iconLeft="pi-play">Start Assessment</app-button>
        </app-card-shell>

        <app-card-shell class="tool-card" title="Decision Making">
          <p>Test your ability to read defenses and make quick decisions.</p>
          <app-button iconLeft="pi-play">Start Assessment</app-button>
        </app-card-shell>
      </div>
    </div>
  `,
  styleUrl: "./qb-assessment-tools.component.scss",
})
export class QbAssessmentToolsComponent {
}
