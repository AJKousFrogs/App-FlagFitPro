import {
  Component,
  signal,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { Card } from "primeng/card";
import { UIChart } from "primeng/chart";
import { ProgressBar } from "primeng/progressbar";
import { ButtonComponent } from "../button/button.component";
import { DEFAULT_CHART_OPTIONS } from "../../config/chart.config";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { ApiService } from "../../../core/services/api.service";

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
  imports: [CommonModule, Card, UIChart, ProgressBar, ButtonComponent],
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
                  <app-button
                    variant="text"
                    size="sm"
                    iconLeft="pi-play-circle"
                    (clicked)="startSkillDrill(subSkill)"
                    >Practice</app-button
                  >
                </div>
              }
            </div>
          </div>
        }
      </div>
    </p-card>
  `,
  styleUrl: "./interactive-skills-radar.component.scss",
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
      onClick: (
        evt: MouseEvent | PointerEvent,
        elements: Array<{ index: number }>,
      ) => {
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
            label: (context: {
              dataset: { label?: string };
              parsed: { r: number };
            }) => {
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

  private router = inject(Router);
  private toastService = inject(ToastService);

  startSkillDrill(subSkill: SubSkill): void {
    this.logger.debug(`Starting drill for: ${subSkill.name}`);

    // Navigate to training with the skill context
    this.toastService.info(`Loading drills for ${subSkill.name}...`);

    // Map skill names to exercise categories/types
    const skillToCategory: Record<string, string> = {
      "Route Running": "agility",
      Catching: "catching",
      Blocking: "strength",
      "Throwing Accuracy": "throwing",
      "Arm Strength": "throwing",
      "Decision Making": "mental",
      "Field Vision": "mental",
      Speed: "speed",
      Agility: "agility",
      Endurance: "conditioning",
      Tackling: "defense",
      Coverage: "defense",
    };

    const category = skillToCategory[subSkill.name] || "general";

    // Navigate to exercise library filtered by skill
    this.router.navigate(["/exercise-library"], {
      queryParams: { category, skill: subSkill.name },
    });
  }

  trackBySubSkillName(index: number, subSkill: SubSkill): string {
    return subSkill.name;
  }
}
