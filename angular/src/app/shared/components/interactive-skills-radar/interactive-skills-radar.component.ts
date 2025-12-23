import {
  Component,
  signal,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { ProgressBarModule } from "primeng/progressbar";
import { ButtonModule } from "primeng/button";
import { DEFAULT_CHART_OPTIONS } from "../../config/chart.config";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";

export interface SubSkill {
  name: string;
  score: number;
}

export interface SkillData {
  label: string;
  value: number;
  breakdown: SubSkill[];
}

@Component({
  selector: "app-interactive-skills-radar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    ProgressBarModule,
    ButtonModule,
  ],
  template: `
    <p-card header="Skills Assessment">
      <div class="skills-container">
        <div class="radar-container">
          <p-chart type="radar" [data]="radarData()" [options]="radarOptions">
          </p-chart>
        </div>

        @if (selectedSkill()) {
          <div class="skills-breakdown">
            <h4>{{ selectedSkill()?.label }} Breakdown</h4>
            <div class="sub-skills">
              @for (
                subSkill of selectedSkill()?.breakdown;
                track trackBySubSkillName($index, subSkill)
              ) {
                <div class="sub-skill">
                  <span class="sub-skill-name">{{ subSkill.name }}</span>
                  <p-progressBar
                    [value]="subSkill.score"
                    [showValue]="true"
                  ></p-progressBar>
                  <p-button
                    icon="pi pi-play-circle"
                    [text]="true"
                    label="Practice"
                    size="small"
                    (onClick)="startSkillDrill(subSkill)"
                  >
                  </p-button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </p-card>
  `,
  styles: [
    `
      .skills-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .radar-container {
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .skills-breakdown {
        padding: var(--space-5);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .skills-breakdown h4 {
        margin: 0 0 var(--space-5) 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .sub-skills {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .sub-skill {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--p-surface-card);
        border-radius: var(--p-border-radius);
        border: 1px solid var(--p-surface-200);
      }

      .sub-skill-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 1rem;
      }

      @media (min-width: 768px) {
        .skills-container {
          flex-direction: row;
        }

        .radar-container {
          flex: 1;
        }

        .skills-breakdown {
          flex: 0 0 350px;
        }
      }

      @media (max-width: 767px) {
        .radar-container {
          min-height: 300px;
        }
      }
    `,
  ],
})
export class InteractiveSkillsRadarComponent {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  selectedSkill = signal<SkillData | null>(null);

  // Sample skills data
  skillsData: SkillData[] = [
    {
      label: "Speed",
      value: 85,
      breakdown: [
        { name: "Sprint Speed", score: 88 },
        { name: "Acceleration", score: 82 },
        { name: "Agility", score: 85 },
      ],
    },
    {
      label: "Accuracy",
      value: 90,
      breakdown: [
        { name: "Throwing Accuracy", score: 92 },
        { name: "Catching", score: 88 },
        { name: "Target Precision", score: 90 },
      ],
    },
    {
      label: "Endurance",
      value: 78,
      breakdown: [
        { name: "Cardiovascular", score: 80 },
        { name: "Muscle Endurance", score: 75 },
        { name: "Recovery Rate", score: 79 },
      ],
    },
    {
      label: "Strength",
      value: 82,
      breakdown: [
        { name: "Upper Body", score: 85 },
        { name: "Lower Body", score: 80 },
        { name: "Core Strength", score: 81 },
      ],
    },
    {
      label: "Coordination",
      value: 88,
      breakdown: [
        { name: "Hand-Eye", score: 90 },
        { name: "Balance", score: 86 },
        { name: "Reaction Time", score: 88 },
      ],
    },
    {
      label: "Strategy",
      value: 75,
      breakdown: [
        { name: "Game Awareness", score: 78 },
        { name: "Decision Making", score: 72 },
        { name: "Tactical Knowledge", score: 75 },
      ],
    },
  ];

  radarData = signal({
    labels: this.skillsData.map((skill) => skill.label),
    datasets: [
      {
        label: "Current Skills",
        data: this.skillsData.map((skill) => skill.value),
        backgroundColor: "rgba(8, 153, 73, 0.2)",
        borderColor: "rgba(8, 153, 73, 1)",
        pointBackgroundColor: "rgba(8, 153, 73, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(8, 153, 73, 1)",
      },
      {
        label: "Target Skills",
        data: [90, 95, 85, 90, 95, 85],
        backgroundColor: "rgba(241, 196, 15, 0.2)",
        borderColor: "rgba(241, 196, 15, 1)",
        pointBackgroundColor: "rgba(241, 196, 15, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(241, 196, 15, 1)",
      },
    ],
  });

  get radarOptions() {
    return {
      ...DEFAULT_CHART_OPTIONS,
      responsive: true,
      maintainAspectRatio: true,
      onClick: (evt: any, elements: any[]) => {
        if (elements.length > 0) {
          const elementIndex = elements[0].index;
          this.onSkillSelect(elementIndex);
        }
      },
      plugins: {
        legend: {
          position: "bottom" as const,
          display: true,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.dataset.label}: ${context.parsed.r}/100`;
            },
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
          },
        },
      },
    };
  }

  onSkillSelect(index: number): void {
    if (index >= 0 && index < this.skillsData.length) {
      const selected = this.skillsData[index];
      this.selectedSkill.set(selected);
    }
  }

  startSkillDrill(subSkill: SubSkill): void {
    // TODO: Implement skill drill functionality
    this.logger.debug(`Starting drill for: ${subSkill.name}`);
    // This could navigate to a training page or open a modal
  }

  trackBySubSkillName(index: number, subSkill: SubSkill): string {
    return subSkill.name;
  }
}
