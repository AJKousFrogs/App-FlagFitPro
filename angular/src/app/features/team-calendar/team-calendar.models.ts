export interface TeamEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  myRsvp: RsvpStatus;
  rsvpStats: RsvpStats;
  needsRide?: boolean;
  guestsAllowed: boolean;
}

export interface RsvpStats {
  going: number;
  notGoing: number;
  maybe: number;
  pending: number;
}

export interface RsvpSubmission {
  eventId: string;
  status: RsvpStatus;
  guests: number;
  needsRide: boolean;
  canProvideRide: boolean;
  notes: string;
}

export type EventType = "practice" | "game" | "team-event" | "meeting" | "tournament";
export type RsvpStatus = "going" | "not-going" | "maybe" | "pending";

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  {
    label: string;
    icon: string;
    severity: "success" | "info" | "warning" | "danger" | "secondary";
  }
> = {
  practice: { label: "Practice", icon: "pi-flag", severity: "success" },
  game: { label: "Game", icon: "pi-star", severity: "danger" },
  "team-event": { label: "Team Event", icon: "pi-users", severity: "info" },
  meeting: { label: "Meeting", icon: "pi-comments", severity: "warning" },
  tournament: { label: "Tournament", icon: "pi-trophy", severity: "danger" },
};
