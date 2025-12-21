import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-qb-assessment-tools",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule,
    ButtonModule,
    MainLayoutComponent,
    PageHeaderComponent
  ],
  template: `
    <app-main-layout>
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
            <p>Assess your throwing accuracy across different distances and scenarios.</p>
            <p-button
              label="Start Assessment"
              icon="pi pi-play"
              class="mt-4"
            ></p-button>
          </p-card>

          <p-card class="tool-card">
            <ng-template pTemplate="header">
              <h3>Footwork Evaluation</h3>
            </ng-template>
            <p>Evaluate your footwork mechanics and pocket presence.</p>
            <p-button
              label="Start Assessment"
              icon="pi pi-play"
              class="mt-4"
            ></p-button>
          </p-card>

          <p-card class="tool-card">
            <ng-template pTemplate="header">
              <h3>Decision Making</h3>
            </ng-template>
            <p>Test your ability to read defenses and make quick decisions.</p>
            <p-button
              label="Start Assessment"
              icon="pi pi-play"
              class="mt-4"
            ></p-button>
          </p-card>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .qb-assessment-tools-page {
        padding: var(--space-6);
      }

      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-4);
        margin-top: var(--space-6);
      }

      .tool-card {
        transition: transform 0.2s;
      }

      .tool-card:hover {
        transform: translateY(-4px);
      }
    `,
  ],
})
export class QbAssessmentToolsComponent implements OnInit {
  ngOnInit(): void {
    // Load assessment tools
  }
}

