export interface MicroSessionStep {
  order: number;
  instruction: string;
  duration_seconds: number;
}

export interface MicroSessionData {
  id?: string;
  title: string;
  description?: string;
  session_type: string;
  estimated_duration_minutes: number;
  equipment_needed: string[];
  intensity_level: string;
  position_relevance: string[];
  steps: MicroSessionStep[];
  coaching_cues: string[];
  safety_notes?: string | null;
  follow_up_prompt: string;
  source_message_id?: string;
}

export type SessionStatus =
  | "ready"
  | "equipment_check"
  | "in_progress"
  | "paused"
  | "completed"
  | "follow_up";
