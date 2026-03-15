/**
 * Traffic Light Risk Component
 *
 * Visual indicator for ACWR-based injury risk assessment.
 * Uses a horizontal traffic light design for compact dashboard display.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 *
 * @author FlagFit Pro Team
 * @version 2.0.0
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
  ElementRef,
  Renderer2,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RiskZone } from "../../../core/models/acwr.models";

@Component({
  selector: "app-traffic-light-risk",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: "./traffic-light-risk.component.html",
  styleUrl: "./traffic-light-risk.component.scss",
})
export class TrafficLightRiskComponent {
  private renderer = inject(Renderer2);

  scaleMarker = viewChild<ElementRef<HTMLDivElement>>("scaleMarker");

  // Angular signals for inputs
  riskZone = input.required<RiskZone>();
  acwrValue = input.required<number>();
  compact = input<boolean>(false);

  currentRisk = computed(() => this.riskZone());

  // Calculate marker position on the scale bar
  markerPosition = computed(() => {
    const value = this.acwrValue();
    if (value < 0.8) {
      // Under training zone: 0-20%
      return (value / 0.8) * 20;
    } else if (value < 1.3) {
      // Sweet spot zone: 20-70%
      return 20 + ((value - 0.8) / 0.5) * 50;
    } else if (value < 1.5) {
      // Elevated risk zone: 70-90%
      return 70 + ((value - 1.3) / 0.2) * 20;
    } else {
      // Danger zone: 90-100%
      return 90 + Math.min(((value - 1.5) / 0.5) * 10, 10);
    }
  });

  constructor() {
    afterNextRender(() => {
      effect(() => {
        const marker = this.scaleMarker()?.nativeElement;
        if (!marker) return;
        this.renderer.setStyle(
          marker,
          "left",
          `${this.markerPosition()}%`,
        );
      });
    });
  }

  /** CSS class for ACWR value color - getter to satisfy no-call-expression */
  get acwrClass(): string {
    const level = this.currentRisk().level;
    switch (level) {
      case "sweet-spot":
        return "optimal";
      case "elevated-risk":
        return "warning";
      case "danger-zone":
        return "danger";
      case "under-training":
        return "under";
      default:
        return "no-data";
    }
  }

  /** Snapshot of current risk for template binding - avoids repeated signal calls */
  get risk(): RiskZone {
    return this.currentRisk();
  }

  /** Compact mode for template binding */
  get isCompact(): boolean {
    return this.compact();
  }

  /** ACWR value for template binding */
  get acwrDisplay(): number {
    return this.acwrValue();
  }
}
