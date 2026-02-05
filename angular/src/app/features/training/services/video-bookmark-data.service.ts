import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class VideoBookmarkDataService {
  private readonly supabaseService = inject(SupabaseService);

  async fetchBookmarks(userId: string): Promise<{
    bookmarks: { video_id: string }[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("video_bookmarks")
      .select("video_id")
      .eq("user_id", userId);

    return { bookmarks: data ?? [], error };
  }

  async saveBookmark(input: {
    userId: string;
    videoId: string;
    videoTitle: string;
    videoUrl: string;
    creatorUsername: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("video_bookmarks")
      .upsert({
        user_id: input.userId,
        video_id: input.videoId,
        video_title: input.videoTitle,
        video_url: input.videoUrl,
        creator_username: input.creatorUsername,
        saved_at: new Date().toISOString(),
      });

    return { error };
  }

  async removeBookmark(input: {
    userId: string;
    videoId: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client
      .from("video_bookmarks")
      .delete()
      .eq("user_id", input.userId)
      .eq("video_id", input.videoId);

    return { error };
  }
}
