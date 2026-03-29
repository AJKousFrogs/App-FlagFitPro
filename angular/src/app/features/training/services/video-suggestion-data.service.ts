import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "../../../core/services/supabase.service";
import { isBenignSupabaseQueryError } from "../../../shared/utils/error.utils";

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
  private tableUnavailable = false;

  async createSuggestion(
    suggestion: Partial<VideoSuggestionRecord>,
  ): Promise<{ suggestion: VideoSuggestionRecord | null; error: { message?: string } | null }> {
    if (this.tableUnavailable) {
      return {
        suggestion: null,
        error: { message: "Video suggestions are not available in this environment yet." },
      };
    }

    const { data, error } = await this.supabaseService.client
      .from("video_suggestions")
      .insert(suggestion)
      .select()
      .single();

    if (error && isBenignSupabaseQueryError(error)) {
      this.tableUnavailable = true;
      return {
        suggestion: null,
        error: { message: "Video suggestions are not available in this environment yet." },
      };
    }

    return { suggestion: (data as VideoSuggestionRecord) ?? null, error };
  }

  async fetchMySuggestions(userId: string): Promise<{
    suggestions: VideoSuggestionRecord[];
    error: { message?: string } | null;
  }> {
    if (this.tableUnavailable) {
      return { suggestions: [], error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("video_suggestions")
      .select("*")
      .eq("submitted_by", userId)
      .order("submitted_at", { ascending: false });

    if (error && isBenignSupabaseQueryError(error)) {
      this.tableUnavailable = true;
      return { suggestions: [], error: null };
    }

    return { suggestions: (data as VideoSuggestionRecord[]) ?? [], error };
  }

  async fetchApprovedSuggestions(limit: number): Promise<{
    suggestions: VideoSuggestionRecord[];
    error: { message?: string } | null;
  }> {
    if (this.tableUnavailable) {
      return { suggestions: [], error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("video_suggestions")
      .select("*")
      .eq("status", "approved")
      .order("submitted_at", { ascending: false })
      .limit(limit);

    if (error && isBenignSupabaseQueryError(error)) {
      this.tableUnavailable = true;
      return { suggestions: [], error: null };
    }

    return { suggestions: (data as VideoSuggestionRecord[]) ?? [], error };
  }

  async deleteSuggestion(id: string): Promise<{
    error: { message?: string } | null;
  }> {
    if (this.tableUnavailable) {
      return { error: null };
    }

    const { error } = await this.supabaseService.client
      .from("video_suggestions")
      .delete()
      .eq("id", id);

    if (error && isBenignSupabaseQueryError(error)) {
      this.tableUnavailable = true;
      return { error: null };
    }

    return { error };
  }
}
