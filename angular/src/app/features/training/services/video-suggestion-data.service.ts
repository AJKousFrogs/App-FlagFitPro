import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";

export interface VideoSuggestionRecord {
  id?: string;
  instagram_url: string;
  shortcode: string;
  title: string;
  description: string;
  why_valuable: string;
  positions: string[];
  training_focus: string[];
  submitted_by: string;
  submitted_by_name: string;
  submitted_at: string;
  status: string;
}

@Injectable({
  providedIn: "root",
})
export class VideoSuggestionDataService {
  private readonly supabaseService = inject(SupabaseService);

  async createSuggestion(
    suggestion: Partial<VideoSuggestionRecord>,
  ): Promise<{ suggestion: VideoSuggestionRecord | null; error: { message?: string } | null }> {
    const { data, error } = await this.supabaseService.client
      .from("video_suggestions")
      .insert(suggestion)
      .select()
      .single();

    return { suggestion: (data as VideoSuggestionRecord) ?? null, error };
  }

  async fetchMySuggestions(userId: string): Promise<{
    suggestions: VideoSuggestionRecord[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("video_suggestions")
      .select("*")
      .eq("submitted_by", userId)
      .order("submitted_at", { ascending: false });

    return { suggestions: (data as VideoSuggestionRecord[]) ?? [], error };
  }

  async fetchApprovedSuggestions(limit: number): Promise<{
    suggestions: VideoSuggestionRecord[];
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client
      .from("video_suggestions")
      .select("*")
      .eq("status", "approved")
      .order("submitted_at", { ascending: false })
      .limit(limit);

    return { suggestions: (data as VideoSuggestionRecord[]) ?? [], error };
  }

  async deleteSuggestion(id: string): Promise<{
    error: { message?: string } | null;
  }> {
    const { error } = await this.supabaseService.client
      .from("video_suggestions")
      .delete()
      .eq("id", id);

    return { error };
  }
}
