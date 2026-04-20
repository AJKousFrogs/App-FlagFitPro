import { ScrollingModule } from "@angular/cdk/scrolling";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  inject,
  viewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";

import { ButtonComponent } from "../../shared/components/button/button.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";

import { FormInputComponent } from "../../shared/components/form-input/form-input.component";

import { Tooltip } from "primeng/tooltip";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { LoggerService } from "../../core/services/logger.service";
import { toLogContext } from "../../core/services/logger.service";
import { ToastService } from "../../core/services/toast.service";
import {
  getScrollHeight,
  getViewportBottom,
  resolveScrollContainer,
  ScrollContainer,
} from "../../core/utils/scroll-container";
import { AnnouncementsBannerComponent } from "../../shared/components/announcements-banner/announcements-banner.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { CommunityComposeSectionComponent } from "./components/community-compose-section.component";
import { CommunityHeaderComponent } from "./components/community-header.component";
import { CommunitySidebarComponent } from "./components/community-sidebar.component";
import { CommunityDataService, type PendingMedia, type Poll, type Post } from "./community-data.service";

@Component({
  selector: "app-community",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ScrollingModule,
    AppDialogComponent,
    AvatarComponent,
    FormInputComponent,
    Tooltip,
    MainLayoutComponent,
    AnnouncementsBannerComponent,
    ButtonComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    CommunityComposeSectionComponent,
    CommunityHeaderComponent,
    CommunitySidebarComponent,
  ],
  templateUrl: "./community.component.html",
  styleUrl: "./community.component.scss",
})
export class CommunityComponent implements OnInit {
  readonly data = inject(CommunityDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  private scrollContainer: ScrollContainer | null = null;
  private readonly scrollHandler = () => this.onScroll();

  readonly createPostCard = viewChild<ElementRef<HTMLElement>>("createPostCard");
  readonly postsFeed = viewChild<ElementRef<HTMLElement>>("postsFeed");

  // ====== Composer state ======
  newPostContent = "";
  pendingMedia: PendingMedia | null = null;
  pendingPoll: Poll | null = null;

  // ====== Poll dialog state ======
  showPollDialog = false;
  pollQuestion = "";
  pollOptions: string[] = ["", ""];

  // ====== Location dialog state ======
  showLocationDialog = false;
  locationInput = "";

  get isPollValid(): boolean {
    const hasQuestion = this.pollQuestion.trim().length > 0;
    const validOptions = this.pollOptions.filter((o) => o.trim().length > 0);
    return hasQuestion && validOptions.length >= 2;
  }

  constructor() {
    afterNextRender(() => {
      if (typeof window === "undefined") return;

      this.scrollContainer = resolveScrollContainer();
      if (!this.scrollContainer) return;
      this.scrollContainer.addEventListener("scroll", this.scrollHandler, {
        passive: true,
      });
      this.onScroll();
    });

    this.destroyRef.onDestroy(() => {
      if (typeof window !== "undefined" && this.scrollContainer) {
        this.scrollContainer.removeEventListener("scroll", this.scrollHandler);
      }
    });
  }

  ngOnInit(): void {
    this.data.loadCommunityData();
  }

  retryLoad(): void {
    this.data.loadCommunityData();
  }

  onScroll(): void {
    if (this.data.isLoadingMore() || !this.data.hasMorePosts()) return;

    const container = this.scrollContainer;
    if (!container) return;

    const scrollPosition = getViewportBottom(container);
    const documentHeight = getScrollHeight(container);
    const threshold = 500;

    if (scrollPosition >= documentHeight - threshold) {
      this.data.loadMorePosts();
    }
  }

  onAnnouncementViewed(announcementId: string): void {
    this.logger.info("Announcement viewed:", toLogContext(announcementId));
  }

  onAnnouncementAcknowledged(announcementId: string): void {
    this.logger.info("Announcement acknowledged:", toLogContext(announcementId));
  }

  scrollToCreatePost(): void {
    const cardRef = this.createPostCard();
    if (cardRef) {
      cardRef.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        const textarea = cardRef.nativeElement.querySelector("textarea");
        textarea?.focus();
      }, 500);
    }
  }

  onTopicSelected(topicName: string): void {
    this.data.selectTopic(topicName);
    if (this.data.selectedTopic() !== null) {
      setTimeout(() => {
        const feedRef = this.postsFeed();
        feedRef?.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  // ============================================================================
  // POST CREATION
  // ============================================================================

  async createPost(): Promise<void> {
    if (!this.newPostContent.trim() && !this.pendingPoll && !this.pendingMedia) return;

    let content = this.newPostContent;
    content = content.replace(/\n📊 Poll attached/g, "").trim();
    content = content.replace(/\n📷 \[Photo attached: .+\]/g, "").trim();
    content = content.replace(/\n🎥 \[Video attached: .+\]/g, "").trim();

    const locationMatch = content.match(/\n📍 (.+)$/);
    const location = locationMatch ? locationMatch[1] : null;
    if (locationMatch) {
      content = content.replace(/\n📍 .+$/, "").trim();
    }

    try {
      await this.data.createPost(content, location, this.pendingMedia, this.pendingPoll);
    } finally {
      this.resetComposer();
    }
  }

  private resetComposer(): void {
    this.newPostContent = "";
    this.pendingPoll = null;
    this.pendingMedia = null;
  }

  setNewPostContent(value: string): void {
    this.newPostContent = value;
  }

  // ============================================================================
  // MEDIA ATTACHMENT
  // ============================================================================

  attachPhoto(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          this.toastService.error(TOAST.ERROR.FILE_TOO_LARGE_5MB);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.pendingMedia = { file, type: "image", preview: reader.result as string };
          this.newPostContent += `\n📷 [Photo attached: ${file.name}]`;
          this.toastService.success(TOAST.SUCCESS.PHOTO_READY);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  attachVideo(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,video/webm,video/quicktime";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 50 * 1024 * 1024) {
          this.toastService.error(TOAST.ERROR.VIDEO_TOO_LARGE_50MB);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.pendingMedia = { file, type: "video", preview: reader.result as string };
          this.newPostContent += `\n🎥 [Video attached: ${file.name}]`;
          this.toastService.success(TOAST.SUCCESS.VIDEO_READY);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  // ============================================================================
  // POLL DIALOG
  // ============================================================================

  createPoll(): void {
    this.pollQuestion = "";
    this.pollOptions = ["", ""];
    this.showPollDialog = true;
  }

  setPollQuestion(value: string): void {
    this.pollQuestion = value;
  }

  onPollQuestionInput(value: string): void {
    this.setPollQuestion(value);
  }

  setPollOption(index: number, value: string): void {
    this.pollOptions = this.pollOptions.map((option, i) => (i === index ? value : option));
  }

  onPollOptionInput(index: number, value: string): void {
    this.setPollOption(index, value);
  }

  addOption(): void {
    if (this.pollOptions.length < 4) {
      this.pollOptions = [...this.pollOptions, ""];
    }
  }

  removeOption(index: number): void {
    if (this.pollOptions.length > 2) {
      this.pollOptions = this.pollOptions.filter((_, i) => i !== index);
    }
  }

  cancelPoll(): void {
    this.showPollDialog = false;
    this.pollQuestion = "";
    this.pollOptions = ["", ""];
  }

  confirmPoll(): void {
    const validOptions = this.pollOptions.filter((o) => o.trim());
    if (this.pollQuestion.trim() && validOptions.length >= 2) {
      this.pendingPoll = {
        question: this.pollQuestion.trim(),
        options: validOptions.map((text, index) => ({
          id: `opt-${index}`,
          text: text.trim(),
          votes: 0,
          percentage: 0,
        })),
        totalVotes: 0,
      };
      this.newPostContent = this.newPostContent + `\n📊 Poll attached`;
      this.showPollDialog = false;
      this.toastService.success(TOAST.SUCCESS.POLL_ADDED);
      this.cdr.detectChanges();
    }
  }

  // ============================================================================
  // LOCATION DIALOG
  // ============================================================================

  addLocation(): void {
    this.locationInput = "";
    this.showLocationDialog = true;
  }

  setLocationInput(value: string): void {
    this.locationInput = value;
  }

  onLocationInput(value: string): void {
    this.setLocationInput(value);
  }

  cancelLocation(): void {
    this.showLocationDialog = false;
    this.locationInput = "";
  }

  confirmLocation(): void {
    if (this.locationInput.trim()) {
      this.newPostContent = this.newPostContent + `\n📍 ${this.locationInput}`;
      this.showLocationDialog = false;
      this.toastService.success(TOAST.SUCCESS.LOCATION_ADDED);
      this.cdr.detectChanges();
    }
  }

  // ============================================================================
  // POST INTERACTION PASS-THROUGHS (used by template)
  // ============================================================================

  toggleLike(post: Post): void {
    this.data.toggleLike(post);
  }

  toggleBookmark(post: Post): void {
    this.data.toggleBookmark(post);
  }

  toggleComments(post: Post): void {
    this.data.toggleComments(post);
  }

  addComment(post: Post): void {
    this.data.addComment(post);
  }

  setPostComment(postId: string, value: string): void {
    this.data.setPostComment(postId, value);
  }

  onPostCommentInput(postId: string, value: string): void {
    this.data.setPostComment(postId, value);
  }

  votePoll(post: Post, optionId: string): void {
    this.data.votePoll(post, optionId);
  }

  toggleCommentLike(post: Post, comment: Parameters<CommunityDataService["toggleCommentLike"]>[1]): void {
    this.data.toggleCommentLike(post, comment);
  }

  sharePost(post: Post): void {
    this.data.sharePost(post);
  }

  selectTopic(topicName: string): void {
    this.onTopicSelected(topicName);
  }

  clearTopicFilter(): void {
    this.data.clearTopicFilter();
  }

  getAvatarColorClass(initials: string): string {
    return this.data.getAvatarColorClass(initials);
  }

  getMaxPercentage(poll: Parameters<CommunityDataService["getMaxPercentage"]>[0]): number {
    return this.data.getMaxPercentage(poll);
  }
}
