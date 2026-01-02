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
  styleUrl: './video-curation-suggestions.component.scss',
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
