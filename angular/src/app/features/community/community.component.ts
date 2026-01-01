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
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
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
    ButtonModule,
    DialogModule,
    Textarea,
    AvatarModule,
    BadgeModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    MainLayoutComponent,
    AnnouncementsBannerComponent,
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
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="cancelPoll()"
          ></p-button>
          <p-button
            label="Add Poll"
            icon="pi pi-check"
            (onClick)="confirmPoll()"
            [disabled]="!isPollValid"
          ></p-button>
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
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="cancelLocation()"
          ></p-button>
          <p-button
            label="Add Location"
            icon="pi pi-map-marker"
            (onClick)="confirmLocation()"
            [disabled]="!locationInput.trim()"
          ></p-button>
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
            <p-button
              label="Team Chat"
              icon="pi pi-comments"
              [outlined]="true"
              [rounded]="true"
              routerLink="/team-chat"
              pTooltip="Join team discussions"
            ></p-button>
            <p-button
              label="Create Post"
              icon="pi pi-plus"
              [rounded]="true"
              (onClick)="scrollToCreatePost()"
            ></p-button>
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
                <p-button
                  label="Post"
                  icon="pi pi-send"
                  [rounded]="true"
                  (onClick)="createPost()"
                  [disabled]="!newPostContent.trim()"
                  styleClass="post-btn"
                ></p-button>
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
                  <p-button
                    label="Clear Filter"
                    icon="pi pi-times"
                    [outlined]="true"
                    [rounded]="true"
                    (onClick)="clearTopicFilter()"
                  ></p-button>
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
  styles: [
    `
      /* ============================================
         ANIMATIONS
         ============================================ */

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes heartPop {
        0% {
          transform: scale(1);
        }
        25% {
          transform: scale(1.3);
        }
        50% {
          transform: scale(0.95);
        }
        100% {
          transform: scale(1);
        }
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      /* ============================================
         COMMUNITY PAGE - PREMIUM DESIGN
         ============================================ */

      .community-page {
        padding: var(--space-6);
        background: linear-gradient(
          180deg,
          var(--surface-secondary) 0%,
          var(--surface-primary) 100%
        );
        min-height: 100vh;
      }

      /* ============================================
         AVATAR STYLES - WHITE TEXT ON ALL COLORS
         ============================================ */

      :host ::ng-deep .p-avatar {
        color: white !important;
        font-weight: 600 !important;
      }

      :host ::ng-deep .p-avatar .p-avatar-label {
        color: white !important;
      }

      /* ============================================
         HEADER SECTION
         ============================================ */

      .community-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-6);
        background: var(--surface-primary);
        border-radius: var(--radius-2xl);
        margin-bottom: var(--space-6);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        border: 1px solid var(--color-border-primary);
        animation: slideUp 0.4s ease-out;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .header-icon {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
          135deg,
          var(--ds-primary-green) 0%,
          var(--ds-primary-green-hover) 100%
        );
        border-radius: var(--radius-xl);
        color: white;
        font-size: 1.5rem;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .header-icon:hover {
        transform: scale(1.08) rotate(5deg);
      }

      .header-text h1 {
        font-size: var(--font-heading-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-1) 0;
      }

      .header-text p {
        font-size: var(--font-body-md);
        color: var(--color-text-secondary);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: var(--space-3);
      }

      /* ============================================
         GRID LAYOUT
         ============================================ */

      .community-grid {
        display: grid;
        grid-template-columns: 1fr 360px;
        gap: var(--space-6);
        align-items: start;
      }

      @media (max-width: 1200px) {
        .community-grid {
          grid-template-columns: 1fr;
        }

        .sidebar {
          display: none;
        }
      }

      /* ============================================
         CREATE POST CARD
         ============================================ */

      .create-post-card {
        background: var(--surface-primary);
        border-radius: var(--radius-2xl);
        padding: var(--space-5);
        margin-bottom: var(--space-5);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        border: 1px solid var(--color-border-primary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideUp 0.5s ease-out 0.1s both;
      }

      .create-post-card:focus-within {
        box-shadow: 0 8px 32px rgba(8, 153, 73, 0.15);
        border-color: var(--ds-primary-green);
        transform: translateY(-2px);
      }

      .create-post-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      :host ::ng-deep .user-avatar {
        width: 44px !important;
        height: 44px !important;
        background: var(--ds-primary-green) !important;
        font-size: 1rem !important;
        transition: transform 0.2s ease;
      }

      :host ::ng-deep .user-avatar:hover {
        transform: scale(1.1);
      }

      .post-prompt {
        font-size: var(--font-body-md);
        color: var(--color-text-muted);
        font-weight: var(--font-weight-medium);
      }

      .create-post-body {
        margin-bottom: var(--space-4);
      }

      .post-textarea {
        width: 100%;
        border: none !important;
        background: var(--surface-secondary) !important;
        border-radius: var(--radius-xl) !important;
        padding: var(--space-4) !important;
        font-size: var(--font-body-md) !important;
        resize: none;
        min-height: 80px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .post-textarea:focus {
        background: var(--surface-primary) !important;
        box-shadow: inset 0 0 0 2px var(--ds-primary-green) !important;
        outline: none !important;
      }

      .create-post-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--space-3);
        border-top: 1px solid var(--color-border-primary);
      }

      .media-options {
        display: flex;
        gap: var(--space-2);
      }

      .media-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        min-width: 44px;
        height: 40px;
        background: var(--surface-secondary);
        border: 1px solid transparent;
        border-radius: var(--radius-xl);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        cursor: pointer;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .media-btn i {
        font-size: 1.125rem;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 1;
      }

      .media-btn span {
        max-width: 0;
        overflow: hidden;
        white-space: nowrap;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 1;
      }

      /* Hover state - expand to show label */
      @media (hover: hover) and (pointer: fine) {
        .media-btn:hover {
          background: var(--ds-primary-green);
          color: white;
          border-color: var(--ds-primary-green);
          padding: var(--space-2) var(--space-4);
          box-shadow: 0 4px 16px rgba(8, 153, 73, 0.3);
          transform: translateY(-2px);
        }

        .media-btn:hover i {
          color: white;
          transform: scale(1.1);
        }

        .media-btn:hover span {
          max-width: 100px;
          opacity: 1;
          margin-left: var(--space-1);
        }
      }

      /* Active/pressed state */
      .media-btn:active {
        transform: translateY(0) scale(0.95);
        box-shadow: 0 2px 8px rgba(8, 153, 73, 0.2);
      }

      /* Focus state for accessibility */
      .media-btn:focus-visible {
        outline: 2px solid var(--ds-primary-green);
        outline-offset: 2px;
      }

      /* Touch device styles */
      @media (hover: none) and (pointer: coarse) {
        .media-btn {
          padding: var(--space-2) var(--space-3);
        }

        .media-btn span {
          max-width: 80px;
          opacity: 1;
          margin-left: var(--space-1);
        }

        .media-btn:active {
          background: var(--ds-primary-green);
          color: white;
          transform: scale(0.95);
        }

        .media-btn:active i {
          color: white;
        }
      }

      :host ::ng-deep .post-btn {
        padding: var(--space-2) var(--space-5) !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      :host ::ng-deep .post-btn:hover:not(:disabled) {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3) !important;
      }

      :host ::ng-deep .post-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.98) !important;
      }

      /* ============================================
         POST CARDS
         ============================================ */

      .posts-feed {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .post-card {
        background: var(--surface-primary);
        border-radius: var(--radius-2xl);
        padding: var(--space-5);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        border: 1px solid var(--color-border-primary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideUp 0.5s ease-out both;
      }

      .post-card:nth-child(1) {
        animation-delay: 0.15s;
      }
      .post-card:nth-child(2) {
        animation-delay: 0.25s;
      }
      .post-card:nth-child(3) {
        animation-delay: 0.35s;
      }
      .post-card:nth-child(4) {
        animation-delay: 0.45s;
      }

      .post-card:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
        transform: translateY(-4px);
        border-color: var(--ds-primary-green-subtle);
      }

      .post-card.highlighted {
        border-color: var(--ds-primary-green-subtle);
        background: linear-gradient(
          180deg,
          rgba(8, 153, 73, 0.03) 0%,
          var(--surface-primary) 100%
        );
      }

      /* Post Header */
      .post-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-4);
      }

      .author-info {
        display: flex;
        gap: var(--space-3);
      }

      :host ::ng-deep .author-avatar {
        width: 48px !important;
        height: 48px !important;
        font-size: 1.125rem !important;
        font-weight: 600 !important;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      :host ::ng-deep .author-avatar:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .author-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .author-name {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        transition: color 0.2s ease;
      }

      .author-name:hover {
        color: var(--ds-primary-green);
      }

      .author-badge {
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-medium);
        padding: 2px 8px;
        background: var(--ds-primary-green-subtle);
        color: var(--ds-primary-green);
        border-radius: var(--radius-full);
        transition: all 0.2s ease;
      }

      .author-badge:hover {
        background: var(--ds-primary-green);
        color: white;
      }

      .post-meta {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
      }

      .location {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        transition: color 0.2s ease;
        cursor: pointer;
      }

      .location:hover {
        color: var(--ds-primary-green);
      }

      .location i {
        font-size: 0.75rem;
      }

      .more-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: var(--radius-full);
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .more-btn:hover {
        background: var(--surface-secondary);
        color: var(--color-text-primary);
        transform: rotate(90deg);
      }

      /* Post Content */
      .post-content {
        margin-bottom: var(--space-4);
      }

      .post-text {
        font-size: var(--font-body-md);
        line-height: 1.7;
        color: var(--color-text-primary);
        margin: 0;
      }

      /* ============================================
         POLL STYLES - Interactive Voting UI
         ============================================ */

      .poll-container {
        margin-top: var(--space-4);
        padding: var(--space-4);
        background: linear-gradient(
          135deg,
          var(--surface-secondary) 0%,
          var(--surface-primary) 100%
        );
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        animation: fadeIn 0.3s ease-out;
      }

      .poll-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-3);
        border-bottom: 1px solid var(--color-border-primary);
      }

      .poll-header i {
        font-size: 1.25rem;
        color: var(--ds-primary-green);
      }

      .poll-question {
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .poll-options {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .poll-option {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        padding: var(--space-3) var(--space-4);
        background: var(--surface-primary);
        border: 2px solid var(--color-border-primary);
        border-radius: var(--radius-lg);
        cursor: pointer;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: left;
      }

      .poll-option:not(:disabled):hover {
        border-color: var(--ds-primary-green);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.15);
      }

      .poll-option:not(:disabled):active {
        transform: translateX(2px) scale(0.99);
      }

      .poll-option:disabled {
        cursor: default;
      }

      .poll-option.voted {
        border-color: var(--ds-primary-green);
        background: var(--ds-primary-green-ultra-subtle);
      }

      .poll-option.has-votes:not(.voted) {
        border-color: var(--color-border-secondary);
      }

      .option-content {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        width: 100%;
        z-index: 1;
      }

      .option-radio {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      .option-radio i {
        font-size: 1.25rem;
        color: var(--color-text-muted);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .poll-option:not(:disabled):hover .option-radio i {
        color: var(--ds-primary-green);
        transform: scale(1.1);
      }

      .poll-option.voted .option-radio i {
        color: var(--ds-primary-green);
        animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes checkPop {
        0% {
          transform: scale(0.5);
        }
        50% {
          transform: scale(1.3);
        }
        100% {
          transform: scale(1);
        }
      }

      .option-text {
        flex: 1;
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .poll-option.voted .option-text {
        color: var(--ds-primary-green);
        font-weight: var(--font-weight-semibold);
      }

      .option-votes {
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
        margin-left: auto;
      }

      .option-percentage {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        min-width: 40px;
        text-align: right;
      }

      .poll-option.voted .option-percentage {
        color: var(--ds-primary-green);
      }

      .option-progress {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: var(--ds-primary-green-ultra-subtle);
        border-radius: var(--radius-lg);
        transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 0;
      }

      .option-progress.winner {
        background: linear-gradient(
          90deg,
          var(--ds-primary-green-subtle) 0%,
          var(--ds-primary-green-ultra-subtle) 100%
        );
      }

      .poll-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--space-3);
        padding-top: var(--space-3);
        border-top: 1px solid var(--color-border-primary);
      }

      .poll-total {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
      }

      .poll-ends {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
      }

      .post-media {
        margin-top: var(--space-4);
        border-radius: var(--radius-xl);
        overflow: hidden;
        transition: transform 0.3s ease;
      }

      .post-media:hover {
        transform: scale(1.01);
      }

      .media-image {
        width: 100%;
        display: block;
        transition: transform 0.3s ease;
      }

      .post-media:hover .media-image {
        transform: scale(1.02);
      }

      /* Engagement Stats */
      .engagement-stats {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-3) 0;
        border-bottom: 1px solid var(--color-border-primary);
        margin-bottom: var(--space-3);
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
        transition: all 0.2s ease;
      }

      .stat-item.clickable {
        cursor: pointer;
      }

      .stat-item.clickable:hover {
        color: var(--ds-primary-green);
        transform: translateY(-1px);
      }

      .stat-item i {
        font-size: 0.875rem;
        transition: transform 0.2s ease;
      }

      .stat-item:hover i {
        transform: scale(1.2);
      }

      .stat-item i.liked {
        color: #ef4444;
        animation: heartPop 0.4s ease-out;
      }

      /* Action Buttons */
      .post-actions {
        display: flex;
        gap: var(--space-1);
      }

      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: transparent;
        border: none;
        border-radius: var(--radius-lg);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .action-btn::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: var(--surface-secondary);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition:
          width 0.4s ease,
          height 0.4s ease;
        z-index: 0;
      }

      .action-btn:hover::before {
        width: 200%;
        height: 200%;
      }

      .action-btn:hover {
        color: var(--color-text-primary);
        transform: translateY(-2px);
      }

      .action-btn:active {
        transform: translateY(0) scale(0.97);
      }

      .action-btn.active {
        color: var(--ds-primary-green);
      }

      .action-btn.active i.pi-heart-fill {
        color: #ef4444;
        animation: heartPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .action-btn.bookmark {
        flex: 0;
        padding: var(--space-3);
      }

      .action-btn.bookmark.active i {
        color: #f59e0b;
        animation: heartPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .action-btn i {
        font-size: 1.125rem;
        position: relative;
        z-index: 1;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .action-btn span {
        position: relative;
        z-index: 1;
      }

      .action-btn:hover i {
        transform: scale(1.2);
      }

      /* ============================================
         COMMENTS SECTION
         ============================================ */

      .comments-section {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--color-border-primary);
        animation: fadeIn 0.3s ease-out;
      }

      .comments-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .comment-item {
        display: flex;
        gap: var(--space-3);
        animation: slideUp 0.3s ease-out both;
      }

      .comment-item:nth-child(1) {
        animation-delay: 0.05s;
      }
      .comment-item:nth-child(2) {
        animation-delay: 0.1s;
      }
      .comment-item:nth-child(3) {
        animation-delay: 0.15s;
      }

      .comment-body {
        flex: 1;
      }

      .comment-bubble {
        background: var(--surface-secondary);
        padding: var(--space-3);
        border-radius: var(--radius-xl);
        border-top-left-radius: var(--radius-sm);
        transition: all 0.2s ease;
      }

      .comment-bubble:hover {
        background: var(--ds-primary-green-subtle);
      }

      .comment-author {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin-bottom: var(--space-1);
      }

      .comment-text {
        font-size: var(--font-body-sm);
        color: var(--color-text-primary);
        margin: 0;
        line-height: 1.5;
      }

      .comment-meta {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-top: var(--space-2);
        padding-left: var(--space-3);
      }

      .comment-action {
        background: none;
        border: none;
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-muted);
        cursor: pointer;
        padding: 0;
        transition: all 0.2s ease;
      }

      .comment-action:hover {
        color: var(--ds-primary-green);
        transform: translateY(-1px);
      }

      .comment-time {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
      }

      /* Add Comment */
      .add-comment {
        display: flex;
        gap: var(--space-3);
        align-items: center;
        animation: fadeIn 0.3s ease-out 0.2s both;
      }

      .comment-input-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        background: var(--surface-secondary);
        border-radius: var(--radius-full);
        padding: var(--space-1) var(--space-1) var(--space-1) var(--space-4);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .comment-input-wrapper:focus-within {
        background: var(--surface-primary);
        box-shadow: 0 0 0 2px var(--ds-primary-green);
        transform: scale(1.01);
      }

      .comment-input {
        flex: 1;
        border: none !important;
        background: transparent !important;
        padding: var(--space-2) !important;
        font-size: var(--font-body-sm) !important;
        outline: none !important;
        box-shadow: none !important;
      }

      .send-comment-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ds-primary-green);
        border: none;
        border-radius: var(--radius-full);
        color: white;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .send-comment-btn:hover:not(:disabled) {
        background: var(--ds-primary-green-hover);
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .send-comment-btn:active:not(:disabled) {
        transform: scale(0.95);
      }

      .send-comment-btn:disabled {
        background: var(--color-border-primary);
        cursor: not-allowed;
        transform: none;
      }

      .send-comment-btn i {
        transition: transform 0.2s ease;
      }

      .send-comment-btn:hover:not(:disabled) i {
        transform: translateX(2px);
      }

      /* ============================================
         SIDEBAR
         ============================================ */

      .sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
        position: sticky;
        top: var(--space-6);
      }

      .sidebar-card {
        background: var(--surface-primary);
        border-radius: var(--radius-2xl);
        padding: var(--space-5);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        border: 1px solid var(--color-border-primary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideUp 0.5s ease-out both;
      }

      .sidebar-card:nth-child(1) {
        animation-delay: 0.2s;
      }
      .sidebar-card:nth-child(2) {
        animation-delay: 0.3s;
      }
      .sidebar-card:nth-child(3) {
        animation-delay: 0.4s;
      }

      .sidebar-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .card-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-lg);
        font-size: 1.125rem;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .sidebar-card:hover .card-icon {
        transform: scale(1.1) rotate(5deg);
      }

      .card-icon.trophy {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }

      .card-icon.fire {
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        color: white;
      }

      .card-icon.stats {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }

      .card-header h3 {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0;
      }

      /* Leaderboard */
      .leaderboard-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .leaderboard-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--radius-xl);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      }

      .leaderboard-item:hover {
        background: var(--ds-primary-green-subtle);
        transform: translateX(4px);
      }

      .leaderboard-item.top-rank {
        background: var(--surface-secondary);
      }

      .rank {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-muted);
        transition: transform 0.2s ease;
      }

      .leaderboard-item:hover .rank {
        transform: scale(1.2);
      }

      .rank.rank-1 {
        color: #fbbf24;
      }

      .rank.rank-2 {
        color: #94a3b8;
      }

      .rank.rank-3 {
        color: #cd7c2f;
      }

      .rank i {
        font-size: 1rem;
      }

      .player-info {
        flex: 1;
        min-width: 0;
      }

      .player-name {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .player-score {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
      }

      .rank-badge {
        font-size: 1.25rem;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .leaderboard-item:hover .rank-badge {
        transform: scale(1.2) rotate(10deg);
      }

      .view-all-btn {
        width: 100%;
        padding: var(--space-3);
        margin-top: var(--space-3);
        background: var(--surface-secondary);
        border: none;
        border-radius: var(--radius-lg);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--ds-primary-green);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .view-all-btn:hover {
        background: var(--ds-primary-green);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.25);
      }

      .view-all-btn:active {
        transform: translateY(0) scale(0.98);
      }

      /* Trending Topics */
      .topics-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .topic-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .topic-item:hover {
        background: var(--ds-primary-green-subtle);
        transform: translateX(4px);
      }

      .topic-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .topic-hashtag {
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--ds-primary-green);
        transition: color 0.2s ease;
      }

      .topic-item:hover .topic-hashtag {
        color: var(--ds-primary-green-hover);
      }

      .topic-count {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
      }

      .topic-trend {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(34, 197, 94, 0.1);
        border-radius: var(--radius-full);
        color: #22c55e;
        font-size: 0.75rem;
        transition: all 0.2s ease;
      }

      .topic-item:hover .topic-trend {
        background: var(--ds-primary-green);
        color: white;
        transform: translateY(-2px);
      }

      /* Active topic state */
      .topic-item.active {
        background: var(--ds-primary-green);
        transform: translateX(4px);
      }

      .topic-item.active .topic-hashtag {
        color: white;
      }

      .topic-item.active .topic-count {
        color: rgba(255, 255, 255, 0.8);
      }

      .topic-item.active .topic-trend {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      /* Clear filter button */
      .clear-filter-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        width: 100%;
        padding: var(--space-2) var(--space-3);
        margin-top: var(--space-3);
        background: transparent;
        border: 1px dashed var(--color-border-primary);
        border-radius: var(--radius-lg);
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .clear-filter-btn:hover {
        background: var(--surface-secondary);
        border-color: var(--color-text-muted);
        color: var(--color-text-primary);
      }

      /* Filter Banner */
      .filter-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-4);
        background: var(--ds-primary-green-subtle);
        border-radius: var(--radius-xl);
        border: 1px solid var(--ds-primary-green);
        animation: slideUp 0.3s ease-out;
      }

      .filter-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--ds-primary-green);
        font-size: var(--font-body-sm);
      }

      .filter-info i {
        font-size: 1rem;
      }

      .filter-info strong {
        font-weight: var(--font-weight-semibold);
      }

      .clear-btn {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-1) var(--space-3);
        background: white;
        border: 1px solid var(--ds-primary-green);
        border-radius: var(--radius-full);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-medium);
        color: var(--ds-primary-green);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .clear-btn:hover {
        background: var(--ds-primary-green);
        color: white;
      }

      .clear-btn i {
        font-size: 0.75rem;
      }

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        background: var(--surface-primary);
        border-radius: var(--radius-2xl);
        border: 2px dashed var(--color-border-primary);
        text-align: center;
        animation: fadeIn 0.3s ease-out;
      }

      .empty-icon {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-secondary);
        border-radius: var(--radius-full);
        margin-bottom: var(--space-4);
      }

      .empty-icon i {
        font-size: 2rem;
        color: var(--color-text-muted);
      }

      .empty-state h3 {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-2) 0;
      }

      .empty-state p {
        font-size: var(--font-body-md);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-4) 0;
      }

      .empty-state p strong {
        color: var(--ds-primary-green);
      }

      /* Quick Stats */
      .quick-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-3);
      }

      .stat-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-3);
        background: var(--surface-secondary);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .stat-box:hover {
        background: var(--ds-primary-green-subtle);
        transform: translateY(-4px);
      }

      .stat-number {
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        transition: all 0.2s ease;
      }

      .stat-box:hover .stat-number {
        color: var(--ds-primary-green);
        transform: scale(1.1);
      }

      .stat-label {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
      }

      /* ============================================
         RESPONSIVE
         ============================================ */

      @media (max-width: 768px) {
        .community-page {
          padding: var(--space-4);
        }

        .community-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }

        .header-actions {
          width: 100%;
        }

        .header-actions p-button {
          flex: 1;
        }

        /* On mobile, show icon-only buttons that expand on tap */
        .media-btn {
          padding: var(--space-2);
          min-width: 40px;
        }

        .media-btn span {
          max-width: 0;
          opacity: 0;
          margin-left: 0;
        }

        .action-btn span {
          display: none;
        }

        .action-btn {
          flex: 0;
          padding: var(--space-3);
        }
      }

      /* ============================================
         POLL & LOCATION DIALOG STYLES
         ============================================ */

      :host ::ng-deep .poll-dialog,
      :host ::ng-deep .location-dialog {
        .p-dialog-header {
          padding: var(--space-5);
          border-bottom: 1px solid var(--color-border-primary);
        }

        .p-dialog-content {
          padding: var(--space-5);
        }

        .p-dialog-footer {
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--color-border-primary);
        }
      }

      .poll-form,
      .location-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-field label {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .poll-input,
      .location-input {
        width: 100%;
        padding: var(--space-3) var(--space-4) !important;
        border-radius: var(--radius-lg) !important;
        border: 1px solid var(--color-border-primary) !important;
        font-size: var(--font-body-md) !important;
        transition: all 0.2s ease !important;
      }

      .poll-input:focus,
      .location-input:focus {
        border-color: var(--ds-primary-green) !important;
        box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.1) !important;
      }

      .option-row {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .option-row input {
        flex: 1;
      }

      .remove-option-btn {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-secondary);
        border: none;
        border-radius: var(--radius-lg);
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .remove-option-btn:hover {
        background: var(--color-status-error-light);
        color: var(--color-status-error);
      }

      .add-option-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        width: 100%;
        padding: var(--space-3);
        margin-top: var(--space-2);
        background: var(--ds-primary-green-subtle);
        border: 1px dashed var(--ds-primary-green);
        border-radius: var(--radius-lg);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--ds-primary-green);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .add-option-btn:hover {
        background: var(--ds-primary-green);
        color: white;
        border-style: solid;
      }
    `,
  ],
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
    posts: 12,
    likes: 156,
    comments: 43,
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
    const colors = [
      "#089949",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#06b6d4",
      "#6366f1",
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
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
    // Load posts with proper structure
    this.posts.set([
      {
        id: "1",
        author: "Coach Mike Thompson",
        authorInitials: "MT",
        authorRole: "Head Coach",
        timeAgo: "2 hours ago",
        location: "Training Field",
        content:
          "Great practice session today! I'm seeing incredible improvement in everyone's route running. The precision passing drill really paid off. Keep up the momentum team! 💪🏈",
        likes: 24,
        comments: 8,
        shares: 3,
        isLiked: false,
        isBookmarked: false,
        showComments: false,
        commentsList: [
          {
            id: "c1",
            author: "Sarah Chen",
            authorInitials: "SC",
            content:
              "Couldn't agree more! My timing felt perfect today. Ready for game day! 🙌",
            timeAgo: "1 hour ago",
            likes: 5,
          },
          {
            id: "c2",
            author: "Jake Williams",
            authorInitials: "JW",
            content: "Those drills were intense but worth it! 💪",
            timeAgo: "45 min ago",
            likes: 3,
          },
        ],
        newComment: "",
      },
      {
        id: "2",
        author: "Alex Rodriguez",
        authorInitials: "AR",
        authorRole: "Team Captain",
        timeAgo: "4 hours ago",
        location: "Championship Arena",
        content:
          "What an incredible weekend! Our team played phenomenally and took home the championship trophy. 🏆 Special thanks to everyone who supported us. This is just the beginning!",
        likes: 87,
        comments: 23,
        shares: 12,
        isLiked: true,
        isBookmarked: true,
        showComments: false,
        commentsList: [
          {
            id: "c3",
            author: "Coach Mike Thompson",
            authorInitials: "MT",
            content: "So proud of this team! You all earned this victory!",
            timeAgo: "3 hours ago",
            likes: 12,
          },
        ],
        newComment: "",
      },
      {
        id: "3",
        author: "Emma Davis",
        authorInitials: "ED",
        timeAgo: "6 hours ago",
        content:
          "Just finished my morning training routine. Anyone else doing early morning sessions? Would love to find a training partner! 🌅🏃‍♀️",
        likes: 15,
        comments: 7,
        shares: 2,
        isLiked: false,
        isBookmarked: false,
        showComments: false,
        commentsList: [],
        newComment: "",
      },
    ]);

    // Load leaderboard
    this.leaderboard.set([
      { rank: 1, name: "Alex Rodriguez", initials: "AR", score: 1250 },
      { rank: 2, name: "Sarah Chen", initials: "SC", score: 1180 },
      { rank: 3, name: "Mike Thompson", initials: "MT", score: 1120 },
      { rank: 4, name: "Jake Williams", initials: "JW", score: 980 },
      { rank: 5, name: "Emma Davis", initials: "ED", score: 925 },
    ]);

    // Load trending topics
    this.trendingTopics.set([
      { name: "TrainingTips", count: 45 },
      { name: "Tournament2026", count: 32 },
      { name: "FlagFootball", count: 28 },
      { name: "GameDay", count: 19 },
    ]);
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
