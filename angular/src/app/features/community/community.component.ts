import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import { Avatar } from "primeng/avatar";

import { ButtonComponent } from "../../shared/components/button/button.component";

import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";

import { Textarea } from "primeng/textarea";
import { Tooltip } from "primeng/tooltip";
import { COLORS } from "../../core/constants/app.constants";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { toLogContext } from "../../core/services/logger.service";
import { TeamNotificationService } from "../../core/services/team-notification.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { AnnouncementsBannerComponent } from "../../shared/components/announcements-banner/announcements-banner.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { fadeInOut } from "../../shared/animations/app.animations";
import { getInitials } from "../../shared/utils/format.utils";

interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  content: string;
  timeAgo: string;
  likes: number;
  isLiked?: boolean;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVote?: string; // option id the user voted for
  endsAt?: string;
}

interface Post {
  id: string;
  author: string;
  authorInitials: string;
  authorRole?: string;
  timeAgo: string;
  location?: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  showComments: boolean;
  commentsList: Comment[];
  newComment?: string;
  media?: {
    type: "image" | "video";
    url: string;
  };
  poll?: Poll;
}

// API Response types
interface ApiPostData {
  id: string;
  authorName?: string;
  author?: string;
  postType?: string;
  timestamp: string;
  location?: string;
  content: string;
  likes?: number;
  comments?: number;
  shares?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

interface ApiLeaderboardEntry {
  rank: number;
  name?: string;
  points: number;
}

interface CommunityFeedResponse {
  posts: ApiPostData[];
}

interface TrendingTopicsResponse {
  topics: Array<{ name: string; count: number }>;
}

interface UserMetadata {
  role?: string;
}

interface ApiCommentResponse {
  id: string;
  author?: string;
}

interface ApiUploadResponse {
  url: string;
  mediaType: string;
}

interface ApiPollVoteResponse {
  options: PollOption[];
  totalVotes: number;
}

type PostMedia = Post["media"];

@Component({
  selector: "app-community",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ScrollingModule,
    Dialog,
    
    Textarea,
    Avatar,
    InputText,
    Tooltip,
    MainLayoutComponent,
    AnnouncementsBannerComponent,
    ButtonComponent,
    CardShellComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
  ],
  animations: [fadeInOut],
  templateUrl: "./community.component.html",

  styleUrl: "./community.component.scss",
  host: {
    "(window:scroll)": "onScroll()",
  },
})
export class CommunityComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(TeamNotificationService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Template references using Angular viewChild signals
  readonly createPostCard =
    viewChild<ElementRef<HTMLElement>>("createPostCard");
  readonly postsFeed = viewChild<ElementRef<HTMLElement>>("postsFeed");

  newPostContent = "";
  posts = signal<Post[]>([]);
  leaderboard = signal<
    Array<{
      rank: number;
      name: string;
      initials: string;
      score: number;
    }>
  >([]);
  trendingTopics = signal<
    Array<{
      name: string;
      count: number;
    }>
  >([]);

  userStats = signal({
    posts: 0,
    likes: 0,
    comments: 0,
  });

  // Page-level loading/error state (UX audit fix)
  readonly isPageLoading = signal<boolean>(true);
  readonly hasPageError = signal<boolean>(false);
  readonly pageErrorMessage = signal<string>(
    "Unable to load community feed. Please check your connection and try again.",
  );

  // Infinite scroll state
  isLoadingMore = signal(false);
  hasMorePosts = signal(true);
  currentPage = signal(1);
  readonly POSTS_PER_PAGE = 20;

  // Poll dialog state
  showPollDialog = false;
  pollQuestion = "";
  pollOptions: string[] = ["", ""];

  // Location dialog state
  showLocationDialog = false;
  locationInput = "";

  // Selected topic filter
  selectedTopic = signal<string | null>(null);

  // Computed property to check if poll is valid
  get isPollValid(): boolean {
    const hasQuestion = this.pollQuestion.trim().length > 0;
    const validOptions = this.pollOptions.filter((o) => o.trim().length > 0);
    return hasQuestion && validOptions.length >= 2;
  }

  // Filtered posts based on selected topic
  filteredPosts = computed(() => {
    const topic = this.selectedTopic();
    const allPosts = this.posts();

    if (!topic) {
      return allPosts;
    }

    // Filter posts that mention the topic (in content or as hashtag)
    return allPosts.filter(
      (post) =>
        post.content.toLowerCase().includes(topic.toLowerCase()) ||
        post.content.includes(`#${topic}`),
    );
  });

  currentUserInitials = computed(() => {
    const user = this.authService.getUser();
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "ME";
  });

  // Check if user is a coach
  readonly isCoach = computed(() => {
    const user = this.authService.getUser();
    const metadata = (user as { user_metadata?: UserMetadata } | null)
      ?.user_metadata;
    return metadata?.role === "coach" || metadata?.role === "assistant_coach";
  });

  // Avatar color generator based on initials
  getAvatarColorClass(initials: string): string {
    const index = initials.charCodeAt(0) % COLORS.CHART.length;
    return `avatar-color-${index}`;
  }

  ngOnInit(): void {
    this.loadCommunityData();
  }

  retryLoad(): void {
    this.loadCommunityData();
  }

  // Infinite scroll - load more posts when near bottom
  onScroll(): void {
    if (this.isLoadingMore() || !this.hasMorePosts()) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const threshold = 500; // Load more when 500px from bottom

    if (scrollPosition >= documentHeight - threshold) {
      this.loadMorePosts();
    }
  }

  loadMorePosts(): void {
    if (this.isLoadingMore() || !this.hasMorePosts()) return;

    this.isLoadingMore.set(true);
    const nextPage = this.currentPage() + 1;
    const offset = (nextPage - 1) * this.POSTS_PER_PAGE;

    this.apiService
      .get<CommunityFeedResponse>(
        `/api/community?feed=true&limit=${this.POSTS_PER_PAGE}&offset=${offset}`,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data?.posts) {
            const newPosts = this.mapApiPosts(response.data.posts);

            if (newPosts.length > 0) {
              this.posts.update((posts) => [...posts, ...newPosts]);
              this.currentPage.set(nextPage);
            }

            // Check if we've reached the end
            if (newPosts.length < this.POSTS_PER_PAGE) {
              this.hasMorePosts.set(false);
            }
          } else {
            this.hasMorePosts.set(false);
          }
          this.isLoadingMore.set(false);
        },
        error: (err) => {
          this.logger.error("Error loading more posts:", err);
          this.isLoadingMore.set(false);
        },
      });
  }

  // Handle announcement events
  onAnnouncementViewed(announcementId: string): void {
    this.logger.info("Announcement viewed:", toLogContext(announcementId));
  }

  onAnnouncementAcknowledged(announcementId: string): void {
    this.logger.info(
      "Announcement acknowledged:",
      toLogContext(announcementId),
    );
  }

  loadCommunityData(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);

    // Load posts from real API (primary content - drives page load state)
    this.apiService
      .get<CommunityFeedResponse>("/api/community?feed=true")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isPageLoading.set(false);
          this.hasPageError.set(false);
          if (response?.data?.posts) {
            this.posts.set(this.mapApiPosts(response.data.posts));
          } else {
            this.posts.set([]);
          }
        },
        error: (err) => {
          this.logger.error("Error loading community feed:", err);
          this.isPageLoading.set(false);
          this.hasPageError.set(true);
          this.pageErrorMessage.set(
            err?.message ||
              "Unable to load community feed. Please check your connection and try again.",
          );
        },
      });

    // Load leaderboard from real API
    this.apiService
      .get<ApiLeaderboardEntry[]>("/api/community?leaderboard=true")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data) {
            const leaderboardData = Array.isArray(response.data)
              ? response.data
              : [];
            const mappedLeaderboard = leaderboardData.map(
              (entry: ApiLeaderboardEntry) => ({
                rank: entry.rank,
                name: entry.name || "Anonymous",
                initials: this.getInitialsStr(entry.name || "??"),
                score: entry.points,
              }),
            );
            this.leaderboard.set(mappedLeaderboard);
          }
        },
        error: (err) => this.logger.error("Error loading leaderboard:", err),
      });

    // Load trending topics from real API
    this.apiService
      .get<TrendingTopicsResponse>("/api/community?trending=true")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data?.topics) {
            this.trendingTopics.set(response.data.topics);
          }
        },
        error: (err) => {
          this.logger.error("Error loading trending topics:", err);
          // Set default trending topics as fallback
          this.trendingTopics.set([
            { name: "Training", count: 45 },
            { name: "GameDay", count: 38 },
            { name: "Quarterback", count: 27 },
            { name: "Defense", count: 19 },
            { name: "Fitness", count: 15 },
          ]);
        },
      });
  }

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  }

  scrollToCreatePost(): void {
    const cardRef = this.createPostCard();
    if (cardRef) {
      cardRef.nativeElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // Focus the textarea
      setTimeout(() => {
        const textarea = cardRef.nativeElement.querySelector("textarea");
        textarea?.focus();
      }, 500);
    }
  }

  async createPost(): Promise<void> {
    if (!this.newPostContent.trim() && !this.pendingPoll && !this.pendingMedia)
      return;

    // Clean up content - remove placeholders
    let content = this.newPostContent;
    content = content.replace(/\n📊 Poll attached/g, "").trim();
    content = content.replace(/\n📷 \[Photo attached: .+\]/g, "").trim();
    content = content.replace(/\n🎥 \[Video attached: .+\]/g, "").trim();

    // Extract location from content if present
    const locationMatch = content.match(/\n📍 (.+)$/);
    const location = locationMatch ? locationMatch[1] : null;
    if (locationMatch) {
      content = content.replace(/\n📍 .+$/, "").trim();
    }

    // Upload media if present
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (this.pendingMedia) {
      this.toastService.info(TOAST.INFO.UPLOADING_MEDIA);
      try {
        const uploadResult = await this.uploadMedia();
        if (uploadResult) {
          mediaUrl = uploadResult.url;
          mediaType = uploadResult.type;
        }
      } catch (err) {
        this.toastService.error(
          "Failed to upload media. Post will be created without it.",
        );
        this.logger.error("Media upload failed:", err);
      }
    }

    const postData = {
      content,
      location,
      media_url: mediaUrl,
      media_type: mediaType,
      post_type: "general",
    };

    // Call API to create post
    this.apiService
      .post<{
        id?: string;
        authorName?: string;
        location?: string;
        content?: string;
      }>("/api/community", postData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data;
          if (data) {
            const newPost: Post = {
              id: data.id || Date.now().toString(),
              author: data.authorName || "You",
              authorInitials: this.currentUserInitials(),
              timeAgo: "Just now",
              location: data.location,
              content: data.content || content,
              likes: 0,
              comments: 0,
              shares: 0,
              isLiked: false,
              isBookmarked: false,
              showComments: false,
              commentsList: [],
              newComment: "",
              media: mediaUrl
                ? { type: mediaType as "image" | "video", url: mediaUrl }
                : undefined,
              poll: this.pendingPoll || undefined,
            };

            // Update posts signal with new post at the beginning
            this.posts.update((posts) => [newPost, ...posts]);
            this.toastService.success(TOAST.SUCCESS.POST_PUBLISHED);

            // Update user stats
            this.userStats.update((stats) => ({
              ...stats,
              posts: stats.posts + 1,
            }));
          }
          this.newPostContent = "";
          this.pendingPoll = null;
          this.pendingMedia = null;
        },
        error: (err) => {
          this.logger.error("Error creating post:", err);
          // Fallback to optimistic update if API fails
          const newPost: Post = {
            id: Date.now().toString(),
            author: "You",
            authorInitials: this.currentUserInitials(),
            timeAgo: "Just now",
            location: location || undefined,
            content: content,
            likes: 0,
            comments: 0,
            shares: 0,
            isLiked: false,
            isBookmarked: false,
            showComments: false,
            commentsList: [],
            newComment: "",
            media: mediaUrl
              ? { type: mediaType as "image" | "video", url: mediaUrl }
              : undefined,
            poll: this.pendingPoll || undefined,
          };
          this.posts.update((posts) => [newPost, ...posts]);
          this.newPostContent = "";
          this.pendingPoll = null;
          this.pendingMedia = null;
          this.toastService.warn(TOAST.WARN.POST_SAVED);
        },
      });
  }

  toggleLike(post: Post): void {
    // Optimistically update UI
    const wasLiked = post.isLiked;
    this.posts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p,
      ),
    );

    // Call API to persist like
    this.apiService
      .post<{
        success: boolean;
      }>(`/api/community?postId=${post.id}&like=true`, {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (_response) => {
          // Update user stats if we liked
          if (!wasLiked) {
            this.userStats.update((stats) => ({
              ...stats,
              likes: stats.likes + 1,
            }));
          }
        },
        error: (err) => {
          this.logger.error("Error toggling like:", err);
          // Revert optimistic update on error
          this.posts.update((posts) =>
            posts.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    isLiked: wasLiked,
                    likes: wasLiked ? p.likes + 1 : p.likes - 1,
                  }
                : p,
            ),
          );
        },
      });
  }

  toggleComments(post: Post): void {
    const willShow = !post.showComments;

    // Create a new posts array with the updated post
    this.posts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              showComments: willShow,
            }
          : p,
      ),
    );

    // Load comments from API when expanding
    if (willShow && post.commentsList.length === 0 && post.comments > 0) {
      this.apiService
        .get<{
          comments?: Comment[];
        }>(`/api/community?postId=${post.id}&comment=true`)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const comments = response?.data?.comments;
            if (comments) {
              this.posts.update((posts) =>
                posts.map((p) =>
                  p.id === post.id
                    ? {
                        ...p,
                        commentsList: comments.map((c: Comment) => ({
                          id: c.id,
                          author: c.author,
                          authorInitials: this.getInitialsStr(c.author || "??"),
                          content: c.content,
                          timeAgo: c.timeAgo,
                          likes: c.likes || 0,
                        })),
                      }
                    : p,
                ),
              );
            }
          },
          error: (err) => {
            this.logger.error("Error loading comments:", err);
          },
        });
    }
  }

  toggleBookmark(post: Post): void {
    // Optimistically update UI
    const wasBookmarked = post.isBookmarked;
    this.posts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              isBookmarked: !p.isBookmarked,
            }
          : p,
      ),
    );

    // Call API to persist bookmark
    this.apiService
      .post<void>(`/api/community?postId=${post.id}&bookmark=true`, {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (!wasBookmarked) {
            this.toastService.success(TOAST.SUCCESS.BOOKMARK_SAVED);
          } else {
            this.toastService.info(TOAST.INFO.BOOKMARK_REMOVED);
          }
        },
        error: (err) => {
          this.logger.error("Error toggling bookmark:", err);
          // Revert optimistic update on error
          this.posts.update((posts) =>
            posts.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    isBookmarked: wasBookmarked,
                  }
                : p,
            ),
          );
          this.toastService.error(TOAST.ERROR.BOOKMARK_UPDATE_FAILED);
        },
      });
  }

  addComment(post: Post): void {
    if (!post.newComment?.trim()) return;

    const commentContent = post.newComment.trim();

    // Optimistically add comment to UI
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      author: "You",
      authorInitials: this.currentUserInitials(),
      content: commentContent,
      timeAgo: "Just now",
      likes: 0,
    };

    this.posts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              commentsList: [...p.commentsList, tempComment],
              comments: p.comments + 1,
              newComment: "",
            }
          : p,
      ),
    );

    // Call API to persist comment
    this.apiService
      .post<ApiCommentResponse>(
        `/api/community?postId=${post.id}&comment=true`,
        {
          content: commentContent,
        },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Replace temp comment with real one from server
          if (response?.data?.id) {
            const responseData = response.data;
            this.posts.update((posts) =>
              posts.map((p) =>
                p.id === post.id
                  ? {
                      ...p,
                      commentsList: p.commentsList.map((c) =>
                        c.id === tempComment.id
                          ? {
                              ...c,
                              id: responseData.id,
                              author: responseData.author || c.author,
                            }
                          : c,
                      ),
                    }
                  : p,
              ),
            );
          }

          // Update user stats
          this.userStats.update((stats) => ({
            ...stats,
            comments: stats.comments + 1,
          }));
        },
        error: (err) => {
          this.logger.error("Error adding comment:", err);
          // Remove optimistic comment on error
          this.posts.update((posts) =>
            posts.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    commentsList: p.commentsList.filter(
                      (c) => c.id !== tempComment.id,
                    ),
                    comments: p.comments - 1,
                  }
                : p,
            ),
          );
          this.toastService.error(TOAST.ERROR.COMMENT_ADD_FAILED);
        },
      });
  }

  // Pending media for post
  pendingMedia: {
    file: File;
    type: "image" | "video";
    preview: string;
  } | null = null;

  // Post attachment methods
  attachPhoto(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size (5MB max for images)
        if (file.size > 5 * 1024 * 1024) {
          this.toastService.error(TOAST.ERROR.FILE_TOO_LARGE_5MB);
          return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          this.pendingMedia = {
            file,
            type: "image",
            preview: reader.result as string,
          };
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
        // Validate file size (50MB max for videos)
        if (file.size > 50 * 1024 * 1024) {
          this.toastService.error(TOAST.ERROR.VIDEO_TOO_LARGE_50MB);
          return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          this.pendingMedia = {
            file,
            type: "video",
            preview: reader.result as string,
          };
          this.newPostContent += `\n🎥 [Video attached: ${file.name}]`;
          this.toastService.success(TOAST.SUCCESS.VIDEO_READY);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  // Upload media file to server
  private uploadMedia(): Promise<{ url: string; type: string } | null> {
    const media = this.pendingMedia;
    if (!media || !media.file) {
      return Promise.resolve(null);
    }

    const file = media.file;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;

        this.apiService
          .post<ApiUploadResponse>("/api/upload", {
            file: base64Data,
            fileType: file.type,
            fileName: file.name,
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              if (response?.data?.url) {
                resolve({
                  url: response.data.url,
                  type: response.data.mediaType,
                });
              } else {
                resolve(null);
              }
            },
            error: (err) => {
              this.logger.error("Error uploading media:", err);
              reject(err);
            },
          });
      };
      reader.readAsDataURL(file);
    });
  }

  createPoll(): void {
    // Reset poll form and open dialog
    this.pollQuestion = "";
    this.pollOptions = ["", ""];
    this.showPollDialog = true;
  }

  setPollQuestion(value: string): void {
    this.pollQuestion = value;
  }

  setPollOption(index: number, value: string): void {
    this.pollOptions = this.pollOptions.map((option, i) =>
      i === index ? value : option,
    );
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
      // Store poll data for when post is created
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

  // Store pending poll data
  pendingPoll: Poll | null = null;

  // Vote on a poll
  votePoll(post: Post, optionId: string): void {
    if (!post.poll || post.poll.userVote) return;

    // Optimistically update UI
    this.posts.update((posts) =>
      posts.map((p) => {
        if (p.id !== post.id || !p.poll) return p;

        const updatedOptions = p.poll.options.map((opt) => ({
          ...opt,
          votes: opt.id === optionId ? opt.votes + 1 : opt.votes,
        }));

        const totalVotes = p.poll.totalVotes + 1;

        // Calculate percentages
        const optionsWithPercentage = updatedOptions.map((opt) => ({
          ...opt,
          percentage: Math.round((opt.votes / totalVotes) * 100),
        }));

        return {
          ...p,
          poll: {
            ...p.poll,
            options: optionsWithPercentage,
            totalVotes,
            userVote: optionId,
          },
        };
      }),
    );

    // Call API to persist vote
    this.apiService
      .post<ApiPollVoteResponse>(
        `/api/community?optionId=${optionId}&pollVote=true`,
        {},
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.data?.options) {
            // Update with server response
            if (response.data) {
              const pollData = response.data;
              this.posts.update((posts) =>
                posts.map((p) => {
                  if (p.id !== post.id || !p.poll) return p;
                  return {
                    ...p,
                    poll: {
                      ...p.poll,
                      options: pollData.options,
                      totalVotes: pollData.totalVotes,
                      userVote: optionId,
                    },
                  };
                }),
              );
            }
          }
          this.toastService.success(TOAST.SUCCESS.VOTE_RECORDED);
        },
        error: (err) => {
          this.logger.error("Error voting on poll:", err);
          // Revert optimistic update
          this.posts.update((posts) =>
            posts.map((p) => {
              if (p.id !== post.id || !p.poll) return p;

              const revertedOptions = p.poll.options.map((opt) => ({
                ...opt,
                votes: opt.id === optionId ? opt.votes - 1 : opt.votes,
              }));

              const totalVotes = p.poll.totalVotes - 1;

              const optionsWithPercentage = revertedOptions.map((opt) => ({
                ...opt,
                percentage:
                  totalVotes > 0
                    ? Math.round((opt.votes / totalVotes) * 100)
                    : 0,
              }));

              return {
                ...p,
                poll: {
                  ...p.poll,
                  options: optionsWithPercentage,
                  totalVotes,
                  userVote: undefined,
                },
              };
            }),
          );
          this.toastService.error(TOAST.ERROR.SAVE_FAILED);
        },
      });
  }

  // Get the maximum percentage for highlighting winner
  getMaxPercentage(poll: Poll): number {
    return Math.max(...poll.options.map((o) => o.percentage || 0));
  }

  addLocation(): void {
    this.locationInput = "";
    this.showLocationDialog = true;
  }

  setLocationInput(value: string): void {
    this.locationInput = value;
  }

  setNewPostContent(value: string): void {
    this.newPostContent = value;
  }

  setPostComment(postId: string, value: string): void {
    this.posts.update((posts) =>
      posts.map((p) => (p.id === postId ? { ...p, newComment: value } : p)),
    );
  }

  getInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  private mapApiPosts(apiPosts: ApiPostData[]): Post[] {
    return apiPosts.map((post) => this.mapApiPost(post));
  }

  private mapApiPost(post: ApiPostData): Post {
    const authorName = post.authorName || post.author || "Unknown";
    const media = this.getApiPostMedia(post);

    return {
      id: post.id,
      author: authorName,
      authorInitials: this.getInitialsStr(post.authorName || post.author || "??"),
      authorRole: post.postType === "announcement" ? "Coach" : undefined,
      timeAgo: this.getRelativeTime(new Date(post.timestamp)),
      location: post.location,
      content: post.content,
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      isLiked: post.isLiked || false,
      isBookmarked: post.isBookmarked || false,
      showComments: false,
      commentsList: [],
      newComment: "",
      media,
    };
  }

  private getApiPostMedia(post: ApiPostData): PostMedia {
    if (!post.mediaUrl) {
      return undefined;
    }

    const mediaType = post.mediaType === "video" ? "video" : "image";
    return { type: mediaType, url: post.mediaUrl };
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

  sharePost(post: Post): void {
    const shareData = {
      title: `Post by ${post.author}`,
      text: post.content,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => {
          this.posts.update((posts) =>
            posts.map((p) =>
              p.id === post.id ? { ...p, shares: p.shares + 1 } : p,
            ),
          );
        })
        .catch(() => {
          this.copyToClipboard(post);
        });
    } else {
      this.copyToClipboard(post);
    }
  }

  // Topic selection methods
  selectTopic(topicName: string): void {
    if (this.selectedTopic() === topicName) {
      // If clicking the same topic, deselect it
      this.selectedTopic.set(null);
      this.toastService.info(TOAST.INFO.FILTER_CLEARED);
    } else {
      this.selectedTopic.set(topicName);
      this.toastService.success(
        TOAST.SUCCESS.SHOWING_POSTS_ABOUT.replace("{topic}", topicName),
      );

      // Scroll to posts feed
      setTimeout(() => {
        const feedRef = this.postsFeed();
        feedRef?.nativeElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }

  clearTopicFilter(): void {
    this.selectedTopic.set(null);
    this.toastService.info(TOAST.INFO.FILTER_CLEARED_ALL);
  }

  private copyToClipboard(post: Post): void {
    const text = `${post.author} says: "${post.content}" - Shared from FlagFit Pro`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.toastService.success(TOAST.SUCCESS.POST_LINK_COPIED);
        this.posts.update((posts) =>
          posts.map((p) =>
            p.id === post.id ? { ...p, shares: p.shares + 1 } : p,
          ),
        );
      })
      .catch(() => {
        this.toastService.error(TOAST.ERROR.SHARE_FAILED);
      });
  }

  // Toggle like on a comment
  toggleCommentLike(post: Post, comment: Comment): void {
    // Optimistically update UI
    const wasLiked = comment.isLiked || false;
    this.posts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              commentsList: p.commentsList.map((c) =>
                c.id === comment.id
                  ? {
                      ...c,
                      isLiked: !c.isLiked,
                      likes: c.isLiked ? c.likes - 1 : c.likes + 1,
                    }
                  : c,
              ),
            }
          : p,
      ),
    );

    // Call API to persist comment like
    this.apiService
      .post<void>(`/api/community?commentId=${comment.id}&commentLike=true`, {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          this.logger.error("Error toggling comment like:", err);
          // Revert optimistic update on error
          this.posts.update((posts) =>
            posts.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    commentsList: p.commentsList.map((c) =>
                      c.id === comment.id
                        ? {
                            ...c,
                            isLiked: wasLiked,
                            likes: wasLiked ? c.likes + 1 : c.likes - 1,
                          }
                        : c,
                    ),
                  }
                : p,
            ),
          );
        },
      });
  }
}
