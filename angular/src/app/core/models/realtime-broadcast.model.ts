export interface RealtimeBroadcastPayload {
  operation: "INSERT" | "UPDATE" | "DELETE";
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

export type NotificationBroadcastPayload = RealtimeBroadcastPayload;
