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
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app-banner.component.html",
  styleUrls: ["./app-banner.component.scss"],
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

  getIconClass(): string {
    if (this.icon()) {
      return `pi ${this.icon()}`;
    }

    // Default icons by type
    const iconMap: Record<string, string> = {
      info: "pi-info-circle",
      warning: "pi-exclamation-triangle",
      alert: "pi-bell",
      error: "pi-times-circle",
    };

    return `pi ${iconMap[this.type()] || "pi-info-circle"}`;
  }
}
