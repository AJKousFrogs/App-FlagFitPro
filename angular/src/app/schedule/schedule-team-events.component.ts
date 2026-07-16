import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { CompetitionEvent } from "../core/models/schedule.models";
import { googleMapsSearchUrl } from "../core/utils/map-link.util";
import { whenLabel } from "./schedule-date.util";

/**
 * Team competitions — the shared competition spine, read-only for the athlete.
 * Renders nothing at all when the team has no upcoming events.
 */
@Component({
  selector: "app-schedule-team-events",
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (events().length > 0) {
      <div class="section-h"><h2>Team competitions</h2></div>
      @for (ev of events(); track ev.id) {
        <div class="card flat">
          <div class="row">
            <div class="stack" style="gap: var(--s-1)">
              <b>{{ ev.competitionShortName || ev.competitionName }}</b>
              <small class="muted">{{
                whenLabel(ev.startsAt, ev.endsAt)
              }}</small>
              @if (ev.hotelName || ev.hotelAddress) {
                <small class="muted inline">
                  <lucide-icon name="bed" />
                  {{ ev.hotelName || "Team hotel" }}
                  @if (ev.hotelAddress) {
                    ·
                    <a
                      [href]="mapUrl(ev.hotelAddress)"
                      target="_blank"
                      rel="noopener"
                      >map</a
                    >
                  }
                </small>
              }
            </div>
            <span class="band neutral">Team</span>
          </div>
        </div>
      }
    }
  `,
})
export class ScheduleTeamEventsComponent {
  readonly events = input.required<readonly CompetitionEvent[]>();

  protected readonly whenLabel = whenLabel;

  mapUrl(address: string): string {
    return googleMapsSearchUrl(address);
  }
}
