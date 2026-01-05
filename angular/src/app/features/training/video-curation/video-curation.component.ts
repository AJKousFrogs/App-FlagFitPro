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
 * @version 2.0.0 - Refactored into sub-components
 * @angular 21
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  viewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG Components
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { TabsModule } from "primeng/tabs";
import { BadgeModule } from "primeng/badge";
// Services
import { VideoCurationService } from "./video-curation.service";

// Models
import {
  InstagramVideo,
  InstagramPlaylist,
  PlayerSuggestion,
  PlaylistForm,
  FlagPosition,
} from "./video-curation.models";

// Sub-components
import {
  VideoCurationStatsComponent,
  VideoCurationVideoTableComponent,
  VideoCurationSuggestionsComponent,
  VideoCurationPendingComponent,
  VideoCurationPlaylistsComponent,
  VideoCurationAnalyticsComponent,
  VideoCurationPlaylistDialogComponent,
  VideoCurationPreviewDialogComponent,
} from "./components";

// Layout
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";

@Component({
  selector: "app-video-curation",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,
    BadgeModule,
    MainLayoutComponent,
    VideoCurationStatsComponent,
    VideoCurationVideoTableComponent,
    VideoCurationSuggestionsComponent,
    VideoCurationPendingComponent,
    VideoCurationPlaylistsComponent,
    VideoCurationAnalyticsComponent,
    VideoCurationPlaylistDialogComponent,
    VideoCurationPreviewDialogComponent,
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
        <app-video-curation-stats
          [totalVideos]="curationService.totalVideos()"
          [approvedCount]="curationService.approvedCount()"
          [pendingCount]="curationService.pendingCount()"
          [playlistCount]="curationService.playlists().length"
        />

        <!-- Tabs -->
        <p-tabs [(value)]="activeTab">
          <p-tablist>
            <p-tab value="videos">
              <i class="pi pi-video"></i>
              All Videos
              <p-badge
                [value]="curationService.totalVideos().toString()"
                severity="info"
              ></p-badge>
            </p-tab>
            <p-tab value="suggestions">
              <i class="pi pi-lightbulb"></i>
              Player Suggestions
              <p-badge
                [value]="curationService.playerSuggestionsCount().toString()"
                severity="warn"
              ></p-badge>
            </p-tab>
            <p-tab value="pending">
              <i class="pi pi-clock"></i>
              Pending Review
              <p-badge
                [value]="curationService.pendingCount().toString()"
                severity="warn"
              ></p-badge>
            </p-tab>
            <p-tab value="playlists">
              <i class="pi pi-list"></i>
              Playlists
              <p-badge
                [value]="curationService.playlists().length.toString()"
              ></p-badge>
            </p-tab>
            <p-tab value="analytics">
              <i class="pi pi-chart-bar"></i>
              Analytics
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- All Videos Tab -->
            <p-tabpanel value="videos">
              <app-video-curation-video-table
                [videos]="filteredVideos()"
                [videoStatuses]="curationService.videoStatuses()"
                (preview)="openPreview($event)"
                (approve)="approveVideo($event)"
                (reject)="rejectVideo($event)"
                (addToPlaylist)="addToPlaylist($event)"
                (filterChange)="onFilterChange($event)"
              />
            </p-tabpanel>

            <!-- Player Suggestions Tab -->
            <p-tabpanel value="suggestions">
              <app-video-curation-suggestions
                [suggestions]="curationService.playerSuggestions()"
                (approve)="approveSuggestion($event)"
                (reject)="rejectSuggestion($event)"
                (openInInstagram)="openSuggestionInInstagram($event)"
              />
            </p-tabpanel>

            <!-- Pending Review Tab -->
            <p-tabpanel value="pending">
              <app-video-curation-pending
                [videos]="curationService.pendingVideos()"
                (approve)="approveVideo($event)"
                (reject)="rejectVideo($event)"
                (preview)="openPreview($event)"
              />
            </p-tabpanel>

            <!-- Playlists Tab -->
            <p-tabpanel value="playlists">
              <app-video-curation-playlists
                [playlists]="curationService.playlists()"
                (create)="openPlaylistDialog()"
                (edit)="editPlaylist($event)"
                (share)="sharePlaylist($event)"
                (delete)="deletePlaylist($event)"
              />
            </p-tabpanel>

            <!-- Analytics Tab -->
            <p-tabpanel value="analytics">
              <app-video-curation-analytics
                [videosByPosition]="curationService.videosByPosition()"
                [videosByFocus]="curationService.videosByFocus()"
                [topCreators]="curationService.topCreators()"
              />
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>

        <!-- Create Playlist Dialog -->
        <app-video-curation-playlist-dialog
          [(visible)]="showPlaylistDialog"
          [videoOptions]="curationService.videoOptions()"
          (submit)="createPlaylist($event)"
        />

        <!-- Video Preview Dialog -->
        <app-video-curation-preview-dialog
          [(visible)]="showPreviewDialog"
          [video]="previewVideo()"
          [embedHtml]="previewEmbedHtml()"
        />
      </div>
    </app-main-layout>
  `,
  styleUrl: './video-curation.component.scss',
})
export class VideoCurationComponent implements OnInit {
  readonly curationService = inject(VideoCurationService);
  readonly playlistDialog = viewChild(VideoCurationPlaylistDialogComponent);

  // Local UI state
  activeTab = signal("videos");
  showPlaylistDialog = signal(false);
  showPreviewDialog = signal(false);
  previewVideo = signal<InstagramVideo | null>(null);

  // Filter state
  private videoSearch = signal("");
  private positionFilter = signal<FlagPosition | null>(null);
  private statusFilter = signal<string | null>(null);

  // Computed
  filteredVideos = computed(() => {
    return this.curationService.getFilteredVideos(
      this.videoSearch(),
      this.positionFilter(),
      this.statusFilter(),
    );
  });

  previewEmbedHtml = computed(() => {
    const video = this.previewVideo();
    if (!video) return "";
    return this.curationService.generateEmbedHtml(video, {
      width: 400,
      maxWidth: "100%",
    });
  });

  ngOnInit(): void {
    this.curationService.loadAllData();
  }

  // Filter handling
  onFilterChange(filters: {
    search: string;
    position: FlagPosition | null;
    status: string | null;
  }): void {
    this.videoSearch.set(filters.search);
    this.positionFilter.set(filters.position);
    this.statusFilter.set(filters.status);
  }

  // Video actions
  openPreview(video: InstagramVideo): void {
    this.previewVideo.set(video);
    this.showPreviewDialog.set(true);
  }

  async approveVideo(video: InstagramVideo): Promise<void> {
    await this.curationService.approveVideo(video);
  }

  async rejectVideo(video: InstagramVideo): Promise<void> {
    await this.curationService.rejectVideo(video);
  }

  // Playlist actions
  openPlaylistDialog(): void {
    this.playlistDialog()?.resetForm();
    this.showPlaylistDialog.set(true);
  }

  addToPlaylist(video: InstagramVideo): void {
    this.playlistDialog()?.setForm({ videoIds: [video.id] });
    this.showPlaylistDialog.set(true);
  }

  createPlaylist(form: PlaylistForm): void {
    this.curationService.createPlaylist(form);
  }

  editPlaylist(playlist: InstagramPlaylist): void {
    this.playlistDialog()?.setForm({
      name: playlist.name,
      description: playlist.description,
      position: playlist.position || null,
      focus: playlist.focus,
      videoIds: playlist.videos.map((v) => v.id),
    });
    this.showPlaylistDialog.set(true);
  }

  async sharePlaylist(playlist: InstagramPlaylist): Promise<void> {
    await this.curationService.sharePlaylist(playlist);
  }

  deletePlaylist(playlist: InstagramPlaylist): void {
    this.curationService.deletePlaylist(playlist);
  }

  // Player suggestion actions
  async approveSuggestion(suggestion: PlayerSuggestion): Promise<void> {
    await this.curationService.approveSuggestion(suggestion);
  }

  async rejectSuggestion(suggestion: PlayerSuggestion): Promise<void> {
    await this.curationService.rejectSuggestion(suggestion);
  }

  openSuggestionInInstagram(suggestion: PlayerSuggestion): void {
    window.open(suggestion.instagram_url, "_blank");
  }
}
