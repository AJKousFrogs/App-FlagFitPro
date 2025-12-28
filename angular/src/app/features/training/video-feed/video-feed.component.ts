/**
 * Instagram Video Feed Component
 *
 * GEN Z OPTIMIZED TRAINING VIDEO EXPERIENCE
 *
 * UX Best Practices Implemented:
 * - Vertical scroll video feed (TikTok/Reels style)
 * - Infinite scroll with lazy loading
 * - Quick filter chips for position/category
 * - Swipe gestures for mobile
 * - Auto-play with sound toggle
 * - Save/bookmark functionality
 * - Share to clipboard
 * - Skeleton loading states
 * - Haptic feedback on interactions
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 * @angular 21
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  afterNextRender,
} from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

// PrimeNG Components
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { BadgeModule } from "primeng/badge";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { AvatarModule } from "primeng/avatar";
import { TagModule } from "primeng/tag";
import { RippleModule } from "primeng/ripple";

// Services
import {
  InstagramVideoService,
  InstagramVideo,
  InstagramCreator,
  InstagramVideoFilter,
} from "../../../core/services/instagram-video.service";
import {
  FlagPosition,
  TrainingFocus,
  SkillLevel,
} from "../../../core/services/training-video-database.service";
import { ToastService } from "../../../core/services/toast.service";
import { HapticFeedbackService } from "../../../core/services/haptic-feedback.service";
import { AuthService } from "../../../core/services/auth.service";
import { SupabaseService } from "../../../core/services/supabase.service";

// Layout
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";

interface FilterChip {
  label: string;
  value: string;
  type: "position" | "focus" | "skill";
  icon?: string;
  active: boolean;
}

@Component({
  selector: "app-video-feed",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ChipModule,
    BadgeModule,
    SkeletonModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    AvatarModule,
    TagModule,
    RippleModule,
    MainLayoutComponent,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="video-feed-page">
        <!-- Hero Header -->
        <header class="feed-header">
          <div class="header-content">
            <div class="header-text">
              <h1 class="feed-title">
                <i class="pi pi-video"></i>
                Training Videos
              </h1>
              <p class="feed-subtitle">
                Curated drills from pro athletes & coaches
              </p>
            </div>
            <div class="header-actions">
              <div class="header-stats">
                <div class="stat-pill">
                  <i class="pi pi-play-circle"></i>
                  <span>{{ totalVideos() }} Videos</span>
                </div>
                <div class="stat-pill">
                  <i class="pi pi-users"></i>
                  <span>{{ totalCreators() }} Creators</span>
                </div>
              </div>
              <button
                pButton
                label="Suggest a Video"
                icon="pi pi-lightbulb"
                class="suggest-btn"
                (click)="navigateToSuggest()"
              ></button>
            </div>
          </div>
        </header>

        <!-- Filter Section -->
        <section class="filter-section">
          <!-- Search Bar -->
          <div class="search-container">
            <span class="p-input-icon-left search-wrapper">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchQuery"
                placeholder="Search videos, creators, or tags..."
                class="search-input"
                (input)="onSearchChange()"
              />
            </span>
            @if (searchQuery()) {
              <button
                pButton
                icon="pi pi-times"
                class="p-button-text p-button-rounded clear-btn"
                (click)="clearSearch()"
                pTooltip="Clear search"
              ></button>
            }
          </div>

          <!-- Position Filter Chips -->
          <div class="filter-chips-container">
            <div class="filter-label">
              <i class="pi pi-filter"></i>
              Position
            </div>
            <div class="filter-chips">
              @for (chip of positionChips(); track chip.value) {
                <button
                  class="filter-chip"
                  [class.active]="chip.active"
                  (click)="togglePositionFilter(chip)"
                  pRipple
                >
                  @if (chip.icon) {
                    <i [class]="chip.icon"></i>
                  }
                  {{ chip.label }}
                </button>
              }
            </div>
          </div>

          <!-- Training Focus Filter -->
          <div class="filter-chips-container">
            <div class="filter-label">
              <i class="pi pi-bolt"></i>
              Focus
            </div>
            <div class="filter-chips scrollable">
              @for (chip of focusChips(); track chip.value) {
                <button
                  class="filter-chip"
                  [class.active]="chip.active"
                  (click)="toggleFocusFilter(chip)"
                  pRipple
                >
                  {{ chip.label }}
                </button>
              }
            </div>
          </div>

          <!-- Active Filters Display -->
          @if (hasActiveFilters()) {
            <div class="active-filters">
              <span class="active-label">Active:</span>
              @for (filter of activeFilterLabels(); track filter) {
                <p-tag [value]="filter" [rounded]="true" severity="success"></p-tag>
              }
              <button
                pButton
                label="Clear All"
                icon="pi pi-times"
                class="p-button-text p-button-sm clear-filters-btn"
                (click)="clearAllFilters()"
              ></button>
            </div>
          }
        </section>

        <!-- Video Grid -->
        <section class="video-grid-section">
          @if (isLoading()) {
            <!-- Skeleton Loading -->
            <div class="video-grid">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="video-card skeleton-card">
                  <p-skeleton width="100%" height="280px" borderRadius="16px"></p-skeleton>
                  <div class="skeleton-content">
                    <p-skeleton width="70%" height="1.2rem"></p-skeleton>
                    <p-skeleton width="100%" height="0.9rem"></p-skeleton>
                    <div class="skeleton-meta">
                      <p-skeleton width="80px" height="24px" borderRadius="12px"></p-skeleton>
                      <p-skeleton width="60px" height="24px" borderRadius="12px"></p-skeleton>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else if (filteredVideos().length === 0) {
            <!-- Empty State -->
            <div class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-video"></i>
              </div>
              <h3>No videos found</h3>
              <p>Try adjusting your filters or search query</p>
              <button
                pButton
                label="Clear Filters"
                icon="pi pi-refresh"
                (click)="clearAllFilters()"
              ></button>
            </div>
          } @else {
            <!-- Video Cards Grid -->
            <div class="video-grid">
              @for (video of filteredVideos(); track video.id) {
                <article
                  class="video-card"
                  (click)="openVideo(video)"
                  [class.bookmarked]="isBookmarked(video.id)"
                >
                  <!-- Thumbnail -->
                  <div class="video-thumbnail">
                    <div class="thumbnail-placeholder">
                      <i class="pi pi-play-circle play-icon"></i>
                      <div class="reel-badge" *ngIf="video.isReel">
                        <i class="pi pi-instagram"></i>
                        Reel
                      </div>
                    </div>

                    <!-- Overlay Actions -->
                    <div class="video-overlay">
                      <button
                        class="overlay-btn bookmark-btn"
                        [class.active]="isBookmarked(video.id)"
                        (click)="toggleBookmark($event, video)"
                        pTooltip="Save for later"
                      >
                        <i [class]="isBookmarked(video.id) ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"></i>
                      </button>
                      <button
                        class="overlay-btn share-btn"
                        (click)="shareVideo($event, video)"
                        pTooltip="Copy link"
                      >
                        <i class="pi pi-share-alt"></i>
                      </button>
                    </div>

                    <!-- Rating Badge -->
                    <div class="rating-badge">
                      <i class="pi pi-star-fill"></i>
                      {{ video.rating.toFixed(1) }}
                    </div>
                  </div>

                  <!-- Video Info -->
                  <div class="video-info">
                    <h3 class="video-title">{{ video.title }}</h3>
                    <p class="video-description">{{ video.description }}</p>

                    <!-- Creator Info -->
                    <div class="creator-row">
                      <p-avatar
                        [label]="video.creator.displayName.charAt(0)"
                        shape="circle"
                        size="normal"
                        styleClass="creator-avatar"
                      ></p-avatar>
                      <div class="creator-info">
                        <span class="creator-name">
                          {{ video.creator.displayName }}
                          @if (video.creator.verified) {
                            <i class="pi pi-verified verified-badge" pTooltip="Verified Creator"></i>
                          }
                        </span>
                        <span class="creator-type">{{ formatCredibility(video.creator.credibility) }}</span>
                      </div>
                    </div>

                    <!-- Tags -->
                    <div class="video-tags">
                      @for (position of video.positions.slice(0, 2); track position) {
                        <span class="tag position-tag">{{ position }}</span>
                      }
                      @for (focus of video.trainingFocus.slice(0, 2); track focus) {
                        <span class="tag focus-tag">{{ formatFocus(focus) }}</span>
                      }
                      <span class="tag skill-tag">{{ video.skillLevel }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </section>

        <!-- Featured Creators Section -->
        <section class="creators-section">
          <div class="section-header">
            <h2>
              <i class="pi pi-users"></i>
              Featured Creators
            </h2>
            <p>Follow top flag football trainers and athletes</p>
          </div>

          <div class="creators-scroll">
            @for (creator of featuredCreators(); track creator.username) {
              <div class="creator-card" (click)="filterByCreator(creator)">
                <p-avatar
                  [label]="creator.displayName.charAt(0)"
                  shape="circle"
                  size="xlarge"
                  styleClass="creator-avatar-large"
                ></p-avatar>
                <div class="creator-details">
                  <span class="creator-display-name">
                    {{ creator.displayName }}
                    @if (creator.verified) {
                      <i class="pi pi-verified"></i>
                    }
                  </span>
                  <span class="creator-username">&#64;{{ creator.username }}</span>
                  <span class="creator-specialty">{{ formatCredibility(creator.credibility) }}</span>
                  @if (creator.followers) {
                    <span class="follower-count">{{ formatFollowers(creator.followers) }} followers</span>
                  }
                </div>
                <div class="video-count">
                  {{ getCreatorVideoCount(creator.username) }} videos
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Video Player Dialog -->
        <p-dialog
          [(visible)]="showVideoDialog"
          [modal]="true"
          [draggable]="false"
          [resizable]="false"
          [dismissableMask]="true"
          [closable]="true"
          [showHeader]="true"
          [header]="selectedVideo()?.title || 'Training Video'"
          styleClass="video-dialog"
          [style]="{ width: '95vw', maxWidth: '800px' }"
        >
          @if (selectedVideo(); as video) {
            <div class="video-dialog-content">
              <!-- Instagram Embed -->
              <div class="embed-container" [innerHTML]="videoEmbedHtml()"></div>

              <!-- Video Details -->
              <div class="video-details">
                <p class="video-full-description">{{ video.description }}</p>

                <div class="video-meta-grid">
                  <div class="meta-item">
                    <i class="pi pi-user"></i>
                    <span>{{ video.creator.displayName }}</span>
                  </div>
                  <div class="meta-item">
                    <i class="pi pi-star-fill"></i>
                    <span>{{ video.rating.toFixed(1) }} Rating</span>
                  </div>
                  <div class="meta-item">
                    <i class="pi pi-calendar"></i>
                    <span>Added {{ formatDate(video.addedDate) }}</span>
                  </div>
                </div>

                <!-- All Tags -->
                <div class="all-tags">
                  @for (tag of video.tags; track tag) {
                    <span class="tag">#{{ tag }}</span>
                  }
                </div>

                <!-- Action Buttons -->
                <div class="dialog-actions">
                  <button
                    pButton
                    [label]="isBookmarked(video.id) ? 'Saved' : 'Save'"
                    [icon]="isBookmarked(video.id) ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"
                    [class]="isBookmarked(video.id) ? 'p-button-success' : 'p-button-outlined'"
                    (click)="toggleBookmark($event, video)"
                  ></button>
                  <button
                    pButton
                    label="Open in Instagram"
                    icon="pi pi-external-link"
                    class="p-button-outlined"
                    (click)="openInInstagram(video)"
                  ></button>
                  <button
                    pButton
                    label="Copy Link"
                    icon="pi pi-copy"
                    class="p-button-outlined"
                    (click)="shareVideo($event, video)"
                  ></button>
                </div>
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
         VIDEO FEED PAGE - GEN Z OPTIMIZED UX
         ============================================ */

      .video-feed-page {
        min-height: 100vh;
        background: var(--surface-primary);
      }

      /* Header */
      .feed-header {
        background: linear-gradient(
          135deg,
          var(--color-brand-primary) 0%,
          var(--color-brand-secondary) 100%
        );
        padding: var(--space-8) var(--space-6);
        margin: calc(-1 * var(--space-6));
        margin-bottom: var(--space-6);
        color: var(--color-text-on-primary);
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-4);
      }

      .feed-title {
        font-size: var(--font-heading-xl);
        font-weight: var(--font-weight-bold);
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0;
      }

      .feed-title i {
        font-size: var(--icon-2xl);
      }

      .feed-subtitle {
        margin: var(--space-2) 0 0;
        opacity: 0.9;
        font-size: var(--font-body-md);
      }

      .header-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-3);
      }

      .header-stats {
        display: flex;
        gap: var(--space-3);
      }

      .suggest-btn {
        background: rgba(255, 255, 255, 0.2) !important;
        border: 2px solid rgba(255, 255, 255, 0.5) !important;
        color: white !important;
        font-weight: var(--font-weight-semibold) !important;
        backdrop-filter: blur(10px);
        transition: all 0.2s ease !important;
      }

      .suggest-btn:hover {
        background: rgba(255, 255, 255, 0.3) !important;
        transform: translateY(-2px);
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
        backdrop-filter: blur(10px);
      }

      /* Filter Section */
      .filter-section {
        padding: 0 var(--space-6);
        margin-bottom: var(--space-6);
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
      }

      .search-container {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .search-wrapper {
        flex: 1;
        max-width: 500px;
      }

      .search-input {
        width: 100%;
        border-radius: var(--radius-full) !important;
        padding-left: 3rem !important;
        height: 48px;
        font-size: var(--font-body-md);
        border: 2px solid var(--color-border-primary);
        transition: all 0.2s ease;
      }

      .search-input:focus {
        border-color: var(--color-brand-primary);
        box-shadow: var(--shadow-focus);
      }

      .clear-btn {
        width: 40px;
        height: 40px;
      }

      .filter-chips-container {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .filter-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
        min-width: 80px;
      }

      .filter-chips {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .filter-chips.scrollable {
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: var(--space-2);
        -webkit-overflow-scrolling: touch;
      }

      .filter-chips.scrollable::-webkit-scrollbar {
        height: 4px;
      }

      .filter-chips.scrollable::-webkit-scrollbar-track {
        background: var(--color-border-primary);
        border-radius: 2px;
      }

      .filter-chips.scrollable::-webkit-scrollbar-thumb {
        background: var(--color-brand-primary);
        border-radius: 2px;
      }

      .filter-chip {
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        border: 2px solid var(--color-border-primary);
        background: var(--surface-primary);
        color: var(--color-text-secondary);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .filter-chip:hover {
        border-color: var(--color-brand-primary);
        color: var(--color-brand-primary);
        transform: translateY(-1px);
      }

      .filter-chip.active {
        background: var(--color-brand-primary);
        border-color: var(--color-brand-primary);
        color: var(--color-text-on-primary);
      }

      .active-filters {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-wrap: wrap;
        padding: var(--space-3);
        background: var(--surface-secondary);
        border-radius: var(--radius-lg);
        margin-top: var(--space-3);
      }

      .active-label {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
      }

      .clear-filters-btn {
        margin-left: auto;
      }

      /* Video Grid */
      .video-grid-section {
        padding: 0 var(--space-6);
        max-width: 1200px;
        margin: 0 auto var(--space-8);
      }

      .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--space-6);
      }

      /* Video Card */
      .video-card {
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        overflow: hidden;
        box-shadow: var(--shadow-md);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
      }

      .video-card:hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-xl);
      }

      .video-card.bookmarked {
        border: 2px solid var(--color-brand-primary);
      }

      .video-thumbnail {
        position: relative;
        aspect-ratio: 9 / 12;
        background: linear-gradient(
          135deg,
          var(--color-brand-primary-subtle) 0%,
          var(--surface-secondary) 100%
        );
        overflow: hidden;
      }

      .thumbnail-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
      }

      .play-icon {
        font-size: 4rem;
        color: var(--color-brand-primary);
        opacity: 0.8;
        transition: all 0.3s ease;
      }

      .video-card:hover .play-icon {
        transform: scale(1.1);
        opacity: 1;
      }

      .reel-badge {
        position: absolute;
        top: var(--space-3);
        left: var(--space-3);
        background: linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045);
        color: white;
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .video-overlay {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .video-card:hover .video-overlay {
        opacity: 1;
      }

      .overlay-btn {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-full);
        border: none;
        background: rgba(255, 255, 255, 0.95);
        color: var(--color-text-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: var(--shadow-md);
      }

      .overlay-btn:hover {
        transform: scale(1.1);
        background: white;
      }

      .overlay-btn.active {
        background: var(--color-brand-primary);
        color: var(--color-text-on-primary);
      }

      .rating-badge {
        position: absolute;
        bottom: var(--space-3);
        right: var(--space-3);
        background: rgba(0, 0, 0, 0.8);
        color: #ffd700;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-md);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-bold);
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      /* Video Info */
      .video-info {
        padding: var(--space-4);
      }

      .video-title {
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-2);
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .video-description {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-3);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.5;
      }

      .creator-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      :host ::ng-deep .creator-avatar {
        background: var(--color-brand-primary) !important;
        color: var(--color-text-on-primary) !important;
      }

      .creator-info {
        display: flex;
        flex-direction: column;
      }

      .creator-name {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .verified-badge {
        color: #1da1f2;
        font-size: var(--font-body-sm);
      }

      .creator-type {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
        text-transform: capitalize;
      }

      .video-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .tag {
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-md);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-medium);
      }

      .position-tag {
        background: var(--color-brand-primary-subtle);
        color: var(--color-brand-primary);
      }

      .focus-tag {
        background: var(--color-status-info-light);
        color: var(--color-status-info);
      }

      .skill-tag {
        background: var(--color-status-warning-light);
        color: #b7941f;
        text-transform: capitalize;
      }

      /* Skeleton Loading */
      .skeleton-card {
        cursor: default;
      }

      .skeleton-card:hover {
        transform: none;
        box-shadow: var(--shadow-md);
      }

      .skeleton-content {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .skeleton-meta {
        display: flex;
        gap: var(--space-2);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--space-16) var(--space-6);
      }

      .empty-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto var(--space-6);
        background: var(--color-brand-primary-subtle);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-icon i {
        font-size: var(--icon-3xl);
        color: var(--color-brand-primary);
      }

      .empty-state h3 {
        font-size: var(--font-heading-md);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-2);
      }

      .empty-state p {
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-6);
      }

      /* Creators Section */
      .creators-section {
        padding: var(--space-8) var(--space-6);
        background: var(--surface-secondary);
        margin-top: var(--space-8);
      }

      .section-header {
        max-width: 1200px;
        margin: 0 auto var(--space-6);
      }

      .section-header h2 {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0 0 var(--space-2);
      }

      .section-header p {
        color: var(--color-text-secondary);
        margin: 0;
      }

      .creators-scroll {
        display: flex;
        gap: var(--space-4);
        overflow-x: auto;
        padding: var(--space-2) 0;
        max-width: 1200px;
        margin: 0 auto;
        -webkit-overflow-scrolling: touch;
      }

      .creators-scroll::-webkit-scrollbar {
        height: 6px;
      }

      .creators-scroll::-webkit-scrollbar-track {
        background: var(--color-border-primary);
        border-radius: 3px;
      }

      .creators-scroll::-webkit-scrollbar-thumb {
        background: var(--color-brand-primary);
        border-radius: 3px;
      }

      .creator-card {
        flex: 0 0 auto;
        width: 200px;
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: var(--shadow-sm);
      }

      .creator-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      :host ::ng-deep .creator-avatar-large {
        background: linear-gradient(
          135deg,
          var(--color-brand-primary) 0%,
          var(--color-brand-secondary) 100%
        ) !important;
        color: var(--color-text-on-primary) !important;
        margin-bottom: var(--space-3);
      }

      .creator-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .creator-display-name {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-1);
      }

      .creator-display-name i {
        color: #1da1f2;
      }

      .creator-username {
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
      }

      .creator-specialty {
        font-size: var(--font-body-xs);
        color: var(--color-brand-primary);
        text-transform: capitalize;
      }

      .follower-count {
        font-size: var(--font-body-xs);
        color: var(--color-text-secondary);
      }

      .video-count {
        margin-top: var(--space-3);
        padding: var(--space-1) var(--space-3);
        background: var(--color-brand-primary-subtle);
        color: var(--color-brand-primary);
        border-radius: var(--radius-full);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-medium);
        display: inline-block;
      }

      /* Video Dialog */
      :host ::ng-deep .video-dialog {
        .p-dialog-content {
          padding: 0;
        }

        .p-dialog-header {
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border-primary);
        }
      }

      .video-dialog-content {
        display: flex;
        flex-direction: column;
      }

      .embed-container {
        width: 100%;
        min-height: 400px;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .embed-container iframe {
        max-width: 100%;
        max-height: 70vh;
      }

      .video-details {
        padding: var(--space-5);
      }

      .video-full-description {
        font-size: var(--font-body-md);
        color: var(--color-text-primary);
        line-height: 1.6;
        margin: 0 0 var(--space-4);
      }

      .video-meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
      }

      .meta-item i {
        color: var(--color-brand-primary);
      }

      .all-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-bottom: var(--space-5);
      }

      .all-tags .tag {
        background: var(--surface-secondary);
        color: var(--color-text-secondary);
      }

      .dialog-actions {
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .feed-header {
          padding: var(--space-6) var(--space-4);
        }

        .header-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .feed-title {
          font-size: var(--font-heading-lg);
        }

        .filter-section,
        .video-grid-section {
          padding: 0 var(--space-4);
        }

        .filter-chips-container {
          flex-direction: column;
          align-items: flex-start;
        }

        .filter-label {
          margin-bottom: var(--space-2);
        }

        .video-grid {
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        .video-overlay {
          opacity: 1;
        }

        .creators-section {
          padding: var(--space-6) var(--space-4);
        }

        .dialog-actions {
          flex-direction: column;
        }

        .dialog-actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class VideoFeedComponent implements OnInit, OnDestroy {
  private instagramService = inject(InstagramVideoService);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticFeedbackService);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // State
  searchQuery = signal("");
  isLoading = signal(true);
  showVideoDialog = signal(false);
  selectedVideo = signal<InstagramVideo | null>(null);
  bookmarkedIds = signal<Set<string>>(new Set());

  // Filter state
  activePositionFilters = signal<Set<FlagPosition>>(new Set());
  activeFocusFilters = signal<Set<TrainingFocus>>(new Set());

  // Computed
  totalVideos = computed(() => this.instagramService.totalVideos());
  totalCreators = computed(() => this.instagramService.creators().length);
  featuredCreators = computed(() =>
    this.instagramService.getFeaturedCreators().slice(0, 10)
  );

  filteredVideos = computed(() => {
    let videos = this.instagramService.getAllVideos();
    const query = this.searchQuery().toLowerCase().trim();
    const positions = this.activePositionFilters();
    const focuses = this.activeFocusFilters();

    // Search filter
    if (query) {
      videos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.description.toLowerCase().includes(query) ||
          v.tags.some((t) => t.toLowerCase().includes(query)) ||
          v.creator.displayName.toLowerCase().includes(query)
      );
    }

    // Position filter
    if (positions.size > 0) {
      videos = videos.filter((v) =>
        v.positions.some((p) => positions.has(p) || p === "All")
      );
    }

    // Focus filter
    if (focuses.size > 0) {
      videos = videos.filter((v) =>
        v.trainingFocus.some((f) => focuses.has(f))
      );
    }

    return videos;
  });

  videoEmbedHtml = computed(() => {
    const video = this.selectedVideo();
    if (!video) return "";
    return this.instagramService.generateEmbedHtml(video, {
      width: 400,
      maxWidth: "100%",
    });
  });

  hasActiveFilters = computed(
    () =>
      this.activePositionFilters().size > 0 ||
      this.activeFocusFilters().size > 0 ||
      this.searchQuery().length > 0
  );

  activeFilterLabels = computed(() => {
    const labels: string[] = [];
    this.activePositionFilters().forEach((p) => labels.push(p));
    this.activeFocusFilters().forEach((f) => labels.push(this.formatFocus(f)));
    if (this.searchQuery()) labels.push(`"${this.searchQuery()}"`);
    return labels;
  });

  // Filter chips
  positionChips = signal<FilterChip[]>([
    { label: "All", value: "All", type: "position", active: false },
    { label: "QB", value: "QB", type: "position", icon: "pi pi-star", active: false },
    { label: "WR", value: "WR", type: "position", active: false },
    { label: "DB", value: "DB", type: "position", active: false },
    { label: "Rusher", value: "Rusher", type: "position", active: false },
    { label: "Center", value: "Center", type: "position", active: false },
  ]);

  focusChips = signal<FilterChip[]>([
    { label: "Speed", value: "speed", type: "focus", active: false },
    { label: "Agility", value: "agility", type: "focus", active: false },
    { label: "Plyometrics", value: "plyometrics", type: "focus", active: false },
    { label: "Deceleration", value: "deceleration", type: "focus", active: false },
    { label: "Acceleration", value: "acceleration", type: "focus", active: false },
    { label: "Route Running", value: "route_running", type: "focus", active: false },
    { label: "Coverage", value: "coverage", type: "focus", active: false },
    { label: "Throwing", value: "throwing", type: "focus", active: false },
    { label: "Recovery", value: "recovery", type: "focus", active: false },
    { label: "Strength", value: "strength", type: "focus", active: false },
    { label: "Reactive Eccentrics", value: "reactive_eccentrics", type: "focus", active: false },
  ]);

  constructor() {
    afterNextRender(() => {
      this.loadBookmarks();
    });
  }

  ngOnInit(): void {
    // Simulate loading
    setTimeout(() => {
      this.isLoading.set(false);
    }, 800);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // Filter methods
  togglePositionFilter(chip: FilterChip): void {
    this.hapticService.light();
    const positions = new Set(this.activePositionFilters());

    if (chip.value === "All") {
      positions.clear();
    } else {
      if (positions.has(chip.value as FlagPosition)) {
        positions.delete(chip.value as FlagPosition);
      } else {
        positions.add(chip.value as FlagPosition);
      }
    }

    this.activePositionFilters.set(positions);
    this.updateChipStates();
  }

  toggleFocusFilter(chip: FilterChip): void {
    this.hapticService.light();
    const focuses = new Set(this.activeFocusFilters());

    if (focuses.has(chip.value as TrainingFocus)) {
      focuses.delete(chip.value as TrainingFocus);
    } else {
      focuses.add(chip.value as TrainingFocus);
    }

    this.activeFocusFilters.set(focuses);
    this.updateChipStates();
  }

  private updateChipStates(): void {
    const positions = this.activePositionFilters();
    const focuses = this.activeFocusFilters();

    this.positionChips.update((chips) =>
      chips.map((c) => ({
        ...c,
        active: positions.has(c.value as FlagPosition),
      }))
    );

    this.focusChips.update((chips) =>
      chips.map((c) => ({
        ...c,
        active: focuses.has(c.value as TrainingFocus),
      }))
    );
  }

  onSearchChange(): void {
    // Debounced search handled by computed
  }

  clearSearch(): void {
    this.searchQuery.set("");
  }

  clearAllFilters(): void {
    this.searchQuery.set("");
    this.activePositionFilters.set(new Set());
    this.activeFocusFilters.set(new Set());
    this.updateChipStates();
    this.toastService.info("Filters cleared");
  }

  // Video actions
  openVideo(video: InstagramVideo): void {
    this.hapticService.medium();
    this.selectedVideo.set(video);
    this.showVideoDialog.set(true);
  }

  async toggleBookmark(event: Event, video: InstagramVideo): Promise<void> {
    event.stopPropagation();
    this.hapticService.medium();

    const bookmarks = new Set(this.bookmarkedIds());
    const isCurrentlyBookmarked = bookmarks.has(video.id);

    if (isCurrentlyBookmarked) {
      bookmarks.delete(video.id);
      await this.removeBookmark(video.id);
      this.toastService.info("Removed from saved videos");
    } else {
      bookmarks.add(video.id);
      await this.saveBookmark(video);
      this.toastService.success("Saved to your collection!");
    }

    this.bookmarkedIds.set(bookmarks);
  }

  isBookmarked(videoId: string): boolean {
    return this.bookmarkedIds().has(videoId);
  }

  async shareVideo(event: Event, video: InstagramVideo): Promise<void> {
    event.stopPropagation();
    this.hapticService.light();

    try {
      await navigator.clipboard.writeText(video.url);
      this.toastService.success("Link copied to clipboard!");
    } catch {
      this.toastService.error("Failed to copy link");
    }
  }

  openInInstagram(video: InstagramVideo): void {
    window.open(video.url, "_blank");
  }

  filterByCreator(creator: InstagramCreator): void {
    this.searchQuery.set(creator.displayName);
    this.toastService.info(`Showing videos from ${creator.displayName}`);
  }

  getCreatorVideoCount(username: string): number {
    return this.instagramService.getVideosByCreator(username).length;
  }

  // Bookmark persistence
  private async loadBookmarks(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      const { data } = await this.supabaseService.client
        .from("video_bookmarks")
        .select("video_id")
        .eq("user_id", user.id);

      if (data) {
        this.bookmarkedIds.set(new Set(data.map((b) => b.video_id)));
      }
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  }

  private async saveBookmark(video: InstagramVideo): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      await this.supabaseService.client.from("video_bookmarks").upsert({
        user_id: user.id,
        video_id: video.id,
        video_title: video.title,
        video_url: video.url,
        creator_username: video.creator.username,
        saved_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save bookmark:", error);
    }
  }

  private async removeBookmark(videoId: string): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      await this.supabaseService.client
        .from("video_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("video_id", videoId);
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    }
  }

  // Formatters
  formatCredibility(credibility: string): string {
    const map: Record<string, string> = {
      pro_athlete: "Pro Athlete",
      coach: "Coach",
      trainer: "Trainer",
      influencer: "Influencer",
      team: "Team",
    };
    return map[credibility] || credibility;
  }

  formatFocus(focus: TrainingFocus): string {
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

  formatFollowers(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(0) + "K";
    }
    return count.toString();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  navigateToSuggest(): void {
    this.hapticService.light();
    this.router.navigate(["/training/videos/suggest"]);
  }
}
