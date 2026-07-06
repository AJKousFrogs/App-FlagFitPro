import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

/**
 * Loading skeleton — a shimmer placeholder shown while a screen's primary data
 * is in flight, so the user sees the shape of the answer forming instead of a
 * blank gap or a misleading "no data" empty state.
 *
 * Variants match the app's real content shapes:
 *   - hero  → the Today/Training session hero (title + band + reasoning + stat
 *             tiles + media block + button bar)
 *   - chart → a single chart-height card (ACWR / readiness trend)
 *   - rows  → a card of N uniform list rows (schedule, gameday, achievements)
 *
 * Built from the global .card/.hero vocabulary + encapsulated .sk-* shimmer.
 * Accessibility: the visual skeleton is aria-hidden; a visually-hidden
 * role="status" line announces "Loading …" once. The shimmer freezes under
 * prefers-reduced-motion (global guard + a local @media fallback).
 */
@Component({
  selector: "app-skeleton",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="sk-sr" role="status">Loading {{ label() }}…</span>
    @switch (variant()) {
      @case ("hero") {
        <div class="hero sk-stack" aria-hidden="true">
          <div class="sk-row">
            <div class="sk-line w40"></div>
            <div class="sk-chip"></div>
          </div>
          <div class="sk-line w80"></div>
          <div class="sk-tiles"><span></span><span></span><span></span></div>
          <div class="sk-block media"></div>
          <div class="sk-block btn"></div>
        </div>
      }
      @case ("chart") {
        <div class="card sk-stack" aria-hidden="true">
          <div class="sk-chip"></div>
          <div class="sk-block chart"></div>
        </div>
      }
      @default {
        <div class="card sk-stack" aria-hidden="true">
          @for (r of rowItems(); track r) {
            <div class="sk-row">
              <div class="sk-line w60"></div>
              <div class="sk-chip sm"></div>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sk-sr {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .sk-stack {
        display: flex;
        flex-direction: column;
        gap: var(--s-3);
      }
      .sk-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--s-3);
      }
      .sk-line,
      .sk-chip,
      .sk-block,
      .sk-tiles > span {
        background: linear-gradient(
          100deg,
          var(--surface-2) 30%,
          var(--surface-raised) 50%,
          var(--surface-2) 70%
        );
        background-size: 200% 100%;
        animation: sk-shimmer 1.4s ease-in-out infinite;
        border-radius: var(--r-sm);
      }
      .sk-line {
        height: 12px;
        flex: 0 0 auto;
      }
      .sk-line.w40 {
        width: 40%;
      }
      .sk-line.w60 {
        width: 60%;
      }
      .sk-line.w80 {
        width: 80%;
      }
      .sk-chip {
        width: 88px;
        height: 22px;
        border-radius: var(--r-pill);
        flex: 0 0 auto;
      }
      .sk-chip.sm {
        width: 44px;
        height: 18px;
      }
      .sk-block {
        width: 100%;
        border-radius: var(--r-md);
      }
      .sk-block.media {
        height: 176px;
      }
      .sk-block.chart {
        height: 120px;
      }
      .sk-block.btn {
        height: 44px;
        border-radius: var(--r-pill);
      }
      .sk-tiles {
        display: flex;
        gap: var(--s-3);
      }
      .sk-tiles > span {
        flex: 1;
        height: 48px;
      }
      @keyframes sk-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .sk-line,
        .sk-chip,
        .sk-block,
        .sk-tiles > span {
          animation: none;
        }
      }
    `,
  ],
})
export class SkeletonComponent {
  /** Shape of the placeholder. */
  readonly variant = input<"hero" | "chart" | "rows">("rows");
  /** Number of rows for the "rows" variant. */
  readonly rows = input(3);
  /** Announced to screen readers as "Loading {label}…". */
  readonly label = input("content");

  protected readonly rowItems = computed(() =>
    Array.from({ length: Math.max(1, this.rows()) }, (_, i) => i),
  );
}
