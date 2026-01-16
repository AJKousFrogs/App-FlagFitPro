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

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { UI_LIMITS } from "../../../core/constants/app.constants";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

// PrimeNG Components
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { Chip } from "primeng/chip";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelect } from "primeng/multiselect";
import { SkeletonModule } from "primeng/skeleton";
import { StepperModule } from "primeng/stepper";
import { TextareaModule } from "primeng/textarea";
import { TimelineModule } from "primeng/timeline";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

// Services
import { AuthService } from "../../../core/services/auth.service";
import { HapticFeedbackService } from "../../../core/services/haptic-feedback.service";
import { InstagramVideoService } from "../../../core/services/instagram-video.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import {
  FlagPosition,
  TrainingFocus,
} from "../../../core/services/training-video-database.service";

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
    InputTextModule,
    TextareaModule,
    MultiSelect,
    ToastModule,
    DialogModule,
    BadgeModule,
    TooltipModule,
    SkeletonModule,
    AvatarModule,
    TimelineModule,
    StepperModule,
    Chip,
    DividerModule,
    MainLayoutComponent,
    ButtonComponent,
    CardShellComponent,
    StatusTagComponent,
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
            <app-card-shell
              title="Submit New Video"
              headerIcon="pi-plus-circle"
            >
              <form
                [formGroup]="suggestionForm"
                (ngSubmit)="submitSuggestion()"
              >
                <!-- Step 1: Instagram URL -->
                <div class="form-step">
                  <div class="step-header">
                    <span class="step-number">1</span>
                    <span class="step-title">Paste Instagram URL</span>
                  </div>
                  <div class="url-input-container">
                    <span
                      class="p-input-icon-left p-input-icon-right url-input-wrapper"
                    >
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
                    @if (
                      suggestionForm.get("instagramUrl")?.invalid &&
                      suggestionForm.get("instagramUrl")?.touched
                    ) {
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
                        Instagram {{ isReel() ? "Reel" : "Post" }}
                      </div>
                      <span class="shortcode"
                        >ID: {{ extractedShortcode() }}</span
                      >
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
                    <span class="step-optional"
                      >(Optional but helps approval)</span
                    >
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
                  <app-button
                    type="submit"
                    iconLeft="pi-send"
                    [loading]="isSubmitting()"
                    [disabled]="suggestionForm.invalid || isSubmitting()"
                    >Submit for Review</app-button
                  >
                </div>
              </form>
            </app-card-shell>
          </section>

          <!-- My Submissions Section -->
          <section class="submissions-section">
            <div class="section-header">
              <h2>
                <i class="pi pi-history"></i>
                My Submissions
              </h2>
              @if (mySuggestions().length > 0) {
                <app-status-tag
                  [value]="mySuggestions().length + ' total'"
                  severity="info"
                  size="sm"
                />
              }
            </div>

            @if (isLoadingSuggestions()) {
              <!-- Loading Skeletons -->
              <div class="suggestions-list">
                @for (i of [1, 2, 3]; track i) {
                  <div class="suggestion-card skeleton">
                    <p-skeleton
                      width="100%"
                      height="80px"
                      borderRadius="12px"
                    ></p-skeleton>
                  </div>
                }
              </div>
            } @else if (mySuggestions().length === 0) {
              <!-- Empty State -->
              <div class="card-empty-state">
                <div class="card-empty-state__icon">
                  <i class="pi pi-inbox"></i>
                </div>
                <div class="card-empty-state__content">
                  <p class="card-empty-state__title">No submissions yet</p>
                  <p class="card-empty-state__text">
                    Your submitted videos will appear here
                  </p>
                </div>
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
                        @case ("approved") {
                          <app-status-tag
                            value="Approved"
                            severity="success"
                            icon="pi-check"
                            size="sm"
                          />
                        }
                        @case ("rejected") {
                          <app-status-tag
                            value="Not Approved"
                            severity="danger"
                            icon="pi-times"
                            size="sm"
                          />
                        }
                        @case ("pending") {
                          <app-status-tag
                            value="Pending Review"
                            severity="warning"
                            icon="pi-clock"
                            size="sm"
                          />
                        }
                      }
                    </div>

                    <div class="suggestion-content">
                      <h4>{{ suggestion.title }}</h4>
                      <p class="suggestion-description">
                        {{ suggestion.description }}
                      </p>

                      <div class="suggestion-meta">
                        <span class="meta-item">
                          <i class="pi pi-calendar"></i>
                          {{ formatDate(suggestion.submitted_at) }}
                        </span>
                        @if (suggestion.positions.length > 0) {
                          <span class="meta-item">
                            <i class="pi pi-users"></i>
                            {{ suggestion.positions.join(", ") }}
                          </span>
                        }
                      </div>

                      @if (suggestion.training_focus.length > 0) {
                        <div class="suggestion-tags">
                          @for (
                            focus of suggestion.training_focus.slice(
                              0,
                              UI_LIMITS.TRAINING_FOCUS_PREVIEW
                            );
                            track focus
                          ) {
                            <p-chip
                              [label]="formatFocus(focus)"
                              styleClass="focus-chip"
                            ></p-chip>
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
                        class="p-button-text"
                        pTooltip="Open in Instagram"
                        aria-label="Open in Instagram"
                        (click)="openInInstagram(suggestion)"
                      ></button>
                      @if (suggestion.status === "pending") {
                        <button
                          pButton
                          icon="pi pi-trash"
                          class="p-button-text p-button-danger"
                          pTooltip="Delete submission"
                          aria-label="Delete submission"
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
                        @for (
                          pos of video.positions.slice(
                            0,
                            UI_LIMITS.POSITIONS_PREVIEW
                          );
                          track pos
                        ) {
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
          <app-card-shell
            title="Tips for Getting Approved"
            headerIcon="pi-info-circle"
          >
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
          </app-card-shell>
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
  styleUrl: "./video-suggestion.component.scss",
})
export class VideoSuggestionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private instagramService = inject(InstagramVideoService);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticFeedbackService);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // Expose constants to template
  protected readonly UI_LIMITS = UI_LIMITS;

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
  approvedCount = computed(
    () => this.mySuggestions().filter((s) => s.status === "approved").length,
  );

  pendingCount = computed(
    () => this.mySuggestions().filter((s) => s.status === "pending").length,
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
          style="max-width: 100%; border-radius: var(--radius-xl); background: transparent;"
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
    return (control: { value: string }) => {
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

  onUrlPaste(_event: ClipboardEvent): void {
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
        this.toastService.error(TOAST.ERROR.LOGIN_TO_SUBMIT);
        return;
      }

      const formValue = this.suggestionForm.value;
      const shortcode = this.instagramService.extractShortcode(
        formValue.instagramUrl,
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
      this.toastService.success(TOAST.SUCCESS.VIDEO_SUBMITTED);
    } catch (error) {
      this.logger.error("Failed to submit suggestion", error);
      this.toastService.error(TOAST.ERROR.VIDEO_SUBMIT_FAILED);
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
      this.logger.error("Failed to load suggestions", error);
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
      this.logger.error("Failed to load team approved videos", error);
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
        suggestions.filter((s) => s.id !== suggestion.id),
      );
      this.toastService.info(TOAST.INFO.SUGGESTION_DELETED);
    } catch (error) {
      this.logger.error("Failed to delete suggestion", error);
      this.toastService.error(TOAST.ERROR.VIDEO_DELETE_FAILED);
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
