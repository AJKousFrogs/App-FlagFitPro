/**
 * Video Curation Suggestions Component
 *
 * Displays player video suggestions for review.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";

import { PlayerSuggestion } from "../video-curation.models";
import {
  formatFocus,
  formatSuggestionDate,
  getStatusSeverity,
} from "../video-curation-utils";

@Component({
  selector: "app-video-curation-suggestions",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TagModule, ButtonModule, TooltipModule],
  template: `
    <div class="tab-content">
      <div class="suggestions-header">
        <h3>Player Video Suggestions</h3>
        <p>Review videos suggested by your team members</p>
      </div>

      @if (suggestions().length === 0) {
        <div class="empty-state">
          <i class="pi pi-lightbulb"></i>
          <h3>No suggestions yet</h3>
          <p>When players suggest videos, they'll appear here for review</p>
        </div>
      } @else {
        <div class="suggestions-grid">
          @for (suggestion of suggestions(); track suggestion.id) {
            <div class="suggestion-review-card">
              <div class="suggestion-thumbnail">
                <i class="pi pi-play-circle"></i>
                <div class="instagram-badge">
                  <i class="pi pi-instagram"></i>
                </div>
              </div>
              <div class="suggestion-content">
                <div class="suggestion-header">
                  <h4>{{ suggestion.title }}</h4>
                  <p-tag
                    [value]="suggestion.status"
                    [severity]="getSeverity(suggestion.status)"
                  ></p-tag>
                </div>
                <p class="suggestion-desc">{{ suggestion.description }}</p>

                @if (suggestion.why_valuable) {
                  <div class="value-note">
                    <strong>Why it's valuable:</strong>
                    <p>{{ suggestion.why_valuable }}</p>
                  </div>
                }

                <div class="suggestion-meta">
                  <span>
                    <i class="pi pi-user"></i>
                    {{ suggestion.submitted_by_name }}
                  </span>
                  <span>
                    <i class="pi pi-calendar"></i>
                    {{ formatDate(suggestion.submitted_at) }}
                  </span>
                </div>

                <div class="suggestion-tags">
                  @for (pos of suggestion.positions; track pos) {
                    <p-tag [value]="pos" severity="info"></p-tag>
                  }
                  @for (
                    focus of suggestion.training_focus.slice(0, 2);
                    track focus
                  ) {
                    <p-tag
                      [value]="getFormatFocus(focus)"
                      severity="success"
                    ></p-tag>
                  }
                </div>
              </div>
              <div class="suggestion-actions">
                <button
                  pButton
                  icon="pi pi-external-link"
                  class="p-button-text p-button-rounded"
                  pTooltip="Open in Instagram"
                  (click)="openInInstagram.emit(suggestion)"
                ></button>
                @if (suggestion.status === "pending") {
                  <button
                    pButton
                    label="Approve"
                    icon="pi pi-check"
                    class="p-button-success p-button-sm"
                    (click)="approve.emit(suggestion)"
                  ></button>
                  <button
                    pButton
                    label="Reject"
                    icon="pi pi-times"
                    class="p-button-outlined p-button-danger p-button-sm"
                    (click)="reject.emit(suggestion)"
                  ></button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .tab-content {
        padding: var(--space-4) 0;
      }

      .suggestions-header {
        margin-bottom: var(--space-4);

        h3 {
          font-size: var(--font-heading-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-1);
        }

        p {
          color: var(--color-text-secondary);
          margin: 0;
        }
      }

      .empty-state {
        text-align: center;
        padding: var(--space-12);

        i {
          font-size: 4rem;
          color: var(--color-brand-primary);
          opacity: 0.5;
          margin-bottom: var(--space-4);
        }

        h3 {
          font-size: var(--font-heading-md);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-2);
        }

        p {
          color: var(--color-text-secondary);
          margin: 0;
        }
      }

      .suggestions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: var(--space-4);
      }

      .suggestion-review-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .suggestion-thumbnail {
        height: 120px;
        background: var(--color-brand-instagram-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        i {
          font-size: var(--font-heading-2xl);
          color: var(--color-text-on-primary);
        }
      }

      .instagram-badge {
        position: absolute;
        top: var(--space-2);
        left: var(--space-2);
        background: rgba(0, 0, 0, 0.6);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-md);
        color: white;
        font-size: var(--font-body-xs);
      }

      .suggestion-content {
        padding: var(--space-4);
        flex: 1;
      }

      .suggestion-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-2);

        h4 {
          font-size: var(--font-body-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0;
        }
      }

      .suggestion-desc {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-3);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .value-note {
        padding: var(--space-3);
        background: var(--color-brand-primary-subtle);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-3);

        strong {
          font-size: var(--font-body-xs);
          color: var(--color-brand-primary);
        }

        p {
          font-size: var(--font-body-sm);
          color: var(--color-text-secondary);
          margin: var(--space-1) 0 0;
        }
      }

      .suggestion-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
        margin-bottom: var(--space-3);

        span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
      }

      .suggestion-tags {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .suggestion-actions {
        padding: var(--space-3) var(--space-4);
        border-top: 1px solid var(--color-border-primary);
        display: flex;
        gap: var(--space-2);
        justify-content: flex-end;
        align-items: center;
      }

      @media (max-width: 480px) {
        .suggestions-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class VideoCurationSuggestionsComponent {
  suggestions = input.required<PlayerSuggestion[]>();

  approve = output<PlayerSuggestion>();
  reject = output<PlayerSuggestion>();
  openInInstagram = output<PlayerSuggestion>();

  getFormatFocus(focus: string): string {
    return formatFocus(focus);
  }

  formatDate(dateStr: string): string {
    return formatSuggestionDate(dateStr);
  }

  getSeverity(status: string): "warn" | "success" | "danger" | undefined {
    return getStatusSeverity(status);
  }
}
