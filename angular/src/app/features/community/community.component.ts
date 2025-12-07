import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextarea } from "primeng/inputtextarea";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";

interface Post {
  id: string;
  author: string;
  authorInitials: string;
  timeAgo: string;
  location?: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  showComments?: boolean;
  commentsList?: Comment[];
}

interface Comment {
  author: string;
  authorInitials: string;
  content: string;
  timeAgo: string;
}

@Component({
  selector: "app-community",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextarea,
    AvatarModule,
    BadgeModule,
    MainLayoutComponent,
    PageHeaderComponent
],
  template: `
    <app-main-layout>
      <div class="community-page">
        <app-page-header
          title="Community Hub"
          subtitle="Connect with the flag football community"
          >
          <p-button
            label="Create Post"
            icon="pi pi-plus"
            (onClick)="scrollToCreatePost()"
          ></p-button>
        </app-page-header>
    
        <div class="community-grid">
          <!-- Feed Container -->
          <div class="feed-container">
            <!-- Create Post -->
            <p-card class="create-post-card">
              <textarea
                pInputTextarea
                [(ngModel)]="newPostContent"
                placeholder="What's on your mind? Share your latest training, game highlights, or tips with the community..."
                rows="4"
                [autoResize]="true"
                class="post-input"
                >
              </textarea>
              <div class="post-actions">
                <div class="post-options">
                  <p-button
                    icon="pi pi-image"
                    [text]="true"
                    label="Photo"
                  ></p-button>
                  <p-button
                    icon="pi pi-video"
                    [text]="true"
                    label="Video"
                  ></p-button>
                  <p-button
                    icon="pi pi-chart-bar"
                    [text]="true"
                    label="Poll"
                  ></p-button>
                </div>
                <p-button
                  label="Post"
                  (onClick)="createPost()"
                  [disabled]="!newPostContent.trim()"
                ></p-button>
              </div>
            </p-card>
    
            <!-- Posts Feed -->
            <div class="posts-feed">
              @for (post of posts(); track trackByPostId($index, post)) {
                <p-card
                  class="post-card"
                  >
                  <div class="post-header">
                    <p-avatar
                      [label]="post.authorInitials"
                      styleClass="mr-2"
                      shape="circle"
                    ></p-avatar>
                    <div class="post-info">
                      <div class="post-author">{{ post.author }}</div>
                      <div class="post-meta">
                        {{ post.timeAgo }}
                        @if (post.location) {
                          <span>
                            • <i class="pi pi-map-marker"></i>
                            {{ post.location }}</span
                            >
                          }
                        </div>
                      </div>
                    </div>
                    <div class="post-content">
                      <p class="post-text">{{ post.content }}</p>
                    </div>
                    <div class="post-engagement">
                      <div class="engagement-stats">
                        <span
                          ><i class="pi pi-thumbs-up"></i>
                          {{ post.likes }} likes</span
                          >
                          <span
                            ><i class="pi pi-comments"></i>
                            {{ post.comments }} comments</span
                            >
                            <span
                              ><i class="pi pi-share-alt"></i>
                              {{ post.shares }} shares</span
                              >
                            </div>
                            <div class="engagement-actions">
                              <p-button
                                [icon]="post.isLiked ? 'pi pi-heart' : 'pi pi-heart'"
                                [text]="true"
                                [label]="post.isLiked ? 'Liked' : 'Like'"
                                [class.liked]="post.isLiked"
                                (onClick)="toggleLike(post)"
                                >
                              </p-button>
                              <p-button
                                icon="pi pi-comments"
                                [text]="true"
                                label="Comment"
                                (onClick)="toggleComments(post)"
                                >
                              </p-button>
                              <p-button
                                icon="pi pi-share-alt"
                                [text]="true"
                                label="Share"
                                >
                              </p-button>
                            </div>
                          </div>
                          @if (post.showComments && post.commentsList) {
                            <div
                              class="comments-section"
                              >
                              @for (
                                comment of post.commentsList; track trackByCommentAuthor($index,
                                comment)) {
                                <div
                                  class="comment"
                                  >
                                  <p-avatar
                                    [label]="comment.authorInitials"
                                    styleClass="mr-2"
                                    shape="circle"
                                  ></p-avatar>
                                  <div class="comment-content">
                                    <div class="comment-author">{{ comment.author }}</div>
                                    <div class="comment-text">{{ comment.content }}</div>
                                    <div class="comment-time">{{ comment.timeAgo }}</div>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </p-card>
                      }
                    </div>
                  </div>
    
                  <!-- Sidebar -->
                  <div class="sidebar-content">
                    <!-- Leaderboard -->
                    <p-card class="sidebar-card">
                      <ng-template pTemplate="header">
                        <h3 class="section-title">
                          <i class="pi pi-trophy"></i>
                          Leaderboard
                        </h3>
                      </ng-template>
                      <div class="leaderboard-list">
                        @for (
                          entry of leaderboard(); track trackByLeaderboardRank($index,
                          entry)) {
                          <div
                            class="leaderboard-item"
                            >
                            <div class="rank">{{ entry.rank }}</div>
                            <p-avatar
                              [label]="entry.initials"
                              styleClass="mr-2"
                              shape="circle"
                            ></p-avatar>
                            <div class="leaderboard-info">
                              <div class="leaderboard-name">{{ entry.name }}</div>
                              <div class="leaderboard-score">
                                {{ entry.score }} points
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    </p-card>
    
                    <!-- Trending Topics -->
                    <p-card class="sidebar-card">
                      <ng-template pTemplate="header">
                        <h3 class="section-title">
                          <i class="pi pi-fire"></i>
                          Trending Topics
                        </h3>
                      </ng-template>
                      <div class="topics-list">
                        @for (
                          topic of trendingTopics(); track trackByTopicName($index,
                          topic)) {
                          <div
                            class="topic-item"
                            >
                            <span class="topic-name">#{{ topic.name }}</span>
                            <span class="topic-count">{{ topic.count }} posts</span>
                          </div>
                        }
                      </div>
                    </p-card>
                  </div>
                </div>
              </div>
            </app-main-layout>
    `,
  styles: [
    `
      .community-page {
        padding: var(--space-6);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
      }

      .page-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .community-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--space-6);
      }

      .create-post-card {
        margin-bottom: var(--space-6);
      }

      .post-input {
        width: 100%;
        margin-bottom: var(--space-4);
      }

      .post-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .post-options {
        display: flex;
        gap: var(--space-2);
      }

      .posts-feed {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .post-card {
        transition: box-shadow 0.2s;
      }

      .post-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .post-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .post-info {
        flex: 1;
      }

      .post-author {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .post-meta {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .post-content {
        margin-bottom: var(--space-4);
      }

      .post-text {
        color: var(--text-primary);
        line-height: 1.6;
        margin: 0;
      }

      .post-engagement {
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .engagement-stats {
        display: flex;
        gap: var(--space-4);
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .engagement-actions {
        display: flex;
        gap: var(--space-2);
      }

      .engagement-actions .p-button.liked {
        color: var(--color-warning);
      }

      .comments-section {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .comment {
        display: flex;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .comment-content {
        flex: 1;
      }

      .comment-author {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .comment-text {
        font-size: 0.875rem;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .comment-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .sidebar-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .sidebar-card {
        height: fit-content;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .leaderboard-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .leaderboard-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .rank {
        width: 24px;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .leaderboard-info {
        flex: 1;
      }

      .leaderboard-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .leaderboard-score {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .topics-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .topic-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-2);
        border-radius: var(--p-border-radius);
        transition: background 0.2s;
      }

      .topic-item:hover {
        background: var(--p-surface-50);
      }

      .topic-name {
        font-weight: 600;
        color: var(--color-brand-primary);
      }

      .topic-count {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      @media (max-width: 1024px) {
        .community-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CommunityComponent implements OnInit {
  private apiService = inject(ApiService);

  newPostContent = "";
  posts = signal<Post[]>([]);
  leaderboard = signal<any[]>([]);
  trendingTopics = signal<any[]>([]);

  ngOnInit(): void {
    this.loadCommunityData();
  }

  loadCommunityData(): void {
    // Load posts
    this.posts.set([
      {
        id: "1",
        author: "Coach Mike Thompson",
        authorInitials: "CM",
        timeAgo: "2 hours ago",
        location: "Training Field",
        content:
          "Great practice session today! I'm seeing incredible improvement in everyone's route running. The precision passing drill really paid off. Keep up the momentum team!",
        likes: 24,
        comments: 8,
        shares: 3,
        isLiked: false,
        showComments: false,
        commentsList: [
          {
            author: "Sarah Chen",
            authorInitials: "SC",
            content: "Couldn't agree more! My timing felt perfect today.",
            timeAgo: "1 hour ago",
          },
        ],
      },
      {
        id: "2",
        author: "Alex Rodriguez",
        authorInitials: "AR",
        timeAgo: "4 hours ago",
        location: "Tournament Victory",
        content:
          "What an incredible weekend! Our team played phenomenally and took home the championship trophy. Special thanks to everyone who supported us.",
        likes: 87,
        comments: 23,
        shares: 12,
        isLiked: true,
        showComments: false,
      },
    ]);

    // Load leaderboard
    this.leaderboard.set([
      { rank: 1, name: "Alex Rodriguez", initials: "AR", score: 1250 },
      { rank: 2, name: "Sarah Chen", initials: "SC", score: 1180 },
      { rank: 3, name: "Mike Thompson", initials: "MT", score: 1120 },
    ]);

    // Load trending topics
    this.trendingTopics.set([
      { name: "TrainingTips", count: 45 },
      { name: "Tournament2026", count: 32 },
      { name: "FlagFootball", count: 28 },
    ]);
  }

  scrollToCreatePost(): void {
    // Scroll to create post section
    const element = document.querySelector(".create-post-card");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  createPost(): void {
    if (!this.newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: "You",
      authorInitials: "U",
      timeAgo: "Just now",
      content: this.newPostContent,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      showComments: false,
    };

    this.apiService
      .post(API_ENDPOINTS.community.createPost, newPost)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.posts.update((posts) => [newPost, ...posts]);
          this.newPostContent = "";
        },
        error: () => {
          // Error handled by error interceptor
        },
      });
  }

  toggleLike(post: Post): void {
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;
  }

  toggleComments(post: Post): void {
    post.showComments = !post.showComments;
    if (post.showComments && !post.commentsList) {
      // Load comments
      post.commentsList = [];
    }
  }

  trackByPostId(index: number, post: Post): string {
    return post.id;
  }

  trackByCommentAuthor(index: number, comment: Comment): string {
    return comment.author + comment.timeAgo;
  }

  trackByLeaderboardRank(index: number, entry: any): number {
    return entry.rank;
  }

  trackByTopicName(index: number, topic: any): string {
    return topic.name;
  }
}
