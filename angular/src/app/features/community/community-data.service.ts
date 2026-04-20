import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { COLORS } from "../../core/constants/app.constants";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import {
  extractApiArray,
  extractApiPayload,
} from "../../core/utils/api-response-mapper";
import { getInitials } from "../../shared/utils/format.utils";

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  content: string;
  timeAgo: string;
  likes: number;
  isLiked?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVote?: string;
  endsAt?: string;
}

export interface Post {
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

export interface PendingMedia {
  file: File;
  type: "image" | "video";
  preview: string;
}

// ============================================================================
// INTERNAL API TYPES
// ============================================================================

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

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({ providedIn: "root" })
export class CommunityDataService {
  private readonly api = inject(ApiService);
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  readonly POSTS_PER_PAGE = 20;

  // ====== Data signals ======
  readonly posts = signal<Post[]>([]);
  readonly leaderboard = signal<
    Array<{ rank: number; name: string; initials: string; score: number }>
  >([]);
  readonly trendingTopics = signal<Array<{ name: string; count: number }>>([]);
  readonly userStats = signal({ posts: 0, likes: 0, comments: 0 });

  // ====== Page-level state ======
  readonly isPageLoading = signal<boolean>(true);
  readonly hasPageError = signal<boolean>(false);
  readonly pageErrorMessage = signal<string>(
    "Unable to load community feed. Please check your connection and try again.",
  );

  // ====== Infinite scroll state ======
  readonly isLoadingMore = signal(false);
  readonly hasMorePosts = signal(true);
  readonly currentPage = signal(1);

  // ====== Topic filter ======
  readonly selectedTopic = signal<string | null>(null);

  // ====== Derived ======
  readonly currentUserInitials = computed(() => {
    const user = this.supabase.currentUser();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return "ME";
  });

  readonly isCoach = computed(() => {
    const metadata = this.supabase.currentUser()?.user_metadata as
      | UserMetadata
      | undefined;
    return metadata?.role === "coach" || metadata?.role === "assistant_coach";
  });

  readonly filteredPosts = computed(() => {
    const topic = this.selectedTopic();
    const allPosts = this.posts();
    if (!topic) return allPosts;
    return allPosts.filter(
      (post) =>
        post.content.toLowerCase().includes(topic.toLowerCase()) ||
        post.content.includes(`#${topic}`),
    );
  });

  // ============================================================================
  // UTILITIES
  // ============================================================================

  getAvatarColorClass(initials: string): string {
    const index = initials.charCodeAt(0) % COLORS.CHART.length;
    return `avatar-color-${index}`;
  }

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

  getMaxPercentage(poll: Poll): number {
    return Math.max(...poll.options.map((o) => o.percentage || 0));
  }

