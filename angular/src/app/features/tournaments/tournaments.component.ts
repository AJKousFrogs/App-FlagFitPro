import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { Tabs, TabPanel } from "primeng/tabs";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";

interface Tournament {
  id: string;
  title: string;
  subtitle: string;
  status: "upcoming" | "ongoing" | "completed" | "registration";
  date: string;
  duration: string;
  location: string;
  prizePool: string;
  teamsRegistered: number;
  teamsMax: number;
  daysUntil: number;
  progress?: number;
}

@Component({
  selector: "app-tournaments",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    Tabs,
    TabPanel,
    MainLayoutComponent,
    PageHeaderComponent
],
  template: `
    <app-main-layout>
      <div class="tournaments-page">
        <app-page-header
          title="Official Tournament Schedule 2026-2027"
          subtitle="International Flag Football Season featuring 7 major tournaments across Europe"
          icon="pi-trophy"
          >
          <p-button label="Next Tournament" icon="pi pi-calendar"></p-button>
        </app-page-header>
    
        <!-- Tournament Tabs -->
        <p-tabs>
          <p-tabpanel header="2026 Season" leftIcon="pi pi-calendar">
            <div class="tournaments-grid">
              @for (
                tournament of tournaments2026(); track trackByTournamentId($index,
                tournament)) {
                <p-card
                  class="tournament-card"
                  >
                  <div class="tournament-header">
                    <p-tag
                      [value]="getStatusLabel(tournament.status)"
                      [severity]="getStatusSeverity(tournament.status)"
                    ></p-tag>
                    <h3 class="tournament-title">{{ tournament.title }}</h3>
                    <p class="tournament-subtitle">{{ tournament.subtitle }}</p>
                  </div>
                  <div class="tournament-body">
                    <div class="tournament-info">
                      <div class="info-item">
                        <div class="info-icon">
                          <i class="pi pi-calendar"></i>
                        </div>
                        <div>
                          <div class="info-value">{{ tournament.date }}</div>
                          <div class="info-label">{{ tournament.duration }}</div>
                        </div>
                      </div>
                      <div class="info-item">
                        <div class="info-icon">📍</div>
                        <div>
                          <div class="info-value">{{ tournament.location }}</div>
                          <div class="info-label">Location</div>
                        </div>
                      </div>
                      <div class="info-item">
                        <div class="info-icon">💰</div>
                        <div>
                          <div class="info-value">{{ tournament.prizePool }}</div>
                          <div class="info-label">Prize pool</div>
                        </div>
                      </div>
                      <div class="info-item">
                        <div class="info-icon">
                          <i class="pi pi-users"></i>
                        </div>
                        <div>
                          <div class="info-value">
                            {{ tournament.teamsRegistered }}/{{
                            tournament.teamsMax
                            }}
                          </div>
                          <div class="info-label">Teams</div>
                        </div>
                      </div>
                    </div>
                    @if (tournament.progress !== undefined) {
                      <div
                        class="tournament-progress"
                        >
                        <div class="progress-label">
                          <span>Opens in</span>
                          <span>{{ tournament.daysUntil }} days</span>
                        </div>
                        <p-progressBar
                          [value]="tournament.progress"
                          [showValue]="false"
                        ></p-progressBar>
                      </div>
                    }
                    <div class="tournament-actions">
                      <p-button
                        label="Set Reminder"
                        [outlined]="true"
                        size="small"
                      ></p-button>
                      <p-button label="View Details" size="small"></p-button>
                    </div>
                  </div>
                </p-card>
              }
            </div>
          </p-tabpanel>
          <p-tabpanel header="2027 Season" leftIcon="pi pi-calendar">
            <div class="tournaments-grid">
              @for (
                tournament of tournaments2027(); track trackByTournamentId($index,
                tournament)) {
                <p-card
                  class="tournament-card"
                  >
                  <div class="tournament-header">
                    <p-tag
                      [value]="getStatusLabel(tournament.status)"
                      [severity]="getStatusSeverity(tournament.status)"
                    ></p-tag>
                    <h3 class="tournament-title">{{ tournament.title }}</h3>
                    <p class="tournament-subtitle">{{ tournament.subtitle }}</p>
                  </div>
                  <div class="tournament-body">
                    <div class="tournament-info">
                      <div class="info-item">
                        <div class="info-icon">
                          <i class="pi pi-calendar"></i>
                        </div>
                        <div>
                          <div class="info-value">{{ tournament.date }}</div>
                          <div class="info-label">{{ tournament.duration }}</div>
                        </div>
                      </div>
                      <div class="info-item">
                        <div class="info-icon">📍</div>
                        <div>
                          <div class="info-value">{{ tournament.location }}</div>
                          <div class="info-label">Location</div>
                        </div>
                      </div>
                      <div class="info-item">
                        <div class="info-icon">💰</div>
                        <div>
                          <div class="info-value">{{ tournament.prizePool }}</div>
                          <div class="info-label">Prize pool</div>
                        </div>
                      </div>
                      <div class="info-item">
                        <div class="info-icon">
                          <i class="pi pi-users"></i>
                        </div>
                        <div>
                          <div class="info-value">
                            {{ tournament.teamsRegistered }}/{{
                            tournament.teamsMax
                            }}
                          </div>
                          <div class="info-label">Teams</div>
                        </div>
                      </div>
                    </div>
                    <div class="tournament-actions">
                      <p-button
                        label="Set Reminder"
                        [outlined]="true"
                        size="small"
                      ></p-button>
                      <p-button label="View Details" size="small"></p-button>
                    </div>
                  </div>
                </p-card>
              }
            </div>
          </p-tabpanel>
        </p-tabs>
      </div>
    </app-main-layout>
    `,
  styles: [
    `
      .tournaments-page {
        padding: var(--space-6);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .header-content {
        flex: 1;
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .tournaments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--space-6);
        margin-top: var(--space-6);
      }

      .tournament-card {
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .tournament-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .tournament-header {
        margin-bottom: var(--space-4);
      }

      .tournament-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: var(--space-2) 0;
        color: var(--text-primary);
      }

      .tournament-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .tournament-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .info-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .info-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        color: var(--color-brand-primary);
        flex-shrink: 0;
      }

      .info-value {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .info-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .tournament-progress {
        margin-bottom: var(--space-4);
      }

      .progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .tournament-actions {
        display: flex;
        gap: var(--space-3);
      }

      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }

        .tournaments-grid {
          grid-template-columns: 1fr;
        }

        .tournament-info {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TournamentsComponent implements OnInit {
  private apiService = inject(ApiService);

  tournaments2026 = signal<Tournament[]>([]);
  tournaments2027 = signal<Tournament[]>([]);

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    // Load 2026 tournaments
    this.tournaments2026.set([
      {
        id: "1",
        title: "Summer Slam",
        subtitle: "International Championship",
        status: "ongoing",
        date: "Jun 15-30",
        duration: "2 weeks",
        location: "Berlin, Germany",
        prizePool: "$15,000",
        teamsRegistered: 18,
        teamsMax: 24,
        daysUntil: 0,
        progress: 75,
      },
      {
        id: "2",
        title: "European Cup",
        subtitle: "Regional Qualifier",
        status: "registration",
        date: "Aug 1-15",
        duration: "2 weeks",
        location: "Paris, France",
        prizePool: "$10,000",
        teamsRegistered: 12,
        teamsMax: 20,
        daysUntil: 30,
        progress: 0,
      },
    ]);

    // Load 2027 tournaments
    this.tournaments2027.set([
      {
        id: "3",
        title: "Winter League",
        subtitle: "Indoor Flag Football",
        status: "upcoming",
        date: "Dec 1-15",
        duration: "2 weeks",
        location: "Chicago, USA",
        prizePool: "$7,500",
        teamsRegistered: 0,
        teamsMax: 24,
        daysUntil: 60,
        progress: 0,
      },
    ]);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      upcoming: "Coming Soon",
      ongoing: "In Progress",
      completed: "Completed",
      registration: "Registration Open",
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): "info" | "success" | "secondary" | "warn" {
    const severities: Record<string, "info" | "success" | "secondary" | "warn"> = {
      upcoming: "info",
      ongoing: "success",
      completed: "secondary",
      registration: "warn",
    };
    return severities[status] || "info";
  }

  trackByTournamentId(index: number, tournament: Tournament): string {
    return tournament.id;
  }
}
