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
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { UI_LIMITS } from "../../../core/constants/app.constants";
import {
  NonNullableFormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

// PrimeNG Components

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { Chip } from "primeng/chip";
import { ConfirmDialog } from "primeng/confirmdialog";
import { Divider } from "primeng/divider";
import { MultiSelect } from "primeng/multiselect";
import { Skeleton } from "primeng/skeleton";

import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

// Services
import { ConfirmDialogService } from "../../../core/services/confirm-dialog.service";
import { HapticFeedbackService } from "../../../core/services/haptic-feedback.service";
import { InstagramVideoService } from "../../../core/services/instagram-video.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { VideoSuggestionDataService } from "../services/video-suggestion-data.service";
import {
  FlagPosition,
  TrainingFocus,
} from "../../../core/models/training-video.models";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FormInputComponent,
    TextareaComponent,
    MultiSelect,

    Skeleton,
    Chip,
    Divider,
    MainLayoutComponent,
    ButtonComponent,
    IconButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    StatusTagComponent,
    AppDialogComponent,
    ConfirmDialog,
    DialogHeaderComponent,
    PageHeaderComponent,
  ],
  templateUrl: "./video-suggestion.component.html",
  styleUrl: "./video-suggestion.component.scss",
})
export class VideoSuggestionComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private confirmDialog = inject(ConfirmDialogService);
  private instagramService = inject(InstagramVideoService);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticFeedbackService);
  private supabase = inject(SupabaseService);
  private videoSuggestionDataService = inject(VideoSuggestionDataService);
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
      <div class="preview-embed__container">
        <iframe
          src="https://www.instagram.com/reel/${video.shortcode}/embed/"
          width="400"
          height="500"
          frameborder="0"
          scrolling="no"
          allowtransparency="true"
          allowfullscreen="true"
          loading="lazy"
          class="preview-embed__frame"
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
      const user = this.supabase.currentUser();
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

      const { suggestion: data, error } =
        await this.videoSuggestionDataService.createSuggestion(suggestion);

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
      const user = this.supabase.currentUser();
      if (!user?.id) {
        this.isLoadingSuggestions.set(false);
        return;
      }

      const { suggestions: data, error } =
        await this.videoSuggestionDataService.fetchMySuggestions(user.id);

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
      const { suggestions: data, error } =
        await this.videoSuggestionDataService.fetchApprovedSuggestions(10);

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
    const confirmed = await this.confirmDialog.confirmDelete(suggestion.title);
    if (!confirmed) return;

    this.hapticService.medium();

    try {
      const { error } = await this.videoSuggestionDataService.deleteSuggestion(
        suggestion.id,
      );

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
