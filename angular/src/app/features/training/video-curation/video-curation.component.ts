/**
 * Video Curation Component
 *
 * COACH/ADMIN CONTENT CURATION DASHBOARD
 *
 * Allows coaches to:
 * - Review and approve/reject videos for their team
 * - Create curated playlists for specific positions
 * - Assign videos to training sessions
 * - Track which videos athletes have watched
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
import { FormsModule } from "@angular/forms";

// PrimeNG Components
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { SelectModule } from "primeng/select";
import { MultiSelectModule } from "primeng/multiselect";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { TabsModule } from "primeng/tabs";
import { BadgeModule } from "primeng/badge";
import { TooltipModule } from "primeng/tooltip";
import { ProgressBarModule } from "primeng/progressbar";
import { AvatarModule } from "primeng/avatar";
import { ChipModule } from "primeng/chip";

// Services
import {
  InstagramVideoService,
  InstagramVideo,
  InstagramPlaylist,
} from "../../../core/services/instagram-video.service";
import {
  FlagPosition,
  TrainingFocus,
} from "../../../core/services/training-video-database.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthService } from "../../../core/services/auth.service";
import { SupabaseService } from "../../../core/services/supabase.service";

// Layout
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";

interface CuratedVideo extends InstagramVideo {
  status: "pending" | "approved" | "rejected";
  assignedPositions: FlagPosition[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface PlayerSuggestion {
  id: string;
  instagram_url: string;
  shortcode: string;
  title: string;
  description: string;
  why_valuable?: string;
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

interface PlaylistForm {
  name: string;
  description: string;
  position: FlagPosition | null;
  focus: TrainingFocus[];
  videoIds: string[];
}

@Component({
  selector: "app-video-curation",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,
    BadgeModule,
    TooltipModule,
    ProgressBarModule,
    AvatarModule,
    ChipModule,
    MainLayoutComponent,
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <app-main-layout>
      <div class="curation-page">
        <!-- Header -->
        <header class="page-header">
          <div class="header-content">
            <div class="header-text">
              <h1>
                <i class="pi pi-sliders-h"></i>
                Video Curation
              </h1>
              <p>Manage and curate training videos for your team</p>
            </div>
            <div class="header-actions">
              <button
                pButton
                label="Create Playlist"
                icon="pi pi-plus"
                (click)="openPlaylistDialog()"
              ></button>
            </div>
          </div>
        </header>

        <!-- Stats Overview -->
        <section class="stats-section">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-video"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ totalVideos() }}</span>
                <span class="stat-label">Total Videos</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon approved">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ approvedCount() }}</span>
                <span class="stat-label">Approved</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon pending">
                <i class="pi pi-clock"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ pendingCount() }}</span>
                <span class="stat-label">Pending Review</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-list"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ playlists().length }}</span>
                <span class="stat-label">Playlists</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Tabs -->
          <p-tabs [(value)]="activeTab">
          <p-tablist>
            <p-tab value="videos">
              <i class="pi pi-video"></i>
              All Videos
              <p-badge [value]="totalVideos().toString()" severity="info"></p-badge>
            </p-tab>
            <p-tab value="suggestions">
              <i class="pi pi-lightbulb"></i>
              Player Suggestions
              <p-badge [value]="playerSuggestionsCount().toString()" severity="warn"></p-badge>
            </p-tab>
            <p-tab value="pending">
              <i class="pi pi-clock"></i>
              Pending Review
              <p-badge [value]="pendingCount().toString()" severity="warn"></p-badge>
            </p-tab>
            <p-tab value="playlists">
              <i class="pi pi-list"></i>
              Playlists
              <p-badge [value]="playlists().length.toString()"></p-badge>
            </p-tab>
            <p-tab value="analytics">
              <i class="pi pi-chart-bar"></i>
              Analytics
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- All Videos Tab -->
            <p-tabpanel value="videos">
              <div class="tab-content">
                <!-- Filters -->
                <div class="table-filters">
                  <span class="p-input-icon-left">
                    <i class="pi pi-search"></i>
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="videoSearch"
                      placeholder="Search videos..."
                      class="filter-input"
                    />
                  </span>
                  <p-select
                    [(ngModel)]="positionFilter"
                    [options]="positionOptions"
                    placeholder="All Positions"
                    [showClear]="true"
                    styleClass="filter-select"
                  ></p-select>
                  <p-select
                    [(ngModel)]="statusFilter"
                    [options]="statusOptions"
                    placeholder="All Statuses"
                    [showClear]="true"
                    styleClass="filter-select"
                  ></p-select>
                </div>

                <!-- Videos Table -->
                <p-table
                  [value]="filteredVideos()"
                  [paginator]="true"
                  [rows]="10"
                  [showCurrentPageReport]="true"
                  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} videos"
                  [rowsPerPageOptions]="[10, 25, 50]"
                  styleClass="p-datatable-sm"
                >
                  <ng-template pTemplate="header">
                    <tr>
                      <th style="width: 50px"></th>
                      <th pSortableColumn="title">
                        Title <p-sortIcon field="title"></p-sortIcon>
                      </th>
                      <th>Creator</th>
                      <th>Positions</th>
                      <th>Focus</th>
                      <th pSortableColumn="rating">
                        Rating <p-sortIcon field="rating"></p-sortIcon>
                      </th>
                      <th>Status</th>
                      <th style="width: 150px">Actions</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-video>
                    <tr>
                      <td>
                        <p-avatar
                          icon="pi pi-play"
                          shape="circle"
                          styleClass="video-avatar"
                        ></p-avatar>
                      </td>
                      <td>
                        <div class="video-title-cell">
                          <span class="title">{{ video.title }}</span>
                          <span class="subtitle">{{ video.description | slice:0:50 }}...</span>
                        </div>
                      </td>
                      <td>
                        <div class="creator-cell">
                          <span class="creator-name">{{ video.creator.displayName }}</span>
                          @if (video.creator.verified) {
                            <i class="pi pi-verified verified-icon"></i>
                          }
                        </div>
                      </td>
                      <td>
                        <div class="tags-cell">
                          @for (pos of video.positions.slice(0, 2); track pos) {
                            <p-tag [value]="pos" severity="info"></p-tag>
                          }
                          @if (video.positions.length > 2) {
                            <span class="more-tag">+{{ video.positions.length - 2 }}</span>
                          }
                        </div>
                      </td>
                      <td>
                        <div class="tags-cell">
                          @for (focus of video.trainingFocus.slice(0, 2); track focus) {
                            <p-tag [value]="formatFocus(focus)" severity="success"></p-tag>
                          }
                        </div>
                      </td>
                      <td>
                        <div class="rating-cell">
                          <i class="pi pi-star-fill"></i>
                          {{ video.rating.toFixed(1) }}
                        </div>
                      </td>
                      <td>
                        <p-tag
                          [value]="getVideoStatus(video.id)"
                          [severity]="getStatusSeverity(getVideoStatus(video.id))"
                        ></p-tag>
                      </td>
                      <td>
                        <div class="action-buttons">
                          <button
                            pButton
                            icon="pi pi-eye"
                            class="p-button-text p-button-rounded"
                            pTooltip="Preview"
                            (click)="openPreview(video)"
                          ></button>
                          @if (getVideoStatus(video.id) !== 'approved') {
                            <button
                              pButton
                              icon="pi pi-check"
                              class="p-button-text p-button-rounded p-button-success"
                              pTooltip="Approve"
                              (click)="approveVideo(video)"
                            ></button>
                          }
                          @if (getVideoStatus(video.id) !== 'rejected') {
                            <button
                              pButton
                              icon="pi pi-times"
                              class="p-button-text p-button-rounded p-button-danger"
                              pTooltip="Reject"
                              (click)="rejectVideo(video)"
                            ></button>
                          }
                          <button
                            pButton
                            icon="pi pi-plus"
                            class="p-button-text p-button-rounded"
                            pTooltip="Add to Playlist"
                            (click)="addToPlaylist(video)"
                          ></button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="8" class="empty-message">
                        <i class="pi pi-inbox"></i>
                        <span>No videos found</span>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </p-tabpanel>

            <!-- Player Suggestions Tab -->
            <p-tabpanel value="suggestions">
              <div class="tab-content">
                <div class="suggestions-header">
                  <h3>Player Video Suggestions</h3>
                  <p>Review videos suggested by your team members</p>
                </div>

                @if (playerSuggestions().length === 0) {
                  <div class="empty-state">
                    <i class="pi pi-lightbulb"></i>
                    <h3>No suggestions yet</h3>
                    <p>When players suggest videos, they'll appear here for review</p>
                  </div>
                } @else {
                  <div class="suggestions-grid">
                    @for (suggestion of playerSuggestions(); track suggestion.id) {
                      <div class="suggestion-review-card">
                        <div class="suggestion-thumbnail">
                          <i class="pi pi-play-circle"></i>
                          <div class="instagram-badge">
                            <i class="pi pi-instagram"></i>
                          </div>
                        </div>
                        <div class="suggestion-content">
                          <div class="suggestion-header">
                            <h4>{{ suggestion.title }}</h4>
                            <p-tag 
                              [value]="suggestion.status" 
                              [severity]="getStatusSeverity(suggestion.status)"
                            ></p-tag>
                          </div>
                          <p class="suggestion-desc">{{ suggestion.description }}</p>
                          
                          @if (suggestion.why_valuable) {
                            <div class="value-note">
                              <strong>Why it's valuable:</strong>
                              <p>{{ suggestion.why_valuable }}</p>
                            </div>
                          }
                          
                          <div class="suggestion-meta">
                            <span>
                              <i class="pi pi-user"></i>
                              {{ suggestion.submitted_by_name }}
                            </span>
                            <span>
                              <i class="pi pi-calendar"></i>
                              {{ formatSuggestionDate(suggestion.submitted_at) }}
                            </span>
                          </div>
                          
                          <div class="suggestion-tags">
                            @for (pos of suggestion.positions; track pos) {
                              <p-tag [value]="pos" severity="info"></p-tag>
                            }
                            @for (focus of suggestion.training_focus?.slice(0, 2); track focus) {
                              <p-tag [value]="formatFocus(focus)" severity="success"></p-tag>
                            }
                          </div>
                        </div>
                        <div class="suggestion-actions">
                          <button
                            pButton
                            icon="pi pi-external-link"
                            class="p-button-text p-button-rounded"
                            pTooltip="Open in Instagram"
                            (click)="openSuggestionInInstagram(suggestion)"
                          ></button>
                          @if (suggestion.status === 'pending') {
                            <button
                              pButton
                              label="Approve"
                              icon="pi pi-check"
                              class="p-button-success p-button-sm"
                              (click)="approveSuggestion(suggestion)"
                            ></button>
                            <button
                              pButton
                              label="Reject"
                              icon="pi pi-times"
                              class="p-button-outlined p-button-danger p-button-sm"
                              (click)="rejectSuggestion(suggestion)"
                            ></button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </p-tabpanel>

            <!-- Pending Review Tab -->
            <p-tabpanel value="pending">
              <div class="tab-content">
                @if (pendingVideos().length === 0) {
                  <div class="empty-state">
                    <i class="pi pi-check-circle"></i>
                    <h3>All caught up!</h3>
                    <p>No videos pending review</p>
                  </div>
                } @else {
                  <div class="pending-grid">
                    @for (video of pendingVideos(); track video.id) {
                      <div class="pending-card">
                        <div class="pending-thumbnail">
                          <i class="pi pi-play-circle"></i>
                        </div>
                        <div class="pending-content">
                          <h4>{{ video.title }}</h4>
                          <p>{{ video.description }}</p>
                          <div class="pending-meta">
                            <span>
                              <i class="pi pi-user"></i>
                              {{ video.creator.displayName }}
                            </span>
                            <span>
                              <i class="pi pi-star-fill"></i>
                              {{ video.rating.toFixed(1) }}
                            </span>
                          </div>
                          <div class="pending-tags">
                            @for (pos of video.positions; track pos) {
                              <p-tag [value]="pos" severity="info"></p-tag>
                            }
                          </div>
                        </div>
                        <div class="pending-actions">
                          <button
                            pButton
                            label="Approve"
                            icon="pi pi-check"
                            class="p-button-success"
                            (click)="approveVideo(video)"
                          ></button>
                          <button
                            pButton
                            label="Reject"
                            icon="pi pi-times"
                            class="p-button-outlined p-button-danger"
                            (click)="rejectVideo(video)"
                          ></button>
                          <button
                            pButton
                            label="Preview"
                            icon="pi pi-eye"
                            class="p-button-text"
                            (click)="openPreview(video)"
                          ></button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </p-tabpanel>

            <!-- Playlists Tab -->
            <p-tabpanel value="playlists">
              <div class="tab-content">
                <div class="playlists-header">
                  <h3>Your Playlists</h3>
                  <button
                    pButton
                    label="Create Playlist"
                    icon="pi pi-plus"
                    (click)="openPlaylistDialog()"
                  ></button>
                </div>

                @if (playlists().length === 0) {
                  <div class="empty-state">
                    <i class="pi pi-list"></i>
                    <h3>No playlists yet</h3>
                    <p>Create your first playlist to organize training videos</p>
                    <button
                      pButton
                      label="Create Playlist"
                      icon="pi pi-plus"
                      (click)="openPlaylistDialog()"
                    ></button>
                  </div>
                } @else {
                  <div class="playlists-grid">
                    @for (playlist of playlists(); track playlist.id) {
                      <div class="playlist-card">
                        <div class="playlist-header">
                          <h4>{{ playlist.name }}</h4>
                          @if (playlist.position) {
                            <p-tag [value]="playlist.position" severity="info"></p-tag>
                          }
                        </div>
                        <p class="playlist-description">{{ playlist.description }}</p>
                        <div class="playlist-stats">
                          <span>
                            <i class="pi pi-video"></i>
                            {{ playlist.videos.length }} videos
                          </span>
                          <span>
                            <i class="pi pi-clock"></i>
                            {{ formatDuration(playlist.totalDuration) }}
                          </span>
                        </div>
                        <div class="playlist-focus">
                          @for (focus of playlist.focus; track focus) {
                            <p-chip [label]="formatFocus(focus)"></p-chip>
                          }
                        </div>
                        <div class="playlist-actions">
                          <button
                            pButton
                            icon="pi pi-pencil"
                            class="p-button-text p-button-rounded"
                            pTooltip="Edit"
                            (click)="editPlaylist(playlist)"
                          ></button>
                          <button
                            pButton
                            icon="pi pi-share-alt"
                            class="p-button-text p-button-rounded"
                            pTooltip="Share with team"
                            (click)="sharePlaylist(playlist)"
                          ></button>
                          <button
                            pButton
                            icon="pi pi-trash"
                            class="p-button-text p-button-rounded p-button-danger"
                            pTooltip="Delete"
                            (click)="deletePlaylist(playlist)"
                          ></button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </p-tabpanel>

            <!-- Analytics Tab -->
            <p-tabpanel value="analytics">
              <div class="tab-content">
                <div class="analytics-grid">
                  <!-- Most Viewed Videos -->
                  <p-card header="Top Videos by Position">
                    <div class="analytics-list">
                      @for (stat of videosByPosition(); track stat.position) {
                        <div class="analytics-item">
                          <span class="analytics-label">{{ stat.position }}</span>
                          <p-progressBar
                            [value]="stat.percentage"
                            [showValue]="false"
                            styleClass="analytics-bar"
                          ></p-progressBar>
                          <span class="analytics-value">{{ stat.count }}</span>
                        </div>
                      }
                    </div>
                  </p-card>

                  <!-- Videos by Focus -->
                  <p-card header="Videos by Training Focus">
                    <div class="analytics-list">
                      @for (stat of videosByFocus(); track stat.focus) {
                        <div class="analytics-item">
                          <span class="analytics-label">{{ formatFocus(stat.focus) }}</span>
                          <p-progressBar
                            [value]="stat.percentage"
                            [showValue]="false"
                            styleClass="analytics-bar"
                          ></p-progressBar>
                          <span class="analytics-value">{{ stat.count }}</span>
                        </div>
                      }
                    </div>
                  </p-card>

                  <!-- Creator Stats -->
                  <p-card header="Top Creators">
                    <div class="creator-stats-list">
                      @for (creator of topCreators(); track creator.username) {
                        <div class="creator-stat-item">
                          <p-avatar
                            [label]="creator.displayName.charAt(0)"
                            shape="circle"
                            styleClass="creator-stat-avatar"
                          ></p-avatar>
                          <div class="creator-stat-info">
                            <span class="creator-stat-name">
                              {{ creator.displayName }}
                              @if (creator.verified) {
                                <i class="pi pi-verified"></i>
                              }
                            </span>
                            <span class="creator-stat-count">{{ creator.videoCount }} videos</span>
                          </div>
                        </div>
                      }
                    </div>
                  </p-card>
                </div>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>

        <!-- Create Playlist Dialog -->
        <p-dialog
          [(visible)]="showPlaylistDialog"
          [modal]="true"
          [draggable]="false"
          header="Create Playlist"
          [style]="{ width: '500px' }"
        >
          <div class="playlist-form">
            <div class="form-field">
              <label for="playlistName">Playlist Name</label>
              <input
                id="playlistName"
                type="text"
                pInputText
                [(ngModel)]="playlistForm.name"
                placeholder="e.g., QB Pre-Game Drills"
              />
            </div>

            <div class="form-field">
              <label for="playlistDescription">Description</label>
              <textarea
                id="playlistDescription"
                pTextarea
                [(ngModel)]="playlistForm.description"
                [rows]="3"
                placeholder="Describe this playlist..."
              ></textarea>
            </div>

            <div class="form-field">
              <label for="playlistPosition">Target Position</label>
              <p-select
                id="playlistPosition"
                [(ngModel)]="playlistForm.position"
                [options]="positionOptions"
                placeholder="Select position (optional)"
                [showClear]="true"
              ></p-select>
            </div>

            <div class="form-field">
              <label for="playlistFocus">Training Focus</label>
              <p-multiselect
                id="playlistFocus"
                [(ngModel)]="playlistForm.focus"
                [options]="focusOptions"
                placeholder="Select focus areas"
                [maxSelectedLabels]="3"
              ></p-multiselect>
            </div>

            <div class="form-field">
              <label>Select Videos</label>
              <p-multiselect
                [(ngModel)]="playlistForm.videoIds"
                [options]="videoOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Add videos to playlist"
                [filter]="true"
                filterPlaceholder="Search videos..."
                [maxSelectedLabels]="5"
              ></p-multiselect>
            </div>
          </div>

          <ng-template pTemplate="footer">
            <button
              pButton
              label="Cancel"
              class="p-button-text"
              (click)="closePlaylistDialog()"
            ></button>
            <button
              pButton
              label="Create Playlist"
              icon="pi pi-check"
              (click)="createPlaylist()"
              [disabled]="!playlistForm.name || playlistForm.videoIds.length === 0"
            ></button>
          </ng-template>
        </p-dialog>

        <!-- Video Preview Dialog -->
        <p-dialog
          [(visible)]="showPreviewDialog"
          [modal]="true"
          [draggable]="false"
          [header]="previewVideo()?.title || 'Video Preview'"
          [style]="{ width: '90vw', maxWidth: '800px' }"
        >
          @if (previewVideo(); as video) {
            <div class="preview-content">
              <div class="preview-embed" [innerHTML]="previewEmbedHtml()"></div>
              <div class="preview-details">
                <p>{{ video.description }}</p>
                <div class="preview-meta">
                  <span><i class="pi pi-user"></i> {{ video.creator.displayName }}</span>
                  <span><i class="pi pi-star-fill"></i> {{ video.rating.toFixed(1) }}</span>
                  <span><i class="pi pi-calendar"></i> {{ video.addedDate }}</span>
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
      .curation-page {
        min-height: 100vh;
        background: var(--surface-primary);
        padding: var(--space-6);
      }

      /* Header */
      .page-header {
        margin-bottom: var(--space-6);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-4);
      }

      .header-text h1 {
        font-size: var(--font-heading-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0 0 var(--space-2);
      }

      .header-text p {
        color: var(--color-text-secondary);
        margin: 0;
      }

      /* Stats Section */
      .stats-section {
        margin-bottom: var(--space-6);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .stat-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg);
        background: var(--color-brand-primary-subtle);
        color: var(--color-brand-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--icon-xl);
      }

      .stat-icon.approved {
        background: var(--color-status-success-light);
        color: var(--color-status-success);
      }

      .stat-icon.pending {
        background: var(--color-status-warning-light);
        color: var(--color-status-warning);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .stat-label {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
      }

      /* Tabs */
      :host ::ng-deep .p-tabs {
        .p-tablist {
          background: var(--surface-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-2);
          margin-bottom: var(--space-4);
        }

        .p-tab {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
      }

      .tab-content {
        padding: var(--space-4) 0;
      }

      /* Table Filters */
      .table-filters {
        display: flex;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
        flex-wrap: wrap;
      }

      .filter-input {
        min-width: 250px;
      }

      :host ::ng-deep .filter-select {
        min-width: 150px;
      }

      /* Table Cells */
      .video-title-cell {
        display: flex;
        flex-direction: column;
      }

      .video-title-cell .title {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .video-title-cell .subtitle {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
      }

      .creator-cell {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .verified-icon {
        color: #1da1f2;
        font-size: var(--font-body-sm);
      }

      .tags-cell {
        display: flex;
        gap: var(--space-1);
        flex-wrap: wrap;
      }

      .more-tag {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
      }

      .rating-cell {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        color: #ffd700;
        font-weight: var(--font-weight-semibold);
      }

      .action-buttons {
        display: flex;
        gap: var(--space-1);
      }

      :host ::ng-deep .video-avatar {
        background: var(--color-brand-primary) !important;
        color: var(--color-text-on-primary) !important;
      }

      .empty-message {
        text-align: center;
        padding: var(--space-8);
        color: var(--color-text-muted);

        i {
          font-size: var(--icon-3xl);
          margin-bottom: var(--space-3);
          display: block;
        }
      }

      /* Pending Cards */
      .pending-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--space-4);
      }

      .pending-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        overflow: hidden;
      }

      .pending-thumbnail {
        height: 150px;
        background: linear-gradient(
          135deg,
          var(--color-brand-primary-subtle) 0%,
          var(--surface-secondary) 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 3rem;
          color: var(--color-brand-primary);
        }
      }

      .pending-content {
        padding: var(--space-4);

        h4 {
          font-size: var(--font-body-lg);
          font-weight: var(--font-weight-semibold);
          margin: 0 0 var(--space-2);
          color: var(--color-text-primary);
        }

        p {
          font-size: var(--font-body-sm);
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-3);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .pending-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
        margin-bottom: var(--space-3);

        span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .pi-star-fill {
          color: #ffd700;
        }
      }

      .pending-tags {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .pending-actions {
        padding: var(--space-4);
        border-top: 1px solid var(--color-border-primary);
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      /* Playlists */
      .playlists-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);

        h3 {
          font-size: var(--font-heading-md);
          font-weight: var(--font-weight-semibold);
          margin: 0;
        }
      }

      .playlists-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-4);
      }

      .playlist-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
      }

      .playlist-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-3);

        h4 {
          font-size: var(--font-body-lg);
          font-weight: var(--font-weight-semibold);
          margin: 0;
          color: var(--color-text-primary);
        }
      }

      .playlist-description {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-3);
      }

      .playlist-stats {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
        margin-bottom: var(--space-3);

        span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
      }

      .playlist-focus {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        margin-bottom: var(--space-4);
      }

      .playlist-actions {
        display: flex;
        gap: var(--space-1);
        justify-content: flex-end;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--space-12);

        i {
          font-size: 4rem;
          color: var(--color-brand-primary);
          opacity: 0.5;
          margin-bottom: var(--space-4);
        }

        h3 {
          font-size: var(--font-heading-md);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-2);
        }

        p {
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-4);
        }
      }

      /* Analytics */
      .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: var(--space-4);
      }

      .analytics-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .analytics-item {
        display: grid;
        grid-template-columns: 100px 1fr 40px;
        align-items: center;
        gap: var(--space-3);
      }

      .analytics-label {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
      }

      :host ::ng-deep .analytics-bar {
        height: 8px;
        border-radius: 4px;

        .p-progressbar-value {
          background: var(--color-brand-primary);
        }
      }

      .analytics-value {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        text-align: right;
      }

      .creator-stats-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .creator-stat-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2);
        border-radius: var(--radius-md);
        transition: background 0.2s;

        &:hover {
          background: var(--surface-secondary);
        }
      }

      :host ::ng-deep .creator-stat-avatar {
        background: var(--color-brand-primary) !important;
        color: var(--color-text-on-primary) !important;
      }

      .creator-stat-info {
        display: flex;
        flex-direction: column;
      }

      .creator-stat-name {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-1);

        i {
          color: #1da1f2;
        }
      }

      .creator-stat-count {
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
      }

      /* Playlist Form */
      .playlist-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);

        label {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }
      }

      /* Preview Dialog */
      .preview-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .preview-embed {
        min-height: 400px;
        background: #000;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .preview-details {
        p {
          color: var(--color-text-primary);
          margin: 0 0 var(--space-3);
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

        .pi-star-fill {
          color: #ffd700;
        }
      }

      /* Player Suggestions */
      .suggestions-header {
        margin-bottom: var(--space-4);

        h3 {
          font-size: var(--font-heading-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-1);
        }

        p {
          color: var(--color-text-secondary);
          margin: 0;
        }
      }

      .suggestions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: var(--space-4);
      }

      .suggestion-review-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .suggestion-thumbnail {
        height: 120px;
        background: linear-gradient(
          135deg,
          #833ab4 0%,
          #fd1d1d 50%,
          #fcb045 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        i {
          font-size: 2.5rem;
          color: white;
        }
      }

      .instagram-badge {
        position: absolute;
        top: var(--space-2);
        left: var(--space-2);
        background: rgba(0, 0, 0, 0.6);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-md);
        color: white;
        font-size: var(--font-body-xs);
      }

      .suggestion-content {
        padding: var(--space-4);
        flex: 1;
      }

      .suggestion-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-2);

        h4 {
          font-size: var(--font-body-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0;
        }
      }

      .suggestion-desc {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-3);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .value-note {
        padding: var(--space-3);
        background: var(--color-brand-primary-subtle);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-3);

        strong {
          font-size: var(--font-body-xs);
          color: var(--color-brand-primary);
        }

        p {
          font-size: var(--font-body-sm);
          color: var(--color-text-secondary);
          margin: var(--space-1) 0 0;
        }
      }

      .suggestion-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
        margin-bottom: var(--space-3);

        span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
      }

      .suggestion-tags {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .suggestion-actions {
        padding: var(--space-3) var(--space-4);
        border-top: 1px solid var(--color-border-primary);
        display: flex;
        gap: var(--space-2);
        justify-content: flex-end;
        align-items: center;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .curation-page {
          padding: var(--space-4);
        }

        .header-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .table-filters {
          flex-direction: column;
        }

        .filter-input {
          width: 100%;
        }

        .pending-grid,
        .playlists-grid,
        .analytics-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class VideoCurationComponent implements OnInit {
  private instagramService = inject(InstagramVideoService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);

  // State
  activeTab = signal("videos");
  videoSearch = signal("");
  positionFilter = signal<FlagPosition | null>(null);
  statusFilter = signal<string | null>(null);

  showPlaylistDialog = signal(false);
  showPreviewDialog = signal(false);
  previewVideo = signal<InstagramVideo | null>(null);

  videoStatuses = signal<Map<string, "pending" | "approved" | "rejected">>(new Map());
  playlists = signal<InstagramPlaylist[]>([]);
  playerSuggestions = signal<PlayerSuggestion[]>([]);

  playlistForm: PlaylistForm = {
    name: "",
    description: "",
    position: null,
    focus: [],
    videoIds: [],
  };

  // Options
  positionOptions = [
    { label: "All", value: "All" },
    { label: "Quarterback", value: "QB" },
    { label: "Wide Receiver", value: "WR" },
    { label: "Defensive Back", value: "DB" },
    { label: "Rusher", value: "Rusher" },
    { label: "Center", value: "Center" },
  ];

  statusOptions = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
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
    { label: "Recovery", value: "recovery" },
    { label: "Strength", value: "strength" },
  ];

  // Computed
  totalVideos = computed(() => this.instagramService.totalVideos());

  approvedCount = computed(() => {
    let count = 0;
    this.videoStatuses().forEach((status) => {
      if (status === "approved") count++;
    });
    return count;
  });

  pendingCount = computed(() => {
    const allVideos = this.instagramService.getAllVideos();
    const statuses = this.videoStatuses();
    return allVideos.filter((v) => {
      const status = statuses.get(v.id);
      return !status || status === "pending";
    }).length;
  });

  filteredVideos = computed(() => {
    let videos = this.instagramService.getAllVideos();
    const search = this.videoSearch().toLowerCase();
    const position = this.positionFilter();
    const status = this.statusFilter();

    if (search) {
      videos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(search) ||
          v.creator.displayName.toLowerCase().includes(search)
      );
    }

    if (position && position !== "All") {
      videos = videos.filter((v) => v.positions.includes(position));
    }

    if (status) {
      videos = videos.filter((v) => this.getVideoStatus(v.id) === status);
    }

    return videos;
  });

  pendingVideos = computed(() => {
    const allVideos = this.instagramService.getAllVideos();
    const statuses = this.videoStatuses();
    return allVideos.filter((v) => {
      const status = statuses.get(v.id);
      return !status || status === "pending";
    });
  });

  videoOptions = computed(() => {
    return this.instagramService.getAllVideos().map((v) => ({
      label: v.title,
      value: v.id,
    }));
  });

  videosByPosition = computed(() => {
    const stats = this.instagramService.getStatistics();
    const total = Object.values(stats.byPosition).reduce((a, b) => a + b, 0);
    return Object.entries(stats.byPosition)
      .map(([position, count]) => ({
        position,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  });

  videosByFocus = computed(() => {
    const stats = this.instagramService.getStatistics();
    const total = Object.values(stats.byFocus).reduce((a, b) => a + b, 0);
    return Object.entries(stats.byFocus)
      .map(([focus, count]) => ({
        focus: focus as TrainingFocus,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  });

  topCreators = computed(() => {
    const creators = this.instagramService.getFeaturedCreators();
    return creators
      .map((c) => ({
        ...c,
        videoCount: this.instagramService.getVideosByCreator(c.username).length,
      }))
      .sort((a, b) => b.videoCount - a.videoCount)
      .slice(0, 5);
  });

  previewEmbedHtml = computed(() => {
    const video = this.previewVideo();
    if (!video) return "";
    return this.instagramService.generateEmbedHtml(video, {
      width: 400,
      maxWidth: "100%",
    });
  });

  playerSuggestionsCount = computed(() =>
    this.playerSuggestions().filter((s) => s.status === "pending").length
  );

  ngOnInit(): void {
    this.loadVideoStatuses();
    this.loadPlaylists();
    this.loadPlayerSuggestions();
  }

  // Status methods
  getVideoStatus(videoId: string): "pending" | "approved" | "rejected" {
    return this.videoStatuses().get(videoId) || "pending";
  }

  getStatusSeverity(status: string): "warn" | "success" | "danger" | undefined {
    switch (status) {
      case "pending":
        return "warn";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return undefined;
    }
  }

  async approveVideo(video: InstagramVideo): Promise<void> {
    const statuses = new Map(this.videoStatuses());
    statuses.set(video.id, "approved");
    this.videoStatuses.set(statuses);
    await this.saveVideoStatus(video.id, "approved");
    this.toastService.success(`"${video.title}" approved`);
  }

  async rejectVideo(video: InstagramVideo): Promise<void> {
    const statuses = new Map(this.videoStatuses());
    statuses.set(video.id, "rejected");
    this.videoStatuses.set(statuses);
    await this.saveVideoStatus(video.id, "rejected");
    this.toastService.info(`"${video.title}" rejected`);
  }

  openPreview(video: InstagramVideo): void {
    this.previewVideo.set(video);
    this.showPreviewDialog.set(true);
  }

  // Playlist methods
  openPlaylistDialog(): void {
    this.playlistForm = {
      name: "",
      description: "",
      position: null,
      focus: [],
      videoIds: [],
    };
    this.showPlaylistDialog.set(true);
  }

  closePlaylistDialog(): void {
    this.showPlaylistDialog.set(false);
  }

  async createPlaylist(): Promise<void> {
    const playlist = this.instagramService.createPlaylist(
      this.playlistForm.name,
      this.playlistForm.description,
      this.playlistForm.videoIds,
      {
        position: this.playlistForm.position || undefined,
        focus: this.playlistForm.focus,
      }
    );

    this.playlists.update((p) => [...p, playlist]);
    await this.savePlaylist(playlist);
    this.closePlaylistDialog();
    this.toastService.success(`Playlist "${playlist.name}" created`);
  }

  editPlaylist(playlist: InstagramPlaylist): void {
    this.playlistForm = {
      name: playlist.name,
      description: playlist.description,
      position: playlist.position || null,
      focus: playlist.focus,
      videoIds: playlist.videos.map((v) => v.id),
    };
    this.showPlaylistDialog.set(true);
  }

  async sharePlaylist(playlist: InstagramPlaylist): Promise<void> {
    // In a real app, this would share with team members
    this.toastService.success(`Playlist "${playlist.name}" shared with team`);
  }

  async deletePlaylist(playlist: InstagramPlaylist): Promise<void> {
    this.playlists.update((p) => p.filter((pl) => pl.id !== playlist.id));
    this.toastService.info(`Playlist "${playlist.name}" deleted`);
  }

  addToPlaylist(video: InstagramVideo): void {
    this.playlistForm.videoIds = [video.id];
    this.openPlaylistDialog();
  }

  // Persistence
  private async loadVideoStatuses(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      const { data } = await this.supabaseService.client
        .from("video_curation_status")
        .select("video_id, status")
        .eq("team_id", user.id);

      if (data) {
        const statuses = new Map<string, "pending" | "approved" | "rejected">();
        data.forEach((item) => {
          statuses.set(item.video_id, item.status);
        });
        this.videoStatuses.set(statuses);
      }
    } catch (error) {
      console.error("Failed to load video statuses:", error);
    }
  }

  private async saveVideoStatus(
    videoId: string,
    status: "approved" | "rejected"
  ): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      await this.supabaseService.client.from("video_curation_status").upsert({
        team_id: user.id,
        video_id: videoId,
        status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save video status:", error);
    }
  }

  private async loadPlaylists(): Promise<void> {
    // Load from localStorage for now (could be Supabase in production)
    const saved = localStorage.getItem("flagfit_playlists");
    if (saved) {
      try {
        this.playlists.set(JSON.parse(saved));
      } catch {
        // Invalid data
      }
    }
  }

  private async savePlaylist(playlist: InstagramPlaylist): Promise<void> {
    const all = this.playlists();
    localStorage.setItem("flagfit_playlists", JSON.stringify(all));
  }

  // Player Suggestions Methods
  private async loadPlayerSuggestions(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("video_suggestions")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      this.playerSuggestions.set((data as PlayerSuggestion[]) || []);
    } catch (error) {
      console.error("Failed to load player suggestions:", error);
    }
  }

  async approveSuggestion(suggestion: PlayerSuggestion): Promise<void> {
    try {
      const user = this.authService.getUser();
      
      const { error } = await this.supabaseService.client
        .from("video_suggestions")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", suggestion.id);

      if (error) throw error;

      this.playerSuggestions.update((suggestions) =>
        suggestions.map((s) =>
          s.id === suggestion.id ? { ...s, status: "approved" as const } : s
        )
      );
      this.toastService.success(`"${suggestion.title}" approved and added to library`);
    } catch (error) {
      console.error("Failed to approve suggestion:", error);
      this.toastService.error("Failed to approve suggestion");
    }
  }

  async rejectSuggestion(suggestion: PlayerSuggestion): Promise<void> {
    try {
      const user = this.authService.getUser();
      
      const { error } = await this.supabaseService.client
        .from("video_suggestions")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", suggestion.id);

      if (error) throw error;

      this.playerSuggestions.update((suggestions) =>
        suggestions.map((s) =>
          s.id === suggestion.id ? { ...s, status: "rejected" as const } : s
        )
      );
      this.toastService.info(`"${suggestion.title}" rejected`);
    } catch (error) {
      console.error("Failed to reject suggestion:", error);
      this.toastService.error("Failed to reject suggestion");
    }
  }

  openSuggestionInInstagram(suggestion: PlayerSuggestion): void {
    window.open(suggestion.instagram_url, "_blank");
  }

  formatSuggestionDate(dateStr: string): string {
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
      injury_prevention: "Injury Prev",
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

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) {
      return `${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
}