  updatePost(postId: string, updater: (post: Post) => Post): void {
    this.posts.update((posts) =>
      posts.map((post) => (post.id === postId ? updater(post) : post)),
    );
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  loadCommunityData(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);

    this.api
      .get<CommunityFeedResponse>("/api/community?feed=true")
      .subscribe({
        next: (response) => {
          this.isPageLoading.set(false);
          this.hasPageError.set(false);
          const payload = extractApiPayload<CommunityFeedResponse>(response);
          this.posts.set(this.mapApiPosts(payload?.posts ?? []));
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

    this.api
      .get<ApiLeaderboardEntry[]>("/api/community?leaderboard=true")
      .subscribe({
        next: (response) => {
          const leaderboardData = extractApiArray<ApiLeaderboardEntry>(response);
          this.leaderboard.set(
            leaderboardData.map((entry) => ({
              rank: entry.rank,
              name: entry.name || "Anonymous",
              initials: this.getInitialsStr(entry.name || "??"),
              score: entry.points,
            })),
          );
        },
        error: (err) => this.logger.error("Error loading leaderboard:", err),
      });

    this.api
      .get<TrendingTopicsResponse>("/api/community?trending=true")
      .subscribe({
        next: (response) => {
          const payload = extractApiPayload<TrendingTopicsResponse>(response);
          if (payload?.topics) {
            this.trendingTopics.set(payload.topics);
          }
        },
        error: (err) => {
          this.logger.error("Error loading trending topics:", err);
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

  loadMorePosts(): void {
    if (this.isLoadingMore() || !this.hasMorePosts()) return;

    this.isLoadingMore.set(true);
    const nextPage = this.currentPage() + 1;
    const offset = (nextPage - 1) * this.POSTS_PER_PAGE;

    this.api
      .get<CommunityFeedResponse>(
        `/api/community?feed=true&limit=${this.POSTS_PER_PAGE}&offset=${offset}`,
      )
      .subscribe({
        next: (response) => {
          const payload = extractApiPayload<CommunityFeedResponse>(response);
          const newPosts = this.mapApiPosts(payload?.posts ?? []);

          if (newPosts.length > 0) {
            this.posts.update((posts) => [...posts, ...newPosts]);
            this.currentPage.set(nextPage);
          }

          if (!payload?.posts || newPosts.length < this.POSTS_PER_PAGE) {
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

  // ============================================================================
  // POST MUTATIONS
  // ============================================================================

  async createPost(
    content: string,
    location: string | null,
    pendingMedia: PendingMedia | null,
    pendingPoll: Poll | null,
  ): Promise<void> {
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (pendingMedia) {
      this.toastService.info(TOAST.INFO.UPLOADING_MEDIA);
      try {
        const uploadResult = await this.uploadMedia(pendingMedia);
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

    return new Promise((resolve) => {
      this.api
        .post<{ id?: string; authorName?: string; location?: string; content?: string }>(
          "/api/community",
          postData,
        )
        .subscribe({
          next: (response) => {
            const data = extractApiPayload<{
              id?: string;
              authorName?: string;
              location?: string;
              content?: string;
            }>(response);
            if (data) {
              const newPost = this.buildOptimisticPost({
                id: data.id,
                author: data.authorName,
                location: data.location,
                content: data.content || content,
                mediaUrl,
                mediaType,
                pendingPoll,
              });
              this.posts.update((posts) => [newPost, ...posts]);
              this.toastService.success(TOAST.SUCCESS.POST_PUBLISHED);
              this.userStats.update((stats) => ({
                ...stats,
                posts: stats.posts + 1,
              }));
            }
            resolve();
          },
          error: (err) => {
            this.logger.error("Error creating post:", err);
            const newPost = this.buildOptimisticPost({
              location: location || undefined,
              content,
              mediaUrl,
              mediaType,
              pendingPoll,
            });
            this.posts.update((posts) => [newPost, ...posts]);
            this.toastService.warn(TOAST.WARN.POST_SAVED);
            resolve();
          },
        });
    });
  }

  toggleLike(post: Post): void {
    const wasLiked = post.isLiked;
    this.updatePost(post.id, (p) => ({
      ...p,
      isLiked: !p.isLiked,
      likes: p.isLiked ? p.likes - 1 : p.likes + 1,
    }));

    this.api
      .post<{ success: boolean }>(`/api/community?postId=${post.id}&like=true`, {})
      .subscribe({
        next: () => {
          if (!wasLiked) {
            this.userStats.update((stats) => ({ ...stats, likes: stats.likes + 1 }));
          }
        },
        error: (err) => {
          this.logger.error("Error toggling like:", err);
          this.updatePost(post.id, (p) => ({
            ...p,
            isLiked: wasLiked,
            likes: wasLiked ? p.likes + 1 : p.likes - 1,
          }));
        },
      });
  }

  toggleBookmark(post: Post): void {
    const wasBookmarked = post.isBookmarked;
    this.updatePost(post.id, (p) => ({ ...p, isBookmarked: !p.isBookmarked }));

    this.api
      .post<void>(`/api/community?postId=${post.id}&bookmark=true`, {})
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
          this.updatePost(post.id, (p) => ({ ...p, isBookmarked: wasBookmarked }));
          this.toastService.error(TOAST.ERROR.BOOKMARK_UPDATE_FAILED);
        },
      });
  }

  toggleComments(post: Post): void {
    const willShow = !post.showComments;
    this.updatePost(post.id, (p) => ({ ...p, showComments: willShow }));

    if (willShow && post.commentsList.length === 0 && post.comments > 0) {
      this.api
        .get<{ comments?: Comment[] }>(`/api/community?postId=${post.id}&comment=true`)
        .subscribe({
          next: (response) => {
            const comments = extractApiPayload<{ comments?: Comment[] }>(response)?.comments;
            if (comments) {
              this.updatePost(post.id, (p) => ({
                ...p,
                commentsList: comments.map((comment: Comment) => ({
                  id: comment.id,
                  author: comment.author,
                  authorInitials: this.getInitialsStr(comment.author || "??"),
                  content: comment.content,
                  timeAgo: comment.timeAgo,
                  likes: comment.likes || 0,
                })),
              }));
            }
          },
          error: (err) => this.logger.error("Error loading comments:", err),
        });
    }
  }

  addComment(post: Post): void {
    if (!post.newComment?.trim()) return;

    const commentContent = post.newComment.trim();
    const tempComment = this.buildOptimisticComment(commentContent);

    this.updatePost(post.id, (p) => ({
      ...p,
      commentsList: [...p.commentsList, tempComment],
      comments: p.comments + 1,
      newComment: "",
    }));

    this.api
      .post<ApiCommentResponse>(`/api/community?postId=${post.id}&comment=true`, {
        content: commentContent,
      })
      .subscribe({
        next: (response) => {
          const responseData = extractApiPayload<ApiCommentResponse>(response);
          if (responseData?.id) {
            this.updatePost(post.id, (p) => ({
              ...p,
              commentsList: p.commentsList.map((c) =>
                c.id === tempComment.id
                  ? { ...c, id: responseData.id, author: responseData.author || c.author }
                  : c,
              ),
            }));
          }
          this.userStats.update((stats) => ({ ...stats, comments: stats.comments + 1 }));
        },
        error: (err) => {
          this.logger.error("Error adding comment:", err);
          this.updatePost(post.id, (p) => ({
            ...p,
            commentsList: p.commentsList.filter((c) => c.id !== tempComment.id),
            comments: p.comments - 1,
          }));
          this.toastService.error(TOAST.ERROR.COMMENT_ADD_FAILED);
        },
      });
  }

  setPostComment(postId: string, value: string): void {
    this.posts.update((posts) =>
      posts.map((p) => (p.id === postId ? { ...p, newComment: value } : p)),
    );
  }

  votePoll(post: Post, optionId: string): void {
    if (!post.poll || post.poll.userVote) return;

    this.posts.update((posts) =>
      posts.map((p) => {
        if (p.id !== post.id || !p.poll) return p;

        const updatedOptions = p.poll.options.map((opt) => ({
          ...opt,
          votes: opt.id === optionId ? opt.votes + 1 : opt.votes,
        }));
        const totalVotes = p.poll.totalVotes + 1;
        const optionsWithPercentage = updatedOptions.map((opt) => ({
          ...opt,
          percentage: Math.round((opt.votes / totalVotes) * 100),
        }));

        return {
          ...p,
          poll: { ...p.poll, options: optionsWithPercentage, totalVotes, userVote: optionId },
        };
      }),
    );

    this.api
      .post<ApiPollVoteResponse>(`/api/community?optionId=${optionId}&pollVote=true`, {})
      .subscribe({
        next: (response) => {
          const pollData = extractApiPayload<ApiPollVoteResponse>(response);
          if (pollData?.options) {
            this.posts.update((posts) =>
              posts.map((p) => {
                if (p.id !== post.id || !p.poll) return p;
                return {
                  ...p,
                  poll: { ...p.poll, options: pollData.options, totalVotes: pollData.totalVotes, userVote: optionId },
                };
              }),
            );
          }
          this.toastService.success(TOAST.SUCCESS.VOTE_RECORDED);
        },
        error: (err) => {
          this.logger.error("Error voting on poll:", err);
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
                  totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
              }));

              return {
                ...p,
                poll: { ...p.poll, options: optionsWithPercentage, totalVotes, userVote: undefined },
              };
            }),
          );
          this.toastService.error(TOAST.ERROR.SAVE_FAILED);
        },
      });
  }

  toggleCommentLike(post: Post, comment: Comment): void {
    const wasLiked = comment.isLiked || false;

    this.posts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              commentsList: p.commentsList.map((c) =>
                c.id === comment.id
                  ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
                  : c,
              ),
            }
          : p,
      ),
    );

    this.api
      .post<void>(`/api/community?commentId=${comment.id}&commentLike=true`, {})
      .subscribe({
        error: (err) => {
          this.logger.error("Error toggling comment like:", err);
          this.posts.update((posts) =>
            posts.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    commentsList: p.commentsList.map((c) =>
                      c.id === comment.id
                        ? { ...c, isLiked: wasLiked, likes: wasLiked ? c.likes + 1 : c.likes - 1 }
                        : c,
                    ),
                  }
                : p,
            ),
          );
        },
      });
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
            posts.map((p) => (p.id === post.id ? { ...p, shares: p.shares + 1 } : p)),
          );
        })
        .catch(() => this.copyToClipboard(post));
    } else {
      this.copyToClipboard(post);
    }
  }

  selectTopic(topicName: string): void {
    if (this.selectedTopic() === topicName) {
      this.selectedTopic.set(null);
      this.toastService.info(TOAST.INFO.FILTER_CLEARED);
    } else {
      this.selectedTopic.set(topicName);
      this.toastService.success(
        TOAST.SUCCESS.SHOWING_POSTS_ABOUT.replace("{topic}", topicName),
      );
    }
  }

  clearTopicFilter(): void {
    this.selectedTopic.set(null);
    this.toastService.info(TOAST.INFO.FILTER_CLEARED_ALL);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async uploadMedia(
    pendingMedia: PendingMedia,
  ): Promise<{ url: string; type: string } | null> {
    const { file } = pendingMedia;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;

        firstValueFrom(
          this.api.post<ApiUploadResponse>("/api/upload", {
            file: base64Data,
            fileType: file.type,
            fileName: file.name,
          }),
        )
          .then((response) => {
            const payload = extractApiPayload<ApiUploadResponse>(response);
            resolve(payload?.url ? { url: payload.url, type: payload.mediaType } : null);
          })
          .catch((err) => {
            this.logger.error("Error uploading media:", err);
            reject(err);
          });
      };
      reader.readAsDataURL(file);
    });
  }

  private buildOptimisticComment(content: string): Comment {
    return {
      id: `temp-${Date.now()}`,
      author: "You",
      authorInitials: this.currentUserInitials(),
      content,
      timeAgo: "Just now",
      likes: 0,
    };
  }

  private buildOptimisticPost({
    id,
    author,
    location,
    content,
    mediaUrl,
    mediaType,
    pendingPoll,
  }: {
    id?: string;
    author?: string;
    location?: string;
    content: string;
    mediaUrl: string | null;
    mediaType: string | null;
    pendingPoll: Poll | null;
  }): Post {
    return {
      id: id || Date.now().toString(),
      author: author || "You",
      authorInitials: this.currentUserInitials(),
      timeAgo: "Just now",
      location,
      content,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      showComments: false,
      commentsList: [],
      newComment: "",
      media: mediaUrl ? { type: mediaType as "image" | "video", url: mediaUrl } : undefined,
      poll: pendingPoll || undefined,
    };
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
    if (!post.mediaUrl) return undefined;
    const mediaType = post.mediaType === "video" ? "video" : "image";
    return { type: mediaType, url: post.mediaUrl };
  }

  private copyToClipboard(post: Post): void {
    const text = `${post.author} says: "${post.content}" - Shared from FlagFit Pro`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.toastService.success(TOAST.SUCCESS.POST_LINK_COPIED);
        this.posts.update((posts) =>
          posts.map((p) => (p.id === post.id ? { ...p, shares: p.shares + 1 } : p)),
        );
      })
      .catch(() => {
        this.toastService.error(TOAST.ERROR.SHARE_FAILED);
      });
  }
}
