import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Skeleton Component - Angular 21
 *
 * A skeleton loader component for loading states
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-skeleton",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (variant() === "text") {
      <div
        [class]="skeletonClass()"
        [style.width]="width()"
        [style.height]="height()"
      >
        <div class="skeleton-shimmer"></div>
      </div>
    } @else if (variant() === "circle") {
      <div
        [class]="skeletonClass()"
        [style.width]="size()"
        [style.height]="size()"
      >
        <div class="skeleton-shimmer"></div>
      </div>
    } @else if (variant() === "rect") {
      <div
        [class]="skeletonClass()"
        [style.width]="width()"
        [style.height]="height()"
      >
        <div class="skeleton-shimmer"></div>
      </div>
    } @else {
      <div [class]="skeletonClass()">
        @for (line of lines(); track $index) {
          <div
            class="skeleton-line"
            [style.width]="line.width || '100%'"
            [style.height]="line.height || '1rem'"
          >
            <div class="skeleton-shimmer"></div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .skeleton {
        background-color: var(--p-surface-200);
        border-radius: var(--p-border-radius);
        position: relative;
        overflow: hidden;
      }

      .skeleton-circle {
        border-radius: 50%;
      }

      .skeleton-text {
        height: 1rem;
        border-radius: var(--p-border-radius);
      }

      .skeleton-rect {
        border-radius: var(--p-border-radius);
      }

      .skeleton-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .skeleton-line {
        background-color: var(--p-surface-200);
        border-radius: var(--p-border-radius);
        position: relative;
        overflow: hidden;
      }

      .skeleton-shimmer {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.4),
          transparent
        );
        animation: shimmer 1.5s infinite;
      }

      @keyframes shimmer {
        0% {
          left: -100%;
        }
        100% {
          left: 100%;
        }
      }

      /* Animation variants */
      .skeleton-pulse .skeleton-shimmer {
        animation: pulse 1.5s ease-in-out infinite;
        background: var(--p-surface-300);
        left: 0;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `,
  ],
})
export class SkeletonComponent {
  // Configuration
  variant = input<"text" | "circle" | "rect" | "custom">("text");
  width = input<string>("100%");
  height = input<string>("1rem");
  size = input<string>("2rem");
  animation = input<"shimmer" | "pulse">("shimmer");
  lines = input<Array<{ width?: string; height?: string }>>([
    { width: "100%", height: "1rem" },
    { width: "80%", height: "1rem" },
    { width: "60%", height: "1rem" },
  ]);

  // Computed class
  skeletonClass = computed(() => {
    const baseClass =
      this.variant() === "custom"
        ? "skeleton-container"
        : `skeleton skeleton-${this.variant()}`;
    const animationClass = this.animation() === "pulse" ? "skeleton-pulse" : "";
    return `${baseClass} ${animationClass}`.trim();
  });
}
