import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { COLORS } from "../../core/constants/app.constants";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { TeamNotificationService } from "../../core/services/team-notification.service";
import { ToastService } from "../../core/services/toast.service";
import { AnnouncementsBannerComponent } from "../../shared/components/announcements-banner/announcements-banner.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";

interface Comment {
  id: string;
  author: string;
  authorInitials: string;
  content: string;
  timeAgo: string;
  likes: number;
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

@Component({
  selector: "app-community",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ScrollingModule,
    CardModule,
    DialogModule,
    Textarea,
    AvatarModule,
    BadgeModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    MainLayoutComponent,
    AnnouncementsBannerComponent,
  
    ButtonComponent,
  ],
  template: `
    <app-main-layout>
      <!-- Poll Creation Dialog -->
      <p-dialog
        header="Create a Poll"
        [(visible)]="showPollDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
        [draggable]="false"
        [resizable]="false"
        styleClass="poll-dialog"
      >
        <div class="poll-form">
          <div class="form-field">
            <label for="pollQuestion">Poll Question</label>
            <input
              pInputText
              id="pollQuestion"
              [(ngModel)]="pollQuestion"
              placeholder="What would you like to ask?"
              class="poll-input"
            />
          </div>
          <div class="form-field">
            <label>Options</label>
            @for (option of pollOptions; track $index; let i = $index) {
              <div class="option-row">
                <input
                  pInputText
                  [(ngModel)]="pollOptions[i]"
                  [placeholder]="'Option ' + (i + 1)"
                  class="poll-input"
                />
                @if (pollOptions.length > 2) {
                  <button
                    type="button"
                    class="remove-option-btn"
                    (click)="removeOption(i)"
                    pTooltip="Remove option"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                }
              </div>
            }
            @if (pollOptions.length < 4) {
              <button
                type="button"
                class="add-option-btn"
                (click)="addOption()"
              >
                <i class="pi pi-plus"></i>
                Add Option
              </button>
            }
          </div>
        </div>
        <ng-template pTemplate="footer">
          <app-button variant="text" (clicked)="cancelPoll()">Cancel</app-button>
          <app-button iconLeft="pi-check" [disabled]="!isPollValid" (clicked)="confirmPoll()">Add Poll</app-button>
        </ng-template>
      </p-dialog>

      <!-- Location Dialog -->
      <p-dialog
        header="Add Location"
        [(visible)]="showLocationDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [draggable]="false"
        [resizable]="false"
        styleClass="location-dialog"
      >
        <div class="location-form">
          <div class="form-field">
            <label for="locationInput">Where are you?</label>
            <input
              pInputText
              id="locationInput"
              [(ngModel)]="locationInput"
              placeholder="e.g., Training Field, Stadium, Gym..."
              class="location-input"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <app-button variant="text" (clicked)="cancelLocation()">Cancel</app-button>
          <app-button iconLeft="pi-map-marker" [disabled]="!locationInput.trim()" (clicked)="confirmLocation()">Add Location</app-button>
        </ng-template>
      </p-dialog>

      <div class="community-page">
        <!-- Modern Header -->
        <div class="community-header">
          <div class="header-content">
            <div class="header-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="header-text">
              <h1>Community Hub</h1>
              <p>Connect, share, and grow with fellow flag football athletes</p>
            </div>
          </div>
          <div class="header-actions">
            <app-button variant="outlined" iconLeft="pi-comments" routerLink="/team-chat">Team Chat</app-button>
            <app-button iconLeft="pi-plus" (clicked)="scrollToCreatePost()">Create Post</app-button>
          </div>
        </div>

        <!-- Announcements Banner -->
        <app-announcements-banner
          (viewed)="onAnnouncementViewed($event)"
          (acknowledged)="onAnnouncementAcknowledged($event)"
        ></app-announcements-banner>

        <div class="community-grid">
          <!-- Feed Container -->
          <div class="feed-container">
            <!-- Create Post Card - Premium Design -->
            <div class="create-post-card" #createPostCard>
              <div class="create-post-header">
                <p-avatar
                  [label]="currentUserInitials()"
                  shape="circle"
                  styleClass="user-avatar"
                ></p-avatar>
                <div class="post-prompt">What's on your mind?</div>
              </div>

              <div class="create-post-body">
                <textarea
                  pInputTextarea
                  [(ngModel)]="newPostContent"
                  placeholder="Share your training progress, game highlights, or tips with the community..."
                  rows="3"
                  [autoResize]="true"
                  class="post-textarea"
                ></textarea>
              </div>

              <div class="create-post-footer">
                <div class="media-options">
                  <button
                    type="button"
                    class="media-btn"
                    (click)="attachPhoto()"
                    pTooltip="Add Photo"
                  >
                    <i class="pi pi-image"></i>
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    class="media-btn"
                    (click)="attachVideo()"
                    pTooltip="Add Video"
                  >
                    <i class="pi pi-video"></i>
                    <span>Video</span>
                  </button>
                  <button
                    type="button"
                    class="media-btn"
                    (click)="createPoll()"
                    pTooltip="Create Poll"
                  >
                    <i class="pi pi-chart-bar"></i>
                    <span>Poll</span>
                  </button>
                  <button
                    type="button"
                    class="media-btn"
                    (click)="addLocation()"
                    pTooltip="Add Location"
                  >
                    <i class="pi pi-map-marker"></i>
                    <span>Location</span>
                  </button>
                </div>
                <app-button iconLeft="pi-send" [disabled]="!newPostContent.trim()" (clicked)="createPost()">Post</app-button>
              </div>
            </div>

            <!-- Active Filter Banner -->
            @if (selectedTopic()) {
              <div class="filter-banner">
                <div class="filter-info">
                  <i class="pi pi-filter"></i>
                  <span
                    >Showing posts about
                    <strong>#{{ selectedTopic() }}</strong></span
                  >
                </div>
                <button class="clear-btn" (click)="clearTopicFilter()">
                  <i class="pi pi-times"></i>
                  Clear
                </button>
              </div>
            }

            <!-- Posts Feed -->
            <div class="posts-feed">
              @for (post of filteredPosts(); track post.id; let i = $index) {
                <div
                  class="post-card"
                  [class.highlighted]="i === 0 && !selectedTopic()"
                >
                  <!-- Post Header -->
                  <div class="post-header">
                    <div class="author-info">
                      <p-avatar
                        [label]="post.authorInitials"
                        shape="circle"
                        [style]="{
                          background: getAvatarColor(post.authorInitials),
                          color: '#fff',
                        }"
                        styleClass="author-avatar"
                      ></p-avatar>
                      <div class="author-details">
                        <div class="author-name">
                          {{ post.author }}
                          @if (post.authorRole) {
                            <span class="author-badge">{{
                              post.authorRole
                            }}</span>
                          }
                        </div>
                        <div class="post-meta">
                          <span class="time">{{ post.timeAgo }}</span>
                          @if (post.location) {
                            <span class="location">
                              <i class="pi pi-map-marker"></i>
                              {{ post.location }}
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                    <button class="more-btn" pTooltip="More options">
                      <i class="pi pi-ellipsis-h"></i>
                    </button>
                  </div>

                  <!-- Post Content -->
                  <div class="post-content">
                    <p class="post-text">{{ post.content }}</p>

                    <!-- Poll Display -->
                    @if (post.poll) {
                      <div class="poll-container">
                        <div class="poll-header">
                          <i class="pi pi-chart-bar"></i>
                          <span class="poll-question">{{
                            post.poll.question
                          }}</span>
                        </div>
                        <div class="poll-options">
                          @for (option of post.poll.options; track option.id) {
                            <button
                              type="button"
                              class="poll-option"
                              [class.voted]="post.poll.userVote === option.id"
                              [class.has-votes]="post.poll.userVote"
                              (click)="votePoll(post, option.id)"
                              [disabled]="!!post.poll.userVote"
                            >
                              <div class="option-content">
                                <div class="option-radio">
                                  @if (post.poll.userVote === option.id) {
                                    <i class="pi pi-check-circle"></i>
                                  } @else {
                                    <i class="pi pi-circle"></i>
                                  }
                                </div>
                                <span class="option-text">{{
                                  option.text
                                }}</span>
                                @if (post.poll.userVote) {
                                  <span class="option-votes"
                                    >{{ option.votes }} votes</span
                                  >
                                  <span class="option-percentage"
                                    >{{ option.percentage }}%</span
                                  >
                                }
                              </div>
                              @if (post.poll.userVote) {
                                <div
                                  class="option-progress"
                                  [style.width.%]="option.percentage"
                                  [class.winner]="
                                    option.percentage ===
                                    getMaxPercentage(post.poll)
                                  "
                                ></div>
                              }
                            </button>
                          }
                        </div>
                        <div class="poll-footer">
                          <span class="poll-total"
                            >{{ post.poll.totalVotes }} votes</span
                          >
                          @if (post.poll.endsAt) {
                            <span class="poll-ends"
                              >Ends {{ post.poll.endsAt }}</span
                            >
                          }
                        </div>
                      </div>
                    }

                    @if (post.media) {
                      <div class="post-media">
                        @if (post.media.type === "image") {
                          <img
                            [src]="post.media.url"
                            alt="Post image"
                            class="media-image"
                          />
                        }
                      </div>
                    }
                  </div>

                  <!-- Engagement Stats -->
                  <div class="engagement-stats">
                    <div class="stat-item">
                      <i
                        class="pi pi-heart-fill"
                        [class.liked]="post.isLiked"
                      ></i>
                      <span>{{ post.likes }}</span>
                    </div>
                    <div
                      class="stat-item clickable"
                      (click)="toggleComments(post)"
                    >
                      <span>{{ post.comments }} comments</span>
                    </div>
                    <div class="stat-item">
                      <span>{{ post.shares }} shares</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="post-actions">
                    <button
                      class="action-btn"
                      [class.active]="post.isLiked"
                      (click)="toggleLike(post)"
                    >
                      <i
                        [class]="
                          post.isLiked ? 'pi pi-heart-fill' : 'pi pi-heart'
                        "
                      ></i>
                      <span>{{ post.isLiked ? "Liked" : "Like" }}</span>
                    </button>
                    <button
                      class="action-btn"
                      [class.active]="post.showComments"
                      (click)="toggleComments(post)"
                    >
                      <i class="pi pi-comment"></i>
                      <span>Comment</span>
                    </button>
                    <button class="action-btn" (click)="sharePost(post)">
                      <i class="pi pi-share-alt"></i>
                      <span>Share</span>
                    </button>
                    <button
                      class="action-btn bookmark"
                      [class.active]="post.isBookmarked"
                      (click)="toggleBookmark(post)"
                    >
                      <i
                        [class]="
                          post.isBookmarked
                            ? 'pi pi-bookmark-fill'
                            : 'pi pi-bookmark'
                        "
                      ></i>
                    </button>
                  </div>

                  <!-- Comments Section -->
                  @if (post.showComments) {
                    <div class="comments-section" @fadeIn>
                      <!-- Existing Comments -->
                      @if (post.commentsList.length > 0) {
                        <div class="comments-list">
                          @for (
                            comment of post.commentsList;
                            track comment.id
                          ) {
                            <div class="comment-item">
                              <p-avatar
                                [label]="comment.authorInitials"
                                shape="circle"
                                [style]="{
                                  background: getAvatarColor(
                                    comment.authorInitials
                                  ),
                                  color: '#fff',
                                  width: '32px',
                                  height: '32px',
                                  'font-size': '0.75rem',
                                }"
                              ></p-avatar>
                              <div class="comment-body">
                                <div class="comment-bubble">
                                  <span class="comment-author">{{
                                    comment.author
                                  }}</span>
                                  <p class="comment-text">
                                    {{ comment.content }}
                                  </p>
                                </div>
                                <div class="comment-meta">
                                  <button class="comment-action">Like</button>
                                  <button class="comment-action">Reply</button>
                                  <span class="comment-time">{{
                                    comment.timeAgo
                                  }}</span>
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      }

                      <!-- Add Comment Input -->
                      <div class="add-comment">
                        <p-avatar
                          [label]="currentUserInitials()"
                          shape="circle"
                          [style]="{
                            width: '32px',
                            height: '32px',
                            'font-size': '0.75rem',
                          }"
                        ></p-avatar>
                        <div class="comment-input-wrapper">
                          <input
                            pInputText
                            type="text"
                            [(ngModel)]="post.newComment"
                            placeholder="Write a comment..."
                            class="comment-input"
                            (keyup.enter)="addComment(post)"
                          />
                          <button
                            class="send-comment-btn"
                            (click)="addComment(post)"
                            [disabled]="!post.newComment?.trim()"
                          >
                            <i class="pi pi-send"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Empty state when no posts match filter -->
              @if (filteredPosts().length === 0 && selectedTopic()) {
                <div class="empty-state">
                  <div class="empty-icon">
                    <i class="pi pi-search"></i>
                  </div>
                  <h3>No posts found</h3>
                  <p>
                    No posts match the topic
                    <strong>#{{ selectedTopic() }}</strong>
                  </p>
                  <app-button variant="outlined" iconLeft="pi-times" (clicked)="clearTopicFilter()">Clear Filter</app-button>
                </div>
              }
            </div>
          </div>

          <!-- Sidebar -->
          <div class="sidebar">
            <!-- Leaderboard Card -->
            <div class="sidebar-card leaderboard-card">
              <div class="card-header">
                <div class="card-icon trophy">
                  <i class="pi pi-trophy"></i>
                </div>
                <h3>Leaderboard</h3>
              </div>
              <div class="leaderboard-list">
                @for (entry of leaderboard(); track entry.rank) {
                  <div
                    class="leaderboard-item"
                    [class.top-rank]="entry.rank <= 3"
                  >
                    <div class="rank" [class]="'rank-' + entry.rank">
                      @if (entry.rank === 1) {
                        <i class="pi pi-crown"></i>
                      } @else {
                        {{ entry.rank }}
                      }
                    </div>
                    <p-avatar
                      [label]="entry.initials"
                      shape="circle"
                      [style]="{
                        background: getAvatarColor(entry.initials),
                        color: '#fff',
                        width: '36px',
                        height: '36px',
                      }"
                    ></p-avatar>
                    <div class="player-info">
                      <div class="player-name">{{ entry.name }}</div>
                      <div class="player-score">
                        {{ entry.score | number }} pts
                      </div>
                    </div>
                    @if (entry.rank <= 3) {
                      <div class="rank-badge" [class]="'badge-' + entry.rank">
                        {{
                          entry.rank === 1
                            ? "🥇"
                            : entry.rank === 2
                              ? "🥈"
                              : "🥉"
                        }}
                      </div>
                    }
                  </div>
                }
              </div>
              <button class="view-all-btn">View Full Leaderboard</button>
            </div>

            <!-- Trending Topics Card -->
            <div class="sidebar-card trending-card">
              <div class="card-header">
                <div class="card-icon fire">
                  <i class="pi pi-bolt"></i>
                </div>
                <h3>Trending Topics</h3>
              </div>
              <div class="topics-list">
                @for (topic of trendingTopics(); track topic.name) {
                  <div
                    class="topic-item"
                    [class.active]="selectedTopic() === topic.name"
                    (click)="selectTopic(topic.name)"
                    pTooltip="View posts about #{{ topic.name }}"
                    tooltipPosition="left"
                  >
                    <div class="topic-info">
                      <span class="topic-hashtag">#{{ topic.name }}</span>
                      <span class="topic-count">{{ topic.count }} posts</span>
                    </div>
                    <div class="topic-trend">
                      <i class="pi pi-arrow-up"></i>
                    </div>
                  </div>
                }
                @if (selectedTopic()) {
                  <button class="clear-filter-btn" (click)="clearTopicFilter()">
                    <i class="pi pi-times"></i>
                    Clear filter
                  </button>
                }
              </div>
            </div>

            <!-- Quick Stats Card -->
            <div class="sidebar-card stats-card">
              <div class="card-header">
                <div class="card-icon stats">
                  <i class="pi pi-chart-line"></i>
                </div>
                <h3>Your Activity</h3>
              </div>
              <div class="quick-stats">
                <div class="stat-box">
                  <span class="stat-number">{{ userStats().posts }}</span>
                  <span class="stat-label">Posts</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number">{{ userStats().likes }}</span>
                  <span class="stat-label">Likes</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number">{{ userStats().comments }}</span>
                  <span class="stat-label">Comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./community.component.scss",
})
export class CommunityComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(TeamNotificationService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

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
    const metadata = (user as any)?.user_metadata;
    return metadata?.role === "coach" || metadata?.role === "assistant_coach";
  });

  // Avatar color generator based on initials
  getAvatarColor(initials: string): string {
    const index = initials.charCodeAt(0) % COLORS.CHART.length;
    return COLORS.CHART[index];
  }

  ngOnInit(): void {
    this.loadCommunityData();
  }

  // Handle announcement events
  onAnnouncementViewed(announcementId: string): void {
    this.logger.info("Announcement viewed:", announcementId);
  }

  onAnnouncementAcknowledged(announcementId: string): void {
    this.logger.info("Announcement acknowledged:", announcementId);
  }

  loadCommunityData(): void {
    // Load posts from real API
    this.apiService.get<any[]>("/api/community/feed").subscribe({
      next: (response) => {
        if (response && response.data) {
          const mappedPosts = response.data.map((p: any) => ({
            id: p.id,
            author: p.author?.full_name || "Unknown",
            authorInitials: this.getInitials(p.author?.full_name || "??"),
            authorRole: p.author_role,
            timeAgo: this.getRelativeTime(new Date(p.created_at)),
            location: p.location,
            content: p.content,
            likes: p.likes?.count || 0,
            comments: p.comments?.count || 0,
            shares: p.shares_count || 0,
            isLiked: false, // Would check from user session
            isBookmarked: false,
            showComments: false,
            commentsList: [],
            newComment: "",
          }));
          this.posts.set(mappedPosts);
        }
      },
      error: (err) => this.logger.error("Error loading community feed:", err),
    });

    // Load leaderboard from real API
    this.apiService.get<any[]>("/api/community/leaderboard").subscribe({
      next: (response) => {
        if (response && response.data) {
          const mappedLeaderboard = response.data.map((entry: any) => ({
            rank: entry.rank,
            name: entry.user?.full_name || "Anonymous",
            initials: this.getInitials(entry.user?.full_name || "??"),
            score: entry.points,
          }));
          this.leaderboard.set(mappedLeaderboard);
        }
      },
      error: (err) => this.logger.error("Error loading leaderboard:", err),
    });

    // Load trending topics (placeholder for real data)
    this.trendingTopics.set([]);
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
    const element = document.querySelector(".create-post-card");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Focus the textarea
    setTimeout(() => {
      const textarea = element?.querySelector("textarea");
      textarea?.focus();
    }, 500);
  }

  createPost(): void {
    if (!this.newPostContent.trim() && !this.pendingPoll) return;

    // Clean up content if poll placeholder is there
    let content = this.newPostContent;
    if (this.pendingPoll) {
      content = content.replace(/\n📊 Poll attached/g, "").trim();
    }

    const newPost: Post = {
      id: Date.now().toString(),
      author: "You",
      authorInitials: this.currentUserInitials(),
      timeAgo: "Just now",
      content: content,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      showComments: false,
      commentsList: [],
      newComment: "",
      poll: this.pendingPoll || undefined,
    };

    // Update posts signal with new post at the beginning
    this.posts.update((posts) => [newPost, ...posts]);
    this.newPostContent = "";
    this.pendingPoll = null;
    this.toastService.success("Your post has been published!");

    // Update user stats
    this.userStats.update((stats) => ({
      ...stats,
      posts: stats.posts + 1,
    }));
  }

  toggleLike(post: Post): void {
    // Create a new posts array with the updated post
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
  }

  toggleComments(post: Post): void {
    // Create a new posts array with the updated post
    this.posts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              showComments: !p.showComments,
            }
          : p,
      ),
    );
  }

  toggleBookmark(post: Post): void {
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

    const updatedPost = this.posts().find((p) => p.id === post.id);
    if (updatedPost?.isBookmarked) {
      this.toastService.success("Post saved to bookmarks");
    }
  }

  addComment(post: Post): void {
    if (!post.newComment?.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: "You",
      authorInitials: this.currentUserInitials(),
      content: post.newComment,
      timeAgo: "Just now",
      likes: 0,
    };

    this.posts.update((posts) =>
      posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              commentsList: [...p.commentsList, newComment],
              comments: p.comments + 1,
              newComment: "",
            }
          : p,
      ),
    );

    // Update user stats
    this.userStats.update((stats) => ({
      ...stats,
      comments: stats.comments + 1,
    }));
  }

  // Post attachment methods
  attachPhoto(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.newPostContent += `\n📷 [Photo attached: ${file.name}]`;
        this.toastService.info("Photo will be uploaded with your post");
      }
    };
    input.click();
  }

  attachVideo(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.newPostContent += `\n🎥 [Video attached: ${file.name}]`;
        this.toastService.info("Video will be uploaded with your post");
      }
    };
    input.click();
  }

  createPoll(): void {
    // Reset poll form and open dialog
    this.pollQuestion = "";
    this.pollOptions = ["", ""];
    this.showPollDialog = true;
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
      this.toastService.success("Poll added to your post!");
      this.cdr.detectChanges();
    }
  }

  // Store pending poll data
  pendingPoll: Poll | null = null;

  // Vote on a poll
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

    this.toastService.success("Vote recorded!");
  }

  // Get the maximum percentage for highlighting winner
  getMaxPercentage(poll: Poll): number {
    return Math.max(...poll.options.map((o) => o.percentage || 0));
  }

  addLocation(): void {
    this.locationInput = "";
    this.showLocationDialog = true;
  }

  cancelLocation(): void {
    this.showLocationDialog = false;
    this.locationInput = "";
  }

  confirmLocation(): void {
    if (this.locationInput.trim()) {
      this.newPostContent = this.newPostContent + `\n📍 ${this.locationInput}`;
      this.showLocationDialog = false;
      this.toastService.success("Location added!");
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
      this.toastService.info("Filter cleared");
    } else {
      this.selectedTopic.set(topicName);
      this.toastService.success(`Showing posts about #${topicName}`);

      // Scroll to posts feed
      setTimeout(() => {
        const feedElement = document.querySelector(".posts-feed");
        feedElement?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  clearTopicFilter(): void {
    this.selectedTopic.set(null);
    this.toastService.info("Filter cleared - showing all posts");
  }

  private copyToClipboard(post: Post): void {
    const text = `${post.author} says: "${post.content}" - Shared from FlagFit Pro`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.toastService.success("Post link copied to clipboard!");
        this.posts.update((posts) =>
          posts.map((p) =>
            p.id === post.id ? { ...p, shares: p.shares + 1 } : p,
          ),
        );
      })
      .catch(() => {
        this.toastService.error("Unable to share. Please try again.");
      });
  }
}
