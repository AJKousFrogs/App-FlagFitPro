/**
 * Video Curation Suggestions Component
 *
 * Displays player video suggestions for review.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG

import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";

import { PlayerSuggestion } from "../video-curation.models";
import {
  formatFocus,
  formatSuggestionDate,
  getStatusSeverity
} from "../video-curation-utils";

@Component({
  selector: "app-video-curation-suggestions",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, StatusTagComponent, ButtonComponent, IconButtonComponent],
  template: `
    <div class="tab-content">
      <div class="suggestions-header">
        <h3>Player Video Suggestions</h3>
        <p>Review videos suggested by your team members</p>
      </div>

      @if (suggestions().length === 0) {
        <div class="empty-state">
          <i class="pi pi-lightbulb" aria-hidden="true"></i>
          <h3>No suggestions yet</h3>
          <p>When players suggest videos, they'll appear here for review</p>
        </div>
      } @else {
        <div class="suggestions-grid">
          @for (suggestion of suggestions(); track suggestion.id) {
            <div class="suggestion-review-card">
              <div class="suggestion-thumbnail">
                <i class="pi pi-play-circle" aria-hidden="true"></i>
                <div class="instagram-badge" aria-label="Instagram video">
                  <i class="pi pi-instagram" aria-hidden="true"></i>
                </div>
              </div>
              <div class="suggestion-content">
                <div class="suggestion-header">
                  <h4>{{ suggestion.title }}</h4>
                  <app-status-tag
                    [value]="suggestion.status"
                    [severity]="getSeverity(suggestion.status)"
                    size="sm"
                  />
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
                    <i class="pi pi-user" aria-hidden="true"></i>
                    <span class="visually-hidden">Submitted by:</span>
                    {{ suggestion.submitted_by_name }}
                  </span>
                  <span>
                    <i class="pi pi-calendar" aria-hidden="true"></i>
                    <span class="visually-hidden">Submitted on:</span>
                    {{ formatDate(suggestion.submitted_at) }}
                  </span>
                </div>

                <div class="suggestion-tags">
                  @for (pos of suggestion.positions; track pos) {
                    <app-status-tag [value]="pos" severity="info" size="sm" />
                  }
                  @for (
                    focus of suggestion.training_focus.slice(0, 2);
                    track focus
                  ) {
                    <app-status-tag
                      [value]="getFormatFocus(focus)"
                      severity="success"
                      size="sm"
                    />
                  }
                </div>
              </div>
              <div class="suggestion-actions">
                <app-icon-button
                  icon="pi-external-link"
                  ariaLabel="Open in Instagram"
                  tooltip="Open in Instagram"
                  (clicked)="openInInstagram.emit(suggestion)"
                />
                @if (suggestion.status === "pending") {
                  <app-button
                    iconLeft="pi-check"
                    variant="success"
                    size="sm"
                    (clicked)="approve.emit(suggestion)"
                    >Approve</app-button
                  >
                  <app-button
                    iconLeft="pi-times"
                    variant="danger"
                    size="sm"
                    (clicked)="reject.emit(suggestion)"
                    >Reject</app-button
                  >
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: "./video-curation-suggestions.component.scss",
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

  getSeverity(status: string): "warning" | "success" | "danger" | "secondary" {
    return getStatusSeverity(status);
  }
}
