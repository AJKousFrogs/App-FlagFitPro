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
import { RealtimeService } from "../../../core/services/realtime.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
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

interface DatabaseVideoPlaylistRow {
  id: string;
  team_id: string | null;
  created_by: string;
  name: string;
  description: string | null;
  position: FlagPosition | null;
  focus_areas: TrainingFocus[] | null;
  video_ids: string[] | null;
  is_public: boolean | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: "root",
})
export class VideoCurationService {
  private instagramService = inject(InstagramVideoService);
  private realtimeService = inject(RealtimeService);
  private supabaseService = inject(SupabaseService);
  private teamMembershipService = inject(TeamMembershipService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private playlistsSubscription: (() => void) | null = null;
  private videoStatusSubscription: (() => void) | null = null;
  private realtimeTeamId: string | null = null;

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
  private currentUserId(): string | null {
    return this.supabaseService.userId();
  }

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
  async createPlaylist(form: PlaylistForm): Promise<InstagramPlaylist | null> {
    const userId = this.currentUserId();
    const membership = await this.teamMembershipService.loadMembership();

    if (!userId || !membership?.teamId) {
      this.toastService.error("Join a team before creating shared playlists");
      return null;
    }

    try {
      const payload = {
        team_id: membership.teamId,
        created_by: userId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        position: form.position || null,
        focus_areas: form.focus,
        video_ids: form.videoIds,
      };

      const { data, error } = await this.supabaseService.client
        .from("video_playlists")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      const playlist = this.mapPlaylistRow(data as DatabaseVideoPlaylistRow);
      this.playlists.update((existing) => [playlist, ...existing]);
      this.toastService.success(`Playlist "${playlist.name}" created`);
      return playlist;
    } catch (error) {
      this.logger.error("Failed to create playlist", error);
      this.toastService.error("Failed to create playlist");
      return null;
    }
  }

  async sharePlaylist(playlist: InstagramPlaylist): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("video_playlists")
        .update({
          is_public: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", playlist.id);

      if (error) throw error;

      this.toastService.success(`Playlist "${playlist.name}" shared with team`);
    } catch (error) {
      this.logger.error("Failed to share playlist", error);
      this.toastService.error("Failed to share playlist");
    }
  }

  async deletePlaylist(playlist: InstagramPlaylist): Promise<void> {
    try {
      const { error } = await this.supabaseService.client
        .from("video_playlists")
        .delete()
        .eq("id", playlist.id);

      if (error) throw error;

      this.playlists.update((existing) =>
        existing.filter((entry) => entry.id !== playlist.id),
      );
      this.toastService.info(`Playlist "${playlist.name}" deleted`);
    } catch (error) {
      this.logger.error("Failed to delete playlist", error);
      this.toastService.error("Failed to delete playlist");
    }
  }

  // Player suggestion operations
  async approveSuggestion(suggestion: PlayerSuggestion): Promise<void> {
    try {
      const userId = this.currentUserId();

      const { error } = await this.supabaseService.client
        .from("video_suggestions")
        .update({
          status: "approved",
          reviewed_by: userId,
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
      this.logger.error("Failed to approve suggestion", error);
      this.toastService.error(TOAST.ERROR.VIDEO_APPROVE_FAILED);
    }
  }

  async rejectSuggestion(suggestion: PlayerSuggestion): Promise<void> {
    try {
      const userId = this.currentUserId();

      const { error } = await this.supabaseService.client
        .from("video_suggestions")
        .update({
          status: "rejected",
          reviewed_by: userId,
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
      this.logger.error("Failed to reject suggestion", error);
      this.toastService.error(TOAST.ERROR.VIDEO_REJECT_FAILED);
    }
  }

  // Data loading
  async loadAllData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const membership = await this.teamMembershipService.loadMembership();
      const teamId = membership?.teamId || null;

      this.initializeRealtimeSubscriptions(teamId);

      await Promise.all([
        this.loadVideoStatuses(teamId),
        this.loadPlaylists(teamId),
        this.loadPlayerSuggestions(),
      ]);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadVideoStatuses(teamId?: string | null): Promise<void> {
    try {
      const resolvedTeamId =
        teamId || (await this.teamMembershipService.loadMembership())?.teamId;
      if (!resolvedTeamId) {
        this.videoStatuses.set(new Map());
        return;
      }

      const { data } = await this.supabaseService.client
        .from("video_curation_status")
        .select("video_id, status")
        .eq("team_id", resolvedTeamId);

      const statuses = new Map<string, VideoStatus>();
      (data || []).forEach((item) => {
        statuses.set(item.video_id, item.status);
      });
      this.videoStatuses.set(statuses);
    } catch (error) {
      this.logger.error("Failed to load video statuses", error);
    }
  }

  async loadPlaylists(teamId?: string | null): Promise<void> {
    const userId = this.currentUserId();
    const resolvedTeamId =
      teamId || (await this.teamMembershipService.loadMembership())?.teamId;

    if (!userId || !resolvedTeamId) {
      this.playlists.set([]);
      return;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from("video_playlists")
        .select("*")
        .eq("team_id", resolvedTeamId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const playlistRows = (data as DatabaseVideoPlaylistRow[] | null) || [];

      if (playlistRows.length === 0) {
        const migrated = await this.migrateLegacyPlaylists(
          resolvedTeamId,
          userId,
        );
        if (migrated) {
          await this.loadPlaylists(resolvedTeamId);
          return;
        }
      }

      this.playlists.set(
        playlistRows.map((playlist) => this.mapPlaylistRow(playlist)),
      );
    } catch (error) {
      this.logger.error("Failed to load playlists", error);
      this.playlists.set([]);
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
      this.logger.error("Failed to load player suggestions", error);
    }
  }

  // Private methods
  private async saveVideoStatus(
    videoId: string,
    status: "approved" | "rejected",
  ): Promise<void> {
    try {
      const userId = this.currentUserId();
      const membership = await this.teamMembershipService.loadMembership();
      if (!userId || !membership?.teamId) return;

      await this.supabaseService.client.from("video_curation_status").upsert({
        team_id: membership.teamId,
        video_id: videoId,
        status,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error("Failed to save video status", error);
    }
  }

  private mapPlaylistRow(playlist: DatabaseVideoPlaylistRow): InstagramPlaylist {
    const videoIds = Array.isArray(playlist.video_ids) ? playlist.video_ids : [];
    const videos = videoIds
      .map((id) => this.instagramService.getVideoById(id))
      .filter((video): video is InstagramVideo => !!video);

    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || "",
      videos,
      position: playlist.position || undefined,
      focus: Array.isArray(playlist.focus_areas) ? playlist.focus_areas : [],
      totalDuration: videos.reduce(
        (sum, video) => sum + (video.duration || 60),
        0,
      ),
      createdBy: playlist.created_by,
      createdAt: playlist.created_at,
    };
  }

  private async migrateLegacyPlaylists(
    teamId: string,
    userId: string,
  ): Promise<boolean> {
    void teamId;
    void userId;
    return false;
  }

  private initializeRealtimeSubscriptions(teamId: string | null): void {
    if (!teamId) {
      this.cleanupRealtimeSubscriptions();
      return;
    }

    this.cleanupRealtimeSubscriptions();
    this.realtimeTeamId = teamId;

    this.playlistsSubscription = this.realtimeService.subscribe(
      "video_playlists",
      `team_id=eq.${teamId}`,
      {
        onInsert: () => void this.loadPlaylists(teamId),
        onUpdate: () => void this.loadPlaylists(teamId),
        onDelete: () => void this.loadPlaylists(teamId),
      },
    );

    this.videoStatusSubscription = this.realtimeService.subscribe(
      "video_curation_status",
      `team_id=eq.${teamId}`,
      {
        onInsert: () => void this.loadVideoStatuses(teamId),
        onUpdate: () => void this.loadVideoStatuses(teamId),
        onDelete: () => void this.loadVideoStatuses(teamId),
      },
    );
  }

  private cleanupRealtimeSubscriptions(): void {
    this.playlistsSubscription?.();
    this.videoStatusSubscription?.();
    this.playlistsSubscription = null;
    this.videoStatusSubscription = null;
    this.realtimeTeamId = null;
  }
}
