/**
 * Base Skeleton Component
 * 
 * Reusable skeleton loading placeholder with shimmer animation
 * Used to create content-specific skeleton screens
 * 
 * Evidence: Nielsen Norman Group - Skeleton screens reduce perceived load time by 20-30%
 * Reference: https://www.nngroup.com/articles/progress-indicators/
 */

import {
  Component,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-skeleton",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div 
      class="skeleton"
      [class]="'skeleton-' + variant()"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="borderRadius()"
      [attr.aria-hidden]="true"
    ></div>
  `,
  styleUrl: "./skeleton.component.scss",
})
export class SkeletonComponent {
  /** Variant: rectangle, circle, text */
  variant = input<"rectangle" | "circle" | "text">("rectangle");
  
  /** Width (CSS value: px, %, rem) */
  width = input<string>("100%");
  
  /** Height (CSS value: px, %, rem) */
  height = input<string>("1rem");
  
  /** Border radius (CSS value) */
  borderRadius = input<string>();
}
