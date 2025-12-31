/**
 * Video Suggestion Component
 *
 * PLAYER VIDEO SUBMISSION WORKFLOW
 *
 * Allows players to:
 * - Submit Instagram video URLs for coach review
 * - Add context about why the video is valuable
 * - Track status of their submissions
 * - View approved suggestions from teammates
 *
 * UX Best Practices:
 * - Simple URL paste interface
 * - Instagram URL validation
 * - Real-time preview of submitted content
 * - Clear status indicators
 * - Mobile-first design
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 * @angular 21
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";

// PrimeNG Components
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { Select } from "primeng/select";
import { MultiSelect } from "primeng/multiselect";
import { ToastModule } from "primeng/toast";
import { DialogModule } from "primeng/dialog";
import { TagModule } from "primeng/tag";
import { BadgeModule } from "primeng/badge";
import { TooltipModule } from "primeng/tooltip";
import { SkeletonModule } from "primeng/skeleton";
import { AvatarModule } from "primeng/avatar";
import { TimelineModule } from "primeng/timeline";
import { StepsModule } from "primeng/steps";
import { Chip } from "primeng/chip";
import { DividerModule } from "primeng/divider";

// Services
import {
  InstagramVideoService,
  InstagramVideo,
} from "../../../core/services/instagram-video.service";
import {
  FlagPosition,
  TrainingFocus,
} from "../../../core/services/training-video-database.service";
import { ToastService } from "../../../core/services/toast.service";
import { HapticFeedbackService } from "../../../core/services/haptic-feedback.service";
import { AuthService } from "../../../core/services/auth.service";
import { SupabaseService } from "../../../core/services/supabase.service";

// Layout
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";

interface VideoSuggestion {
  id: string;
  instagram_url: string;
  shortcode: string;
  title: string;
  description: string;
  why_valuable: string;
  positions: FlagPosition[];
  training_focus: TrainingFocus[];
  submitted_by: string;
  submitted_by_name: string;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

@Component({
  selector: "app-video-suggestion",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    Select,
    MultiSelect,
    ToastModule,
    DialogModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    SkeletonModule,
    AvatarModule,
    TimelineModule,
    StepsModule,
    Chip,
    DividerModule,
    MainLayoutComponent,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="suggestion-page">
        <!-- Hero Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="header-icon">
              <i class="pi pi-lightbulb"></i>
            </div>
            <div class="header-text">
              <h1>Suggest a Training Video</h1>
              <p>Found a great drill on Instagram? Share it with your team!</p>
            </div>
          </div>
          
          <!-- Stats Pills -->
          <div class="stats-pills">
            <div class="stat-pill">
              <i class="pi pi-send"></i>
              <span>{{ mySuggestions().length }} Submitted</span>
            </div>
            <div class="stat-pill approved">
              <i class="pi pi-check-circle"></i>
              <span>{{ approvedCount() }} Approved</span>
            </div>
            <div class="stat-pill pending">
              <i class="pi pi-clock"></i>
              <span>{{ pendingCount() }} Pending</span>
            </div>
          </div>
        </header>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Submit Form Card -->
          <section class="submit-section">
            <p-card styleClass="submit-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i class="pi pi-plus-circle"></i>
                  <span>Submit New Video</span>
                </div>
              </ng-template>

              <form [formGroup]="suggestionForm" (ngSubmit)="submitSuggestion()">
                <!-- Step 1: Instagram URL -->
                <div class="form-step">
                  <div class="step-header">
                    <span class="step-number">1</span>
                    <span class="step-title">Paste Instagram URL</span>
                  </div>
                  <div class="url-input-container">
                    <span class="p-input-icon-left p-input-icon-right url-input-wrapper">
                      <i class="pi pi-instagram"></i>
                      <input
                        type="text"
                        pInputText
                        formControlName="instagramUrl"
                        placeholder="https://www.instagram.com/reel/..."
                        class="url-input"
                        (paste)="onUrlPaste($event)"
                      />
                      @if (isValidUrl()) {
                        <i class="pi pi-check-circle valid-icon"></i>
                      }
                    </span>
                    @if (suggestionForm.get('instagramUrl')?.invalid && suggestionForm.get('instagramUrl')?.touched) {
                      <small class="error-text">
                        <i class="pi pi-exclamation-circle"></i>
                        Please enter a valid Instagram Reel or Post URL
                      </small>
                    }
                  </div>
                  
                  <!-- URL Preview -->
                  @if (isValidUrl() && extractedShortcode()) {
                    <div class="url-preview">
                      <div class="preview-badge">
                        <i class="pi pi-instagram"></i>
                        Instagram {{ isReel() ? 'Reel' : 'Post' }}
                      </div>
                      <span class="shortcode">ID: {{ extractedShortcode() }}</span>
                    </div>
                  }
                </div>

                <p-divider></p-divider>

                <!-- Step 2: Video Details -->
                <div class="form-step">
                  <div class="step-header">
                    <span class="step-number">2</span>
                    <span class="step-title">Add Details</span>
                  </div>

                  <div class="form-field">
                    <label for="title">Video Title</label>
                    <input
                      id="title"
                      type="text"
                      pInputText
                      formControlName="title"
                      placeholder="e.g., Elite Route Running Drill"
                    />
                  </div>

                  <div class="form-field">
                    <label for="description">Brief Description</label>
                    <textarea
                      id="description"
                      pTextarea
                      formControlName="description"
                      [rows]="2"
                      placeholder="What's shown in the video?"
                    ></textarea>
                  </div>
                </div>

                <p-divider></p-divider>

                <!-- Step 3: Categorization -->
                <div class="form-step">
                  <div class="step-header">
                    <span class="step-number">3</span>
                    <span class="step-title">Categorize</span>
                  </div>

                  <div class="form-row">
                    <div class="form-field">
                      <label for="positions">Target Position(s)</label>
                      <p-multiselect
                        id="positions"
                        formControlName="positions"
                        [options]="positionOptions"
                        placeholder="Select positions"
                        [maxSelectedLabels]="3"
                        styleClass="category-select"
                      ></p-multiselect>
                    </div>

                    <div class="form-field">
                      <label for="focus">Training Focus</label>
                      <p-multiselect
                        id="focus"
                        formControlName="trainingFocus"
                        [options]="focusOptions"
                        placeholder="Select focus areas"
                        [maxSelectedLabels]="3"
                        styleClass="category-select"
                      ></p-multiselect>
                    </div>
                  </div>
                </div>

                <p-divider></p-divider>

                <!-- Step 4: Why Valuable -->
                <div class="form-step">
                  <div class="step-header">
                    <span class="step-number">4</span>
                    <span class="step-title">Why is this valuable?</span>
                    <span class="step-optional">(Optional but helps approval)</span>
                  </div>

                  <div class="form-field">
                    <textarea
                      pTextarea
                      formControlName="whyValuable"
                      [rows]="3"
                      placeholder="Tell your coaches why this video would help the team..."
                    ></textarea>
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="form-actions">
                  <button
                    pButton
                    type="submit"
                    label="Submit for Review"
                    icon="pi pi-send"
                    [loading]="isSubmitting()"
                    [disabled]="suggestionForm.invalid || isSubmitting()"
                    class="submit-btn"
                  ></button>
                </div>
              </form>
            </p-card>
          </section>

          <!-- My Submissions Section -->
          <section class="submissions-section">
            <div class="section-header">
              <h2>
                <i class="pi pi-history"></i>
                My Submissions
              </h2>
              @if (mySuggestions().length > 0) {
                <p-tag 
                  [value]="mySuggestions().length + ' total'" 
                  severity="info"
                ></p-tag>
              }
            </div>

            @if (isLoadingSuggestions()) {
              <!-- Loading Skeletons -->
              <div class="suggestions-list">
                @for (i of [1, 2, 3]; track i) {
                  <div class="suggestion-card skeleton">
                    <p-skeleton width="100%" height="80px" borderRadius="12px"></p-skeleton>
                  </div>
                }
              </div>
            } @else if (mySuggestions().length === 0) {
              <!-- Empty State -->
              <div class="empty-state">
                <div class="empty-icon">
                  <i class="pi pi-inbox"></i>
                </div>
                <h3>No submissions yet</h3>
                <p>Your submitted videos will appear here</p>
              </div>
            } @else {
              <!-- Suggestions List -->
              <div class="suggestions-list">
                @for (suggestion of mySuggestions(); track suggestion.id) {
                  <article 
                    class="suggestion-card"
                    [class.approved]="suggestion.status === 'approved'"
                    [class.rejected]="suggestion.status === 'rejected'"
                    [class.pending]="suggestion.status === 'pending'"
                  >
                    <div class="suggestion-status">
                      @switch (suggestion.status) {
                        @case ('approved') {
                          <p-tag value="Approved" severity="success" icon="pi pi-check"></p-tag>
                        }
                        @case ('rejected') {
                          <p-tag value="Not Approved" severity="danger" icon="pi pi-times"></p-tag>
                        }
                        @case ('pending') {
                          <p-tag value="Pending Review" severity="warn" icon="pi pi-clock"></p-tag>
                        }
                      }
                    </div>

                    <div class="suggestion-content">
                      <h4>{{ suggestion.title }}</h4>
                      <p class="suggestion-description">{{ suggestion.description }}</p>
                      
                      <div class="suggestion-meta">
                        <span class="meta-item">
                          <i class="pi pi-calendar"></i>
                          {{ formatDate(suggestion.submitted_at) }}
                        </span>
                        @if (suggestion.positions.length > 0) {
                          <span class="meta-item">
                            <i class="pi pi-users"></i>
                            {{ suggestion.positions.join(', ') }}
                          </span>
                        }
                      </div>

                      @if (suggestion.training_focus.length > 0) {
                        <div class="suggestion-tags">
                          @for (focus of suggestion.training_focus.slice(0, 3); track focus) {
                            <p-chip [label]="formatFocus(focus)" styleClass="focus-chip"></p-chip>
                          }
                        </div>
                      }

                      @if (suggestion.review_notes) {
                        <div class="review-notes">
                          <i class="pi pi-comment"></i>
                          <span>{{ suggestion.review_notes }}</span>
                        </div>
                      }
                    </div>

                    <div class="suggestion-actions">
                      <button
                        pButton
                        icon="pi pi-external-link"
                        class="p-button-text p-button-rounded"
                        pTooltip="Open in Instagram"
                        (click)="openInInstagram(suggestion)"
                      ></button>
                      @if (suggestion.status === 'pending') {
                        <button
                          pButton
                          icon="pi pi-trash"
                          class="p-button-text p-button-rounded p-button-danger"
                          pTooltip="Delete submission"
                          (click)="deleteSuggestion(suggestion)"
                        ></button>
                      }
                    </div>
                  </article>
                }
              </div>
            }
          </section>
        </div>

        <!-- Team Approved Videos Section -->
        <section class="team-approved-section">
          <div class="section-header">
            <h2>
              <i class="pi pi-star"></i>
              Team-Approved Videos
            </h2>
            <p>Videos suggested by teammates and approved by coaches</p>
          </div>

          @if (teamApprovedVideos().length === 0) {
            <div class="empty-state compact">
              <i class="pi pi-video"></i>
              <span>No team-approved videos yet</span>
            </div>
          } @else {
            <div class="approved-videos-scroll">
              @for (video of teamApprovedVideos(); track video.id) {
                <div class="approved-video-card" (click)="openVideo(video)">
                  <div class="video-thumbnail">
                    <i class="pi pi-play-circle"></i>
                  </div>
                  <div class="video-info">
                    <h4>{{ video.title }}</h4>
                    <div class="video-meta">
                      <span class="submitter">
                        <i class="pi pi-user"></i>
                        {{ video.submitted_by_name }}
                      </span>
                      <div class="video-tags">
                        @for (pos of video.positions.slice(0, 2); track pos) {
                          <span class="mini-tag">{{ pos }}</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <!-- Tips Section -->
        <section class="tips-section">
          <p-card styleClass="tips-card">
            <ng-template pTemplate="header">
              <div class="tips-header">
                <i class="pi pi-info-circle"></i>
                <span>Tips for Getting Approved</span>
              </div>
            </ng-template>
            
            <div class="tips-grid">
              <div class="tip-item">
                <div class="tip-icon">
                  <i class="pi pi-check-circle"></i>
                </div>
                <div class="tip-content">
                  <h4>Quality Content</h4>
                  <p>Submit videos from verified trainers or pro athletes</p>
                </div>
              </div>
              
              <div class="tip-item">
                <div class="tip-icon">
                  <i class="pi pi-tag"></i>
                </div>
                <div class="tip-content">
                  <h4>Clear Categories</h4>
                  <p>Select accurate positions and training focus areas</p>
                </div>
              </div>
              
              <div class="tip-item">
                <div class="tip-icon">
                  <i class="pi pi-comment"></i>
                </div>
                <div class="tip-content">
                  <h4>Explain Value</h4>
                  <p>Tell coaches why this video helps the team</p>
                </div>
              </div>
              
              <div class="tip-item">
                <div class="tip-icon">
                  <i class="pi pi-flag"></i>
                </div>
                <div class="tip-content">
                  <h4>Flag Football Focus</h4>
                  <p>Prioritize drills relevant to flag football skills</p>
                </div>
              </div>
            </div>
          </p-card>
        </section>

        <!-- Video Preview Dialog -->
        <p-dialog
          [(visible)]="showVideoDialog"
          [modal]="true"
          [draggable]="false"
          [dismissableMask]="true"
          [header]="selectedVideo()?.title || 'Video'"
          styleClass="video-preview-dialog"
          [style]="{ width: '90vw', maxWidth: '600px' }"
        >
          @if (selectedVideo(); as video) {
            <div class="preview-content">
              <div class="preview-embed" [innerHTML]="videoEmbedHtml()"></div>
              <div class="preview-details">
                <p>{{ video.description }}</p>
                @if (video.why_valuable) {
                  <div class="value-note">
                    <strong>Why it's valuable:</strong>
                    <p>{{ video.why_valuable }}</p>
                  </div>
                }
                <div class="preview-meta">
                  <span>
                    <i class="pi pi-user"></i>
                    Suggested by {{ video.submitted_by_name }}
                  </span>
                  <span>
                    <i class="pi pi-calendar"></i>
                    {{ formatDate(video.submitted_at) }}
                  </span>
                </div>
              </div>
              <div class="preview-actions">
                <button
                  pButton
                  label="Open in Instagram"
                  icon="pi pi-external-link"
                  (click)="openInInstagram(video)"
                ></button>
              </div>
            </div>
          }
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      /* ============================================
         VIDEO SUGGESTION PAGE
         ============================================ */

      .suggestion-page {
        min-height: 100vh;
        background: var(--surface-primary);
        padding-bottom: var(--space-8);
      }

      /* Header */
      .page-header {
        background: linear-gradient(
          135deg,
          #667eea 0%,
          #764ba2 50%,
          #f093fb 100%
        );
        padding: var(--space-8) var(--space-6);
        margin: calc(-1 * var(--space-6));
        margin-bottom: var(--space-6);
        color: white;
      }

      .header-content {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .header-icon {
        width: 64px;
        height: 64px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-xl);
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
      }

      .header-icon i {
        font-size: 2rem;
      }

      .header-text h1 {
        font-size: var(--font-heading-xl);
        font-weight: var(--font-weight-bold);
        margin: 0 0 var(--space-2);
      }

      .header-text p {
        margin: 0;
        opacity: 0.9;
        font-size: var(--font-body-md);
      }

      .stats-pills {
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
        max-width: 800px;
        margin: 0 auto;
      }

      .stat-pill {
        background: rgba(255, 255, 255, 0.2);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
      }

      .stat-pill.approved {
        background: rgba(34, 197, 94, 0.3);
      }

      .stat-pill.pending {
        background: rgba(234, 179, 8, 0.3);
      }

      /* Content Grid */
      .content-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 var(--space-6);
      }

      @media (max-width: 900px) {
        .content-grid {
          grid-template-columns: 1fr;
        }
      }

      /* Submit Card */
      :host ::ng-deep .submit-card {
        border-radius: var(--radius-xl) !important;
        overflow: hidden;

        .p-card-body {
          padding: var(--space-5);
        }
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4) var(--space-5);
        background: var(--surface-secondary);
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-body-lg);
        color: var(--color-text-primary);

        i {
          color: var(--color-brand-primary);
          font-size: var(--icon-lg);
        }
      }

      /* Form Steps */
      .form-step {
        margin-bottom: var(--space-4);
      }

      .step-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .step-number {
        width: 28px;
        height: 28px;
        background: var(--color-brand-primary);
        color: var(--color-text-on-primary);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-bold);
      }

      .step-title {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .step-optional {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
        margin-left: auto;
      }

      /* URL Input */
      .url-input-container {
        position: relative;
      }

      .url-input-wrapper {
        width: 100%;
      }

      .url-input {
        width: 100%;
        padding-left: 3rem !important;
        padding-right: 3rem !important;
        height: 48px;
        font-size: var(--font-body-md);
        border-radius: var(--radius-lg) !important;
      }

      .valid-icon {
        color: var(--color-status-success) !important;
        font-size: var(--icon-lg) !important;
      }

      .error-text {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        color: var(--color-status-error);
        font-size: var(--font-body-xs);
        margin-top: var(--space-2);
      }

      .url-preview {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-top: var(--space-3);
        padding: var(--space-3);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
      }

      .preview-badge {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-1) var(--space-3);
        background: linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045);
        color: white;
        border-radius: var(--radius-full);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
      }

      .shortcode {
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
        font-family: monospace;
      }

      /* Form Fields */
      .form-field {
        margin-bottom: var(--space-4);
      }

      .form-field label {
        display: block;
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        margin-bottom: var(--space-2);
        font-size: var(--font-body-sm);
      }

      .form-field input,
      .form-field textarea {
        width: 100%;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      @media (max-width: 600px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }

      :host ::ng-deep .category-select {
        width: 100%;
      }

      /* Submit Button */
      .form-actions {
        margin-top: var(--space-5);
      }

      .submit-btn {
        width: 100%;
        height: 48px;
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        border-radius: var(--radius-lg) !important;
      }

      /* Submissions Section */
      .submissions-section {
        display: flex;
        flex-direction: column;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);

        h2 {
          font-size: var(--font-heading-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin: 0;

          i {
            color: var(--color-brand-primary);
          }
        }
      }

      .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      /* Suggestion Card */
      .suggestion-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-4);
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: var(--space-4);
        transition: all 0.2s ease;
      }

      .suggestion-card:hover {
        box-shadow: var(--shadow-md);
      }

      .suggestion-card.approved {
        border-left: 4px solid var(--color-status-success);
      }

      .suggestion-card.rejected {
        border-left: 4px solid var(--color-status-error);
      }

      .suggestion-card.pending {
        border-left: 4px solid var(--color-status-warning);
      }

      .suggestion-status {
        display: flex;
        align-items: flex-start;
      }

      .suggestion-content {
        flex: 1;
        min-width: 0;

        h4 {
          font-size: var(--font-body-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-2);
        }
      }

      .suggestion-description {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-3);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .suggestion-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
        margin-bottom: var(--space-2);
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .suggestion-tags {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      :host ::ng-deep .focus-chip {
        font-size: var(--font-body-xs) !important;
        height: 24px !important;
      }

      .review-notes {
        margin-top: var(--space-3);
        padding: var(--space-3);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        display: flex;
        gap: var(--space-2);

        i {
          color: var(--color-brand-primary);
        }
      }

      .suggestion-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--space-8);
        background: var(--surface-secondary);
        border-radius: var(--radius-xl);
      }

      .empty-state.compact {
        padding: var(--space-4);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        color: var(--color-text-muted);
      }

      .empty-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto var(--space-4);
        background: var(--color-brand-primary-subtle);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: var(--icon-2xl);
          color: var(--color-brand-primary);
        }
      }

      .empty-state h3 {
        font-size: var(--font-heading-sm);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-2);
      }

      .empty-state p {
        color: var(--color-text-secondary);
        margin: 0;
      }

      /* Team Approved Section */
      .team-approved-section {
        max-width: 1200px;
        margin: var(--space-8) auto 0;
        padding: 0 var(--space-6);

        .section-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-2);

          p {
            color: var(--color-text-secondary);
            margin: 0;
          }
        }
      }

      .approved-videos-scroll {
        display: flex;
        gap: var(--space-4);
        overflow-x: auto;
        padding: var(--space-2) 0;
        -webkit-overflow-scrolling: touch;
      }

      .approved-videos-scroll::-webkit-scrollbar {
        height: 6px;
      }

      .approved-videos-scroll::-webkit-scrollbar-track {
        background: var(--color-border-primary);
        border-radius: 3px;
      }

      .approved-videos-scroll::-webkit-scrollbar-thumb {
        background: var(--color-brand-primary);
        border-radius: 3px;
      }

      .approved-video-card {
        flex: 0 0 auto;
        width: 280px;
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .approved-video-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      .video-thumbnail {
        height: 120px;
        background: linear-gradient(
          135deg,
          var(--color-brand-primary-subtle) 0%,
          var(--surface-secondary) 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 2.5rem;
          color: var(--color-brand-primary);
        }
      }

      .video-info {
        padding: var(--space-4);

        h4 {
          font-size: var(--font-body-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-2);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .video-meta {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .submitter {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .video-tags {
        display: flex;
        gap: var(--space-1);
      }

      .mini-tag {
        padding: 2px 8px;
        background: var(--color-brand-primary-subtle);
        color: var(--color-brand-primary);
        border-radius: var(--radius-sm);
        font-size: 10px;
        font-weight: var(--font-weight-medium);
      }

      /* Tips Section */
      .tips-section {
        max-width: 1200px;
        margin: var(--space-8) auto 0;
        padding: 0 var(--space-6);
      }

      :host ::ng-deep .tips-card {
        border-radius: var(--radius-xl) !important;
        background: linear-gradient(
          135deg,
          var(--surface-secondary) 0%,
          var(--surface-primary) 100%
        ) !important;
      }

      .tips-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4) var(--space-5);
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-body-lg);
        color: var(--color-text-primary);

        i {
          color: var(--color-brand-primary);
          font-size: var(--icon-lg);
        }
      }

      .tips-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--space-4);
      }

      .tip-item {
        display: flex;
        gap: var(--space-3);
      }

      .tip-icon {
        width: 40px;
        height: 40px;
        background: var(--color-brand-primary-subtle);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        i {
          color: var(--color-brand-primary);
        }
      }

      .tip-content {
        h4 {
          font-size: var(--font-body-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-1);
        }

        p {
          font-size: var(--font-body-xs);
          color: var(--color-text-secondary);
          margin: 0;
        }
      }

      /* Video Preview Dialog */
      :host ::ng-deep .video-preview-dialog {
        .p-dialog-content {
          padding: 0;
        }
      }

      .preview-content {
        display: flex;
        flex-direction: column;
      }

      .preview-embed {
        min-height: 350px;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .preview-details {
        padding: var(--space-4);

        p {
          color: var(--color-text-primary);
          margin: 0 0 var(--space-3);
        }
      }

      .value-note {
        padding: var(--space-3);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-3);

        strong {
          font-size: var(--font-body-sm);
          color: var(--color-brand-primary);
        }

        p {
          font-size: var(--font-body-sm);
          color: var(--color-text-secondary);
          margin: var(--space-1) 0 0;
        }
      }

      .preview-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);

        span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
      }

      .preview-actions {
        padding: var(--space-4);
        border-top: 1px solid var(--color-border-primary);
        display: flex;
        justify-content: flex-end;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .page-header {
          padding: var(--space-6) var(--space-4);
        }

        .header-content {
          flex-direction: column;
          text-align: center;
        }

        .content-grid {
          padding: 0 var(--space-4);
        }

        .suggestion-card {
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }

        .suggestion-actions {
          flex-direction: row;
          justify-content: flex-end;
        }

        .team-approved-section,
        .tips-section {
          padding: 0 var(--space-4);
        }
      }
    `,
  ],
})
export class VideoSuggestionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private instagramService = inject(InstagramVideoService);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticFeedbackService);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);

  // State
  isSubmitting = signal(false);
  isLoadingSuggestions = signal(true);
  showVideoDialog = signal(false);
  selectedVideo = signal<VideoSuggestion | null>(null);
  mySuggestions = signal<VideoSuggestion[]>([]);
  teamApprovedVideos = signal<VideoSuggestion[]>([]);

  // Form
  suggestionForm: FormGroup;

  // Options
  positionOptions = [
    { label: "All Positions", value: "All" },
    { label: "Quarterback", value: "QB" },
    { label: "Wide Receiver", value: "WR" },
    { label: "Defensive Back", value: "DB" },
    { label: "Rusher", value: "Rusher" },
    { label: "Center", value: "Center" },
    { label: "Linebacker", value: "LB" },
  ];

  focusOptions = [
    { label: "Speed", value: "speed" },
    { label: "Agility", value: "agility" },
    { label: "Plyometrics", value: "plyometrics" },
    { label: "Deceleration", value: "deceleration" },
    { label: "Acceleration", value: "acceleration" },
    { label: "Route Running", value: "route_running" },
    { label: "Coverage", value: "coverage" },
    { label: "Throwing", value: "throwing" },
    { label: "Catching", value: "catching" },
    { label: "Recovery", value: "recovery" },
    { label: "Strength", value: "strength" },
    { label: "Reactive Eccentrics", value: "reactive_eccentrics" },
    { label: "Skills", value: "skills" },
  ];

  // Computed
  approvedCount = computed(() =>
    this.mySuggestions().filter((s) => s.status === "approved").length
  );

  pendingCount = computed(() =>
    this.mySuggestions().filter((s) => s.status === "pending").length
  );

  isValidUrl = computed(() => {
    const url = this.suggestionForm?.get("instagramUrl")?.value || "";
    return this.validateInstagramUrl(url);
  });

  extractedShortcode = computed(() => {
    const url = this.suggestionForm?.get("instagramUrl")?.value || "";
    return this.instagramService.extractShortcode(url);
  });

  isReel = computed(() => {
    const url = this.suggestionForm?.get("instagramUrl")?.value || "";
    return url.includes("/reel/");
  });

  videoEmbedHtml = computed(() => {
    const video = this.selectedVideo();
    if (!video) return "";
    return `
      <div style="max-width: 100%; margin: 0 auto;">
        <iframe
          src="https://www.instagram.com/reel/${video.shortcode}/embed/"
          width="400"
          height="500"
          frameborder="0"
          scrolling="no"
          allowtransparency="true"
          allowfullscreen="true"
          loading="lazy"
          style="max-width: 100%; border-radius: 12px; background: transparent;"
        ></iframe>
      </div>
    `;
  });

  constructor() {
    this.suggestionForm = this.fb.group({
      instagramUrl: ["", [Validators.required, this.instagramUrlValidator()]],
      title: ["", [Validators.required, Validators.minLength(5)]],
      description: ["", [Validators.required, Validators.minLength(10)]],
      positions: [[], Validators.required],
      trainingFocus: [[], Validators.required],
      whyValuable: [""],
    });
  }

  ngOnInit(): void {
    this.loadMySuggestions();
    this.loadTeamApprovedVideos();
  }

  // Form validation
  private instagramUrlValidator() {
    return (control: any) => {
      if (!control.value) return null;
      return this.validateInstagramUrl(control.value)
        ? null
        : { invalidUrl: true };
    };
  }

  private validateInstagramUrl(url: string): boolean {
    if (!url) return false;
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
      /instagr\.am\/p\/([A-Za-z0-9_-]+)/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  }

  onUrlPaste(event: ClipboardEvent): void {
    // Auto-validate on paste
    setTimeout(() => {
      if (this.isValidUrl()) {
        this.hapticService.success();
      }
    }, 100);
  }

  // Submit suggestion
  async submitSuggestion(): Promise<void> {
    if (this.suggestionForm.invalid) return;

    this.isSubmitting.set(true);
    this.hapticService.medium();

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.toastService.error("Please log in to submit suggestions");
        return;
      }

      const formValue = this.suggestionForm.value;
      const shortcode = this.instagramService.extractShortcode(
        formValue.instagramUrl
      );

      const suggestion: Partial<VideoSuggestion> = {
        instagram_url: formValue.instagramUrl,
        shortcode: shortcode || "",
        title: formValue.title,
        description: formValue.description,
        why_valuable: formValue.whyValuable,
        positions: formValue.positions,
        training_focus: formValue.trainingFocus,
        submitted_by: user.id,
        submitted_by_name: user.email?.split("@")[0] || "Anonymous",
        submitted_at: new Date().toISOString(),
        status: "pending",
      };

      const { data, error } = await this.supabaseService.client
        .from("video_suggestions")
        .insert(suggestion)
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      this.mySuggestions.update((suggestions) => [
        data as VideoSuggestion,
        ...suggestions,
      ]);

      // Reset form
      this.suggestionForm.reset();
      this.hapticService.success();
      this.toastService.success("Video submitted for review!");
    } catch (error) {
      console.error("Failed to submit suggestion:", error);
      this.toastService.error("Failed to submit. Please try again.");
      this.hapticService.error();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Load suggestions
  private async loadMySuggestions(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.isLoadingSuggestions.set(false);
        return;
      }

      const { data, error } = await this.supabaseService.client
        .from("video_suggestions")
        .select("*")
        .eq("submitted_by", user.id)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      this.mySuggestions.set((data as VideoSuggestion[]) || []);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    } finally {
      this.isLoadingSuggestions.set(false);
    }
  }

  private async loadTeamApprovedVideos(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("video_suggestions")
        .select("*")
        .eq("status", "approved")
        .order("submitted_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      this.teamApprovedVideos.set((data as VideoSuggestion[]) || []);
    } catch (error) {
      console.error("Failed to load team approved videos:", error);
    }
  }

  // Actions
  openVideo(video: VideoSuggestion): void {
    this.hapticService.light();
    this.selectedVideo.set(video);
    this.showVideoDialog.set(true);
  }

  openInInstagram(video: VideoSuggestion): void {
    window.open(video.instagram_url, "_blank");
  }

  async deleteSuggestion(suggestion: VideoSuggestion): Promise<void> {
    this.hapticService.medium();

    try {
      const { error } = await this.supabaseService.client
        .from("video_suggestions")
        .delete()
        .eq("id", suggestion.id);

      if (error) throw error;

      this.mySuggestions.update((suggestions) =>
        suggestions.filter((s) => s.id !== suggestion.id)
      );
      this.toastService.info("Suggestion deleted");
    } catch (error) {
      console.error("Failed to delete suggestion:", error);
      this.toastService.error("Failed to delete");
    }
  }

  // Formatters
  formatFocus(focus: TrainingFocus | string): string {
    const map: Record<string, string> = {
      speed: "Speed",
      agility: "Agility",
      strength: "Strength",
      power: "Power",
      skills: "Skills",
      throwing: "Throwing",
      catching: "Catching",
      route_running: "Routes",
      coverage: "Coverage",
      rushing: "Rushing",
      recovery: "Recovery",
      mobility: "Mobility",
      injury_prevention: "Injury Prevention",
      conditioning: "Conditioning",
      mental: "Mental",
      plyometrics: "Plyo",
      isometrics: "Isometrics",
      reactive_eccentrics: "Reactive",
      deceleration: "Decel",
      acceleration: "Accel",
      twitches: "Fast Twitch",
      explosive_power: "Explosive",
    };
    return map[focus] || focus;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
