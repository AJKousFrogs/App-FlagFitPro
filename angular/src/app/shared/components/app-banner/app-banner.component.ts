/**
 * Banner Component - Deterministic UI for TODAY screen banners
 *
 * Contract: TODAY Screen UX Authority Contract v1
 * No business logic - pure rendering component
 */

import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../button/button.component";

export interface BannerCta {
  label: string;
  action: string;
  variant?: "primary" | "secondary";
}

@Component({
  selector: "app-banner",
  imports: [CommonModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app-banner.component.html",
  styleUrl: "./app-banner.component.scss",
})
export class AppBannerComponent {
  type = input<"info" | "warning" | "alert" | "error">("info");
  message = input.required<string>();
  primaryCta = input<BannerCta | null>(null);
  secondaryCta = input<BannerCta | null>(null);
  icon = input<string | null>(null);

  // Emit action when CTA clicked
  ctaClick = output<string>();

  onCtaClick(action: string): void {
    this.ctaClick.emit(action);
  }

  /** Template bindings to satisfy no-call-expression */
  get typeDisplay(): "info" | "warning" | "alert" | "error" {
    return this.type();
  }

  get messageDisplay(): string {
    return this.message();
  }

  get primaryCtaDisplay(): BannerCta | null {
    return this.primaryCta();
  }

  get secondaryCtaDisplay(): BannerCta | null {
    return this.secondaryCta();
  }

  get iconClass(): string {
    const iconVal = this.icon();
    if (iconVal) {
      return `pi ${iconVal}`;
    }
    const iconMap: Record<string, string> = {
      info: "pi-info-circle",
      warning: "pi-exclamation-triangle",
      alert: "pi-bell",
      error: "pi-times-circle",
    };
    return `pi ${iconMap[this.typeDisplay] || "pi-info-circle"}`;
  }
}
