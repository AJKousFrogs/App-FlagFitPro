import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { TeamEvent, EventType, RsvpStatus, EVENT_TYPE_CONFIG } from "../team-calendar.models";

@Component({
  selector: "app-team-calendar-events-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  templateUrl: "./team-calendar-events-section.component.html",
  styleUrl: "./team-calendar-events-section.component.scss",
})
export class TeamCalendarEventsSectionComponent {
  readonly groupedEvents = input.required<{ date: string; events: TeamEvent[] }[]>();
  readonly selectedType = input<EventType | null>(null);

  readonly openRsvp = output<TeamEvent>();

  formatDateHeader(dateValue: string): string {
    const date = new Date(dateValue);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  getEventTypeConfig(type: EventType) {
    return EVENT_TYPE_CONFIG[type];
  }

  getEmptyDescription(): string {
    const selectedType = this.selectedType();
    if (!selectedType) {
      return "Check back later for team events";
    }

    return `No ${this.getEventTypeConfig(selectedType).label.toLowerCase()} events scheduled`;
  }

  getRsvpLabel(status: RsvpStatus): string {
    switch (status) {
      case "going":
        return "Going";
      case "not-going":
        return "Can't Go";
      case "maybe":
        return "Maybe";
      default:
        return "Pending";
    }
  }
}
