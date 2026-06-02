import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

interface Notif {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  body?: string;
  is_read?: boolean;
  created_at?: string;
}

/**
 * Notifications — the alert feed. Ported 1:1 from
 * redesign/ground-zero/02-hifi/notifications.html. Reads GET /api/notifications;
 * safety/physio alerts lead with a danger accent, game/event with the brand accent.
 * "Mark all read" posts best-effort and clears optimistically.
 */
@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./notifications.component.html",
})
export class NotificationsComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly items = signal<Notif[] | null>(null);

  constructor() {
    this.api.get<{ notifications?: Notif[] } | Notif[]>("/api/notifications").subscribe({
      next: (res) => {
        const d = res?.data as { notifications?: Notif[] } | Notif[] | undefined;
        this.items.set(Array.isArray(d) ? d : (d?.notifications ?? []));
      },
      error: (e) => {
        this.logger.error("notifications_load_failed", e);
        this.items.set([]);
      },
    });
  }

  markAllRead(): void {
    this.items.set([]);
    this.api.post("/api/notifications", { markAll: true }).subscribe({
      error: (e) => this.logger.error("notifications_mark_read_failed", e),
    });
  }

  accent(n: Notif): string {
    const t = (n.type ?? "").toLowerCase();
    if (/(physio|injur|safety|acwr|danger|rtp)/.test(t)) return "var(--danger)";
    if (/(game|event|comp|taper)/.test(t)) return "var(--accent)";
    return "var(--border-soft)";
  }

  icon(n: Notif): string {
    const t = (n.type ?? "").toLowerCase();
    if (/(physio|injur|safety|acwr|rtp)/.test(t)) return "activity";
    if (/(game|event|comp|taper)/.test(t)) return "flag";
    if (/(coach|message|feedback)/.test(t)) return "message-circle";
    if (/(streak|achiev|badge|medal)/.test(t)) return "medal";
    return "bell";
  }

  ago(iso?: string): string {
    if (!iso) return "";
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (mins < 60) return `${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.round(hrs / 24)}d`;
  }
}
