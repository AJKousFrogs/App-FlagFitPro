import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";

interface TeamStat {
  value: string;
  label: string;
}

interface StaffMember {
  name: string;
  position: string;
  country: string;
  experience: string;
  achievements?: string[];
}

interface Player {
  name: string;
  position: string;
  jersey: string;
  country: string;
  age: number;
  height: string;
  weight: string;
  stats?: any;
}

@Component({
  selector: "app-roster",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, TagModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="roster-page">
        <!-- Team Header Card -->
        <p-card class="team-header-card">
          <div class="team-badge">
            <span>International</span>
            <span class="separator">•</span>
            <span>Flag Football</span>
          </div>
          <h2 class="team-title">International Flag Football Team</h2>
          <p class="team-description">
            Meet our world-class athletes and coaching staff representing 12
            countries
          </p>
        </p-card>

        <!-- Team Overview Stats -->
        <p-card class="overview-card">
          <ng-template pTemplate="header">
            <h2 class="card-title">
              <i class="pi pi-trophy"></i>
              Team Overview
            </h2>
          </ng-template>
          <div class="team-overview-grid">
            @for (stat of teamStats(); track trackByStatLabel($index, stat)) {
              <div class="overview-stat">
                <div class="overview-value">{{ stat.value }}</div>
                <div class="overview-label">{{ stat.label }}</div>
              </div>
            }
          </div>
        </p-card>

        <!-- Coaching Staff -->
        <div class="position-section">
          <h2 class="section-title">
            <i class="pi pi-users"></i>
            Coaching Staff & Support
          </h2>
          <div class="roster-grid">
            @for (
              member of coachingStaff();
              track trackByMemberName($index, member)
            ) {
              <p-card class="staff-card">
                <div class="player-header">
                  <div class="player-jersey">
                    {{ getInitials(member.name) }}
                  </div>
                  <div class="player-info">
                    <h3 class="player-name">{{ member.name }}</h3>
                    <div class="player-position">{{ member.position }}</div>
                    <div class="player-meta">
                      {{ member.experience }} experience
                    </div>
                  </div>
                </div>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-value">
                      {{ getYears(member.experience) }}
                    </div>
                    <div class="stat-label">Years</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ member.country }}</div>
                    <div class="stat-label">Country</div>
                  </div>
                </div>
                @if (member.achievements && member.achievements.length > 0) {
                  <div class="achievements">
                    <div class="achievements-title">Key Achievements:</div>
                    @for (
                      achievement of member.achievements.slice(0, 2);
                      track trackByAchievement($index, achievement)
                    ) {
                      <div class="achievement-item">• {{ achievement }}</div>
                    }
                  </div>
                }
              </p-card>
            }
          </div>
        </div>

        <!-- Players by Position -->
        @for (
          positionGroup of playersByPosition();
          track trackByPosition($index, positionGroup)
        ) {
          <div class="position-section">
            <h2 class="section-title">
              <i [class]="getPositionIcon(positionGroup.position)"></i>
              {{ positionGroup.position }}
            </h2>
            <div class="roster-grid">
              @for (
                player of positionGroup.players;
                track trackByPlayerJersey($index, player)
              ) {
                <p-card class="player-card">
                  <div class="player-header">
                    <div
                      class="player-jersey"
                      [style.background]="getJerseyColor(player.position)"
                    >
                      {{ player.jersey }}
                    </div>
                    <div class="player-info">
                      <h3 class="player-name">{{ player.name }}</h3>
                      <div class="player-position">{{ player.position }}</div>
                      <div class="player-meta">
                        <span>{{ player.country }}</span>
                        <span class="separator">•</span>
                        <span>Age {{ player.age }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="player-details">
                    <div class="detail-item">
                      <span class="detail-label">Height:</span>
                      <span class="detail-value">{{ player.height }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Weight:</span>
                      <span class="detail-value">{{ player.weight }}</span>
                    </div>
                  </div>
                  @if (player.stats) {
                    <div class="player-stats">
                      @for (
                        stat of getPlayerStats(player);
                        track trackByStatKey($index, stat)
                      ) {
                        <p-tag
                          [value]="stat.label + ': ' + stat.value"
                          severity="info"
                          styleClass="mr-2 mb-2"
                        ></p-tag>
                      }
                    </div>
                  }
                </p-card>
              }
            </div>
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .roster-page {
        padding: var(--space-6);
      }

      .team-header-card {
        margin-bottom: var(--space-6);
      }

      .team-badge {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
      }

      .separator {
        opacity: 0.5;
      }

      .team-title {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: var(--space-4);
        color: var(--text-primary);
      }

      .team-description {
        font-size: 1rem;
        color: var(--text-secondary);
        line-height: 1.6;
        margin: 0;
      }

      .overview-card {
        margin-bottom: var(--space-8);
      }

      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }

      .card-title i {
        color: var(--color-brand-primary);
      }

      .team-overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .overview-stat {
        text-align: center;
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        transition: transform 0.2s;
      }

      .overview-stat:hover {
        transform: translateY(-2px);
      }

      .overview-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-brand-primary);
        margin-bottom: var(--space-2);
      }

      .overview-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .position-section {
        margin-bottom: var(--space-8);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: var(--space-6);
        color: var(--text-primary);
      }

      .section-title i {
        color: var(--color-brand-primary);
      }

      .roster-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--space-6);
      }

      .staff-card,
      .player-card {
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      .staff-card:hover,
      .player-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .player-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .player-jersey {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.125rem;
        color: white;
        background: linear-gradient(
          135deg,
          var(--color-brand-primary),
          var(--color-brand-secondary)
        );
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
      }

      .player-info {
        flex: 1;
        min-width: 0;
      }

      .player-name {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: var(--space-1);
        color: var(--text-primary);
      }

      .player-position {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 500;
        margin-bottom: var(--space-1);
      }

      .player-meta {
        font-size: 0.875rem;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-top: var(--space-4);
      }

      .stat-item {
        text-align: center;
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .stat-value {
        font-weight: 700;
        font-size: 1.125rem;
        color: var(--color-brand-primary);
        margin-bottom: var(--space-1);
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .achievements {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .achievements-title {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
        margin-bottom: var(--space-2);
      }

      .achievement-item {
        font-size: 0.75rem;
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .player-details {
        display: flex;
        gap: var(--space-4);
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .detail-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .detail-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .player-stats {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      @media (max-width: 768px) {
        .roster-grid {
          grid-template-columns: 1fr;
        }

        .team-overview-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class RosterComponent implements OnInit {
  private apiService = inject(ApiService);

  teamStats = signal<TeamStat[]>([]);
  coachingStaff = signal<StaffMember[]>([]);
  playersByPosition = signal<any[]>([]);

  ngOnInit(): void {
    this.loadRosterData();
  }

  loadRosterData(): void {
    // Load team stats
    this.teamStats.set([
      { value: "20", label: "Total Players" },
      { value: "12", label: "Countries Represented" },
      { value: "26", label: "Average Age" },
      { value: "15-3", label: "Win-Loss Record" },
      { value: "8.7", label: "Olympic Qualification Score" },
    ]);

    // Load coaching staff
    this.coachingStaff.set([
      {
        name: "John Smith",
        position: "Head Coach",
        country: "USA",
        experience: "15 years",
        achievements: ["World Championship 2023", "Olympic Gold 2020"],
      },
      {
        name: "Maria Garcia",
        position: "Strength & Conditioning",
        country: "Spain",
        experience: "10 years",
        achievements: ["Elite Performance Specialist"],
      },
      {
        name: "David Chen",
        position: "Technical Director",
        country: "China",
        experience: "12 years",
        achievements: ["Technical Excellence Award"],
      },
    ]);

    // Load players by position
    this.playersByPosition.set([
      {
        position: "Quarterback",
        players: [
          {
            name: "Alex Johnson",
            position: "QB",
            jersey: "10",
            country: "USA",
            age: 28,
            height: "6'2\"",
            weight: "210 lbs",
            stats: { completion: "85%", touchdowns: 24 },
          },
          {
            name: "Luis Rodriguez",
            position: "QB",
            jersey: "7",
            country: "Mexico",
            age: 26,
            height: "6'0\"",
            weight: "195 lbs",
            stats: { completion: "82%", touchdowns: 18 },
          },
        ],
      },
      {
        position: "Wide Receiver",
        players: [
          {
            name: "Sarah Williams",
            position: "WR",
            jersey: "21",
            country: "Canada",
            age: 24,
            height: "5'10\"",
            weight: "180 lbs",
            stats: { receptions: 45, yards: 680 },
          },
        ],
      },
    ]);
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  }

  getYears(experience: string): string {
    return experience.split(" ")[0];
  }

  getPositionIcon(position: string): string {
    const icons: Record<string, string> = {
      Quarterback: "pi pi-user",
      "Wide Receiver": "pi pi-users",
      "Running Back": "pi pi-bolt",
      "Defensive Back": "pi pi-shield",
      Rusher: "pi pi-forward",
    };
    return icons[position] || "pi pi-user";
  }

  getJerseyColor(position: string): string {
    // Use design system colors - gradients use actual color values since CSS vars don't work in gradients
    const primaryGreen = "#089949"; // var(--ds-primary-green) equivalent
    const primaryLight = "#10c96b"; // var(--color-brand-primary-light) equivalent
    const colors: Record<string, string> = {
      QB: `linear-gradient(135deg, ${primaryGreen}, ${primaryLight})`,
      WR: "linear-gradient(135deg, #3498db, #2980b9)",
      RB: "linear-gradient(135deg, #e74c3c, #c0392b)",
      DB: "linear-gradient(135deg, #9b59b6, #8e44ad)",
      Rusher: "linear-gradient(135deg, #f39c12, #e67e22)",
    };
    return (
      colors[position] ||
      `linear-gradient(135deg, ${primaryGreen}, ${primaryLight})`
    );
  }

  getPlayerStats(player: Player): any[] {
    if (!player.stats) return [];
    return Object.entries(player.stats).map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
      key: key,
    }));
  }

  trackByStatLabel(index: number, stat: TeamStat): string {
    return stat.label;
  }

  trackByMemberName(index: number, member: StaffMember): string {
    return member.name;
  }

  trackByAchievement(index: number, achievement: string): string {
    return achievement;
  }

  trackByPosition(index: number, positionGroup: any): string {
    return positionGroup.position;
  }

  trackByPlayerJersey(index: number, player: Player): string {
    return player.jersey;
  }

  trackByStatKey(index: number, stat: any): string {
    return stat.key || index.toString();
  }
}
