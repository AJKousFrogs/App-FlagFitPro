import { Injectable, computed, inject, signal } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { TeamMembershipService } from "./team-membership.service";
import { PrescriptionIntent } from "../models/prescription.models";

export interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  youtubeId: string | null;
  thumbnail: string | null;
  duration: string;
  category: string;
  position: string | null;
  difficulty: string | null;
  teamId: string | null;
}

/** Parse a YouTube video id from a watch/short/embed/youtu.be URL or a bare id. */
export function parseYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^[\w-]{11}$/.test(url)) return url;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function fmtDuration(sec?: number | null): string {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Maps a prescription intent to a library category for the session video. */
const INTENT_CATEGORY: Record<PrescriptionIntent, string> = {
  sprint: "sprint", strength: "strength", mixed: "conditioning", mobility: "mobility",
  technical: "skills", recovery: "recovery", rest: "recovery",
  "taper-prime": "warmup", competition: "skills", travel: "morning_mobility",
};

/**
 * Training video library (table public.training_videos, RLS: global + your team).
 * Read directly via Supabase; coaches add via add(). Powers the athlete Library
 * tab, the session-video-by-intent, and the coach manager.
 */
@Injectable({ providedIn: "root" })
export class TrainingVideoService {
  private readonly supabase = inject(SupabaseService);
  private readonly membership = inject(TeamMembershipService);

  readonly videos = signal<TrainingVideo[]>([]);
  readonly loaded = signal(false);

  readonly categories = computed(() =>
    [...new Set(this.videos().map((v) => v.category))].sort(),
  );

  async load(): Promise<void> {
    try {
      const { data } = await this.supabase.client
        .from("training_videos")
        .select("id,title,description,video_url,thumbnail_url,duration_seconds,category,position,difficulty_level,team_id,is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      this.videos.set((data ?? []).map((r) => this.map(r as Record<string, unknown>)));
    } catch {
      this.videos.set([]);
    } finally {
      this.loaded.set(true);
    }
  }

  byCategory(category: string): TrainingVideo[] {
    return this.videos().filter((v) => v.category === category);
  }

  /** First playable video in a category (for an exercise-block demo). */
  first(category: string): TrainingVideo | null {
    return this.videos().find((v) => v.category === category && v.youtubeId) ?? null;
  }

  /** First library video matching a prescription intent (for the session video). */
  forIntent(intent: PrescriptionIntent | null | undefined): TrainingVideo | null {
    if (!intent) return null;
    const cat = INTENT_CATEGORY[intent];
    return this.videos().find((v) => v.category === cat && v.youtubeId) ?? null;
  }

  /** Coach adds a video to their team's library. RLS enforces staff-of-team. */
  async add(input: { url: string; title: string; category: string; description?: string; durationSeconds?: number }): Promise<boolean> {
    const teamId = this.membership.teamId();
    if (!teamId) return false;
    const { error } = await this.supabase.client.from("training_videos").insert({
      team_id: teamId,
      title: input.title.trim(),
      video_url: input.url.trim(),
      category: input.category,
      description: input.description?.trim() || null,
      duration_seconds: input.durationSeconds ?? null,
      is_active: true,
    });
    if (error) return false;
    await this.load();
    return true;
  }

  private map(r: Record<string, unknown>): TrainingVideo {
    const youtubeId = parseYouTubeId(r["video_url"] as string);
    return {
      id: String(r["id"]),
      title: (r["title"] as string) ?? "Untitled",
      description: (r["description"] as string) ?? null,
      youtubeId,
      // Prefer a stored thumbnail, else the real YouTube poster. The component's
      // <img (error)> handler falls back to the bundled local image if this 504s,
      // so we get the genuine thumbnail when YouTube is reachable without the tile
      // ever breaking when it isn't.
      thumbnail:
        (r["thumbnail_url"] as string) ??
        (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null),
      duration: fmtDuration(r["duration_seconds"] as number),
      category: (r["category"] as string) ?? "general",
      position: (r["position"] as string) ?? null,
      difficulty: (r["difficulty_level"] as string) ?? null,
      teamId: (r["team_id"] as string) ?? null,
    };
  }
}
