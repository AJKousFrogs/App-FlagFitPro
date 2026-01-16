import { Component, ChangeDetectionStrategy, OnInit } from "@angular/core";

import { Card } from "primeng/card";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-qb-assessment-tools",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, PageHeaderComponent, ButtonComponent],
  template: `
    <div class="qb-assessment-tools-page">
      <app-page-header
        title="QB Assessment Tools"
        subtitle="Evaluate quarterback performance and skills"
        icon="pi-clipboard"
      ></app-page-header>

      <div class="tools-grid">
        <p-card class="tool-card">
          <ng-template pTemplate="header">
            <h3>Throwing Accuracy Test</h3>
          </ng-template>
          <p>
            Assess your throwing accuracy across different distances and
            scenarios.
          </p>
          <app-button iconLeft="pi-play">Start Assessment</app-button>
        </p-card>

        <p-card class="tool-card">
          <ng-template pTemplate="header">
            <h3>Footwork Evaluation</h3>
          </ng-template>
          <p>Evaluate your footwork mechanics and pocket presence.</p>
          <app-button iconLeft="pi-play">Start Assessment</app-button>
        </p-card>

        <p-card class="tool-card">
          <ng-template pTemplate="header">
            <h3>Decision Making</h3>
          </ng-template>
          <p>Test your ability to read defenses and make quick decisions.</p>
          <app-button iconLeft="pi-play">Start Assessment</app-button>
        </p-card>
      </div>
    </div>
  `,
  styleUrl: "./qb-assessment-tools.component.scss",
})
export class QbAssessmentToolsComponent implements OnInit {
  ngOnInit(): void {
    // Load assessment tools
  }
}
