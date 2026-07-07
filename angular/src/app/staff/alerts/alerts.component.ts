import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";

interface Alert {
  id?: string;
  type?: string;
  severity?: string;
  athlete_name?: string;
  athleteName?: string;
  user_id?: string;
  athlete_id?: string;
  message?: string;
  created_at?: string;
}

/**
 * Coach Alerts — ACWR danger/elevated, injury blocks, low readiness, missed
 * check-ins across the team. Reads GET /api/coach-alerts; acknowledge → POST.
 * Severity tints the card; tapping links to the athlete.
 */
@Component({
  selector: "app-staff-alerts",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./alerts.component.html",
})
export class AlertsComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly alerts = signal<Alert[] | null>(null);

  constructor() {
    this.api
      .get<{ alerts?: Alert[] } | Alert[]>("/api/coach-alerts")
      .subscribe({
        next: (res) => {
          const d = res?.data as { alerts?: Alert[] } | Alert[] | undefined;
          this.alerts.set(Array.isArray(d) ? d : (d?.alerts ?? []));
        },
        error: () => this.alerts.set([]),
      });
  }

  acknowledge(a: Alert): void {
    this.alerts.update((list) => (list ?? []).filter((x) => x !== a));
    this.api
      .post("/api/coach-alerts", { alertId: a.id, acknowledged: true })
      .subscribe({
        error: (e) => {
          this.logger.error("coach_alert_ack_failed", e);
          // Roll back the optimistic removal — without this, a failed ack
          // (network blip, server error) silently drops a possibly
          // danger-severity alert from the coach's view even though it was
          // never actually acknowledged server-side.
          this.alerts.update((list) => {
            const current = list ?? [];
            return current.includes(a) ? current : [...current, a];
          });
        },
      });
  }

  athleteId(a: Alert): string {
    return (a.user_id ?? a.athlete_id ?? "") as string;
  }
  athleteName(a: Alert): string {
    return (a.athlete_name ?? a.athleteName ?? "Athlete") as string;
  }
  /** Status-card modifier class (see .card.danger/.warn in the system layer). */
  accentClass(a: Alert): string {
    const s = (a.severity ?? a.type ?? "").toLowerCase();
    if (/(danger|critical|injur|block|high)/.test(s)) return "danger";
    if (/(elevat|warn|moderate|low_readiness)/.test(s)) return "warn";
    return "";
  }
  icon(a: Alert): string {
    const s = (a.type ?? "").toLowerCase();
    if (/(injur|physio|rtp|block)/.test(s)) return "activity";
    if (/(acwr|load|risk)/.test(s)) return "bar-chart-3";
    if (/(readiness|wellness|checkin)/.test(s)) return "heart-pulse";
    return "bell";
  }
}
