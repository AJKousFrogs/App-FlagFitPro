import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from "primeng/accordion";
import { Divider } from "primeng/divider";
import { Timeline } from "primeng/timeline";

import { PhaseConfig } from "../../../../core/services/flag-football-periodization.service";

interface TimelineEvent {
  phase: string;
  month: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: "app-periodization-annual-tab",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Timeline,
    Divider,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
  ],
  templateUrl: "./periodization-annual-tab.component.html",
  styleUrl: "./periodization-annual-tab.component.scss",
})
export class PeriodizationAnnualTabComponent {
  timeline = input<TimelineEvent[]>([]);
  phases = input<PhaseConfig[]>([]);
}
