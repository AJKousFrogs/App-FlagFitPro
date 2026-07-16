import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import {
  ConceptTipService,
  type ConceptKey,
} from "../core/services/concept-tip.service";

/**
 * app-concept-tip — a small info glyph that explains a concept using the
 * knowledge base as the source of truth (V3-DESIGN §3.6). Tap opens a popover
 * with the KB entry's title + short excerpt and a "Read more" deep-link into
 * Knowledge. If the KB has no matching entry, the popover shows only the link —
 * it NEVER invents a definition (Law #7). Content is authored once in the KB and
 * surfaced here; no copy is duplicated into components.
 */
@Component({
  selector: "app-concept-tip",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <span class="ct">
      <button
        type="button"
        class="ct-glyph"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="'What is ' + label() + '?'"
        (click)="open.set(!open())"
      >
        <lucide-icon name="info" [size]="14" />
      </button>
      @if (open()) {
        <span class="ct-pop" role="dialog" [attr.aria-label]="label()">
          <span class="ct-head">
            <b>{{ tip()?.title || label() }}</b>
            <button
              type="button"
              class="ct-x"
              aria-label="Close"
              (click)="open.set(false)"
            >
              <lucide-icon name="x" [size]="13" />
            </button>
          </span>
          @if (tip(); as t) {
            <span class="ct-body">{{ t.excerpt }}</span>
            @if (t.evidenceGrade) {
              <span class="ct-grade">Evidence {{ t.evidenceGrade }}</span>
            }
          } @else {
            <span class="ct-body ct-muted">
              Open Knowledge for the evidence behind this.
            </span>
          }
          <a
            class="ct-more"
            routerLink="/knowledge"
            [queryParams]="{ q: query() }"
            (click)="open.set(false)"
          >
            <lucide-icon name="book-open" [size]="13" /> Read more in Knowledge
          </a>
        </span>
      }
    </span>
  `,
  styles: [
    `
      .ct {
        position: relative;
        display: inline-flex;
        vertical-align: middle;
      }
      .ct-glyph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        background: none;
        border: none;
        color: var(--text-faint);
        cursor: pointer;
        line-height: 0;
        border-radius: var(--r-pill);
      }
      .ct-glyph:hover {
        color: var(--accent);
      }
      .ct-glyph:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .ct-pop {
        position: absolute;
        z-index: 20;
        top: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        width: min(280px, 78vw);
        display: flex;
        flex-direction: column;
        gap: 7px;
        padding: 11px 12px;
        background: var(--surface);
        border: 1px solid var(--border-soft);
        border-radius: var(--r-md);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
        text-align: left;
      }
      .ct-head {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      .ct-head b {
        flex: 1;
        font-size: 12.5px;
        color: var(--text-strong);
        line-height: 1.3;
      }
      .ct-x {
        flex: none;
        background: none;
        border: none;
        color: var(--text-faint);
        cursor: pointer;
        line-height: 0;
        padding: 0;
      }
      .ct-x:hover {
        color: var(--text-strong);
      }
      .ct-body {
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.5;
      }
      .ct-muted {
        color: var(--text-faint);
      }
      .ct-grade {
        align-self: flex-start;
        font-family: var(--font-mono);
        font-size: 9.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-faint);
        background: var(--surface-2);
        border-radius: var(--r-pill);
        padding: 2px 8px;
      }
      .ct-more {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--accent);
        text-decoration: none;
      }
      .ct-more:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class ConceptTipComponent {
  private readonly svc = inject(ConceptTipService);

  readonly concept = input.required<ConceptKey>();
  readonly open = signal(false);

  readonly tip = computed(() => this.svc.resolve(this.concept()));
  readonly label = computed(() => this.svc.labelFor(this.concept()));
  readonly query = computed(() => this.svc.queryFor(this.concept()));
}
