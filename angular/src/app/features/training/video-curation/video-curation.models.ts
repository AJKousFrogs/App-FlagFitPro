/**
 * Video Curation Models
 *
 * Shared interfaces and types for the video curation feature.
 */

import {
  InstagramVideo,
  InstagramPlaylist,
} from "../../../core/services/instagram-video.service";
import {
  FlagPosition,
  TrainingFocus,
} from "../../../core/models/training-video.models";

export interface CuratedVideo extends InstagramVideo {
  status: "pending" | "approved" | "rejected";
  assignedPositions: FlagPosition[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface PlayerSuggestion {
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

export interface PlaylistForm {
  name: string;
  description: string;
  position: FlagPosition | null;
  focus: TrainingFocus[];
  videoIds: string[];
}

export type VideoStatus = "pending" | "approved" | "rejected";

export interface PositionStat {
  position: string;
  count: number;
  percentage: number;
}

export interface FocusStat {
  focus: TrainingFocus;
  count: number;
  percentage: number;
}

export interface CreatorStat {
  username: string;
  displayName: string;
  verified: boolean;
  videoCount: number;
}

export interface VideoOption {
  label: string;
  value: string;
}

export type { InstagramVideo, InstagramPlaylist, FlagPosition, TrainingFocus };
