/**
 * Video Curation Service
 *
 * Handles data operations, state management, and Supabase interactions
 * for the video curation feature.
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import {
  InstagramVideoService,
  InstagramPlaylist,
  InstagramVideo,
} from "../../../core/services/instagram-video.service";
import { AuthService } from "../../../core/services/auth.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import {
  PlayerSuggestion,
  PlaylistForm,
  VideoStatus,
  FlagPosition,
  TrainingFocus,
  PositionStat,
  FocusStat,
  CreatorStat,
  VideoOption,
} from "./video-curation.models";

@Injectable({
  providedIn: "root",
})
export class VideoCurationService {
  private instagramService = inject(InstagramVideoService);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);

  // State signals
  readonly videoStatuses = signal<Map<string, VideoStatus>>(new Map());
  readonly playlists = signal<InstagramPlaylist[]>([]);
  readonly playerSuggestions = signal<PlayerSuggestion[]>([]);
  readonly isLoading = signal(false);

  // Computed values
  readonly totalVideos = computed(() => this.instagramService.totalVideos());

  readonly approvedCount = computed(() => {
    let count = 0;
    this.videoStatuses().forEach((status) => {
      if (status === "approved") count++;
    });
    return count;
  });

  readonly pendingCount = computed(() => {
    const allVideos = this.instagramService.getAllVideos();
    const statuses = this.videoStatuses();
    return allVideos.filter((v) => {
      const status = statuses.get(v.id);
      return !status || status === "pending";
    }).length;
  });

  readonly pendingVideos = computed(() => {
    const allVideos = this.instagramService.getAllVideos();
    const statuses = this.videoStatuses();
    return allVideos.filter((v) => {
      const status = statuses.get(v.id);
      return !status || status === "pending";
    });
  });

  readonly videoOptions = computed<VideoOption[]>(() => {
    return this.instagramService.getAllVideos().map((v) => ({
      label: v.title,
      value: v.id,
    }));
  });

  readonly videosByPosition = computed<PositionStat[]>(() => {
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

  readonly videosByFocus = computed<FocusStat[]>(() => {
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

  readonly topCreators = computed<CreatorStat[]>(() => {
    const creators = this.instagramService.getFeaturedCreators();
    return creators
      .map((c) => ({
        ...c,
        videoCount: this.instagramService.getVideosByCreator(c.username).length,
      }))
      .sort((a, b) => b.videoCount - a.videoCount)
      .slice(0, 5);
  });

  readonly playerSuggestionsCount = computed(
    () => this.playerSuggestions().filter((s) => s.status === "pending").length,
  );

  // Methods
  getAllVideos(): InstagramVideo[] {
    return this.instagramService.getAllVideos();
  }

  getFilteredVideos(
    search: string,
    position: FlagPosition | null,
    status: string | null,
  ): InstagramVideo[] {
    let videos = this.instagramService.getAllVideos();
    const searchLower = search.toLowerCase();

    if (searchLower) {
      videos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(searchLower) ||
          v.creator.displayName.toLowerCase().includes(searchLower),
      );
    }

    if (position && position !== ("All" as FlagPosition)) {
      videos = videos.filter((v) => v.positions.includes(position));
    }

    if (status) {
      videos = videos.filter((v) => this.getVideoStatus(v.id) === status);
    }

    return videos;
  }

  getVideoStatus(videoId: string): VideoStatus {
    return this.videoStatuses().get(videoId) || "pending";
  }

  generateEmbedHtml(
    video: InstagramVideo,
    options: { width: number; maxWidth: string },
  ): string {
    return this.instagramService.generateEmbedHtml(video, options);
  }

  // Video status operations
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

  // Playlist operations
  createPlaylist(form: PlaylistForm): InstagramPlaylist {
    const options: { position?: FlagPosition; focus?: TrainingFocus[] } = {
      focus: form.focus,
    };
    if (form.position) {
      options.position = form.position;
    }

    const playlist = this.instagramService.createPlaylist(
      form.name,
      form.description,
      form.videoIds,
      options,
    );

    this.playlists.update((p) => [...p, playlist]);
    this.savePlaylistToStorage();
    this.toastService.success(`Playlist "${playlist.name}" created`);
    return playlist;
  }

  async sharePlaylist(playlist: InstagramPlaylist): Promise<void> {
    this.toastService.success(`Playlist "${playlist.name}" shared with team`);
  }

  deletePlaylist(playlist: InstagramPlaylist): void {
    this.playlists.update((p) => p.filter((pl) => pl.id !== playlist.id));
    this.savePlaylistToStorage();
    this.toastService.info(`Playlist "${playlist.name}" deleted`);
  }

  // Player suggestion operations
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
          s.id === suggestion.id ? { ...s, status: "approved" as const } : s,
        ),
      );
      this.toastService.success(
        `"${suggestion.title}" approved and added to library`,
      );
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
          s.id === suggestion.id ? { ...s, status: "rejected" as const } : s,
        ),
      );
      this.toastService.info(`"${suggestion.title}" rejected`);
    } catch (error) {
      console.error("Failed to reject suggestion:", error);
      this.toastService.error("Failed to reject suggestion");
    }
  }

  // Data loading
  async loadAllData(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.loadVideoStatuses(),
        this.loadPlaylists(),
        this.loadPlayerSuggestions(),
      ]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadVideoStatuses(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      const { data } = await this.supabaseService.client
        .from("video_curation_status")
        .select("video_id, status")
        .eq("team_id", user.id);

      if (data) {
        const statuses = new Map<string, VideoStatus>();
        data.forEach((item) => {
          statuses.set(item.video_id, item.status);
        });
        this.videoStatuses.set(statuses);
      }
    } catch (error) {
      console.error("Failed to load video statuses:", error);
    }
  }

  async loadPlaylists(): Promise<void> {
    const saved = localStorage.getItem("flagfit_playlists");
    if (saved) {
      try {
        this.playlists.set(JSON.parse(saved));
      } catch {
        // Invalid data
      }
    }
  }

  async loadPlayerSuggestions(): Promise<void> {
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

  // Private methods
  private async saveVideoStatus(
    videoId: string,
    status: "approved" | "rejected",
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

  private savePlaylistToStorage(): void {
    const all = this.playlists();
    localStorage.setItem("flagfit_playlists", JSON.stringify(all));
  }
}
