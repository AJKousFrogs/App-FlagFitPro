import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Textarea } from "primeng/textarea";
import { Tooltip } from "primeng/tooltip";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// Interfaces based on FEATURE_DOCUMENTATION.md §44
interface OpponentPlayer {
  name: string;
  number: string;
  position: string;
  notes: string;
  threatLevel: "high" | "medium" | "low";
  tendencies: string[];
}

interface OpponentProfile {
  id: string;
  teamName: string;
  teamLogo?: string;
  conference?: string;
  record: { wins: number; losses: number; ties: number };
  lastMeetingResult?: string;
  headToHeadRecord?: { wins: number; losses: number };
  headCoach?: string;
  offensiveStyle?: string;
  defensiveStyle?: string;
  keyPlayers: OpponentPlayer[];
  generalNotes?: string;
  lastUpdated: Date;
  updatedBy: string;
}

interface TeamTendencies {
  opponentId: string;
  offensive: {
    formationFrequency: { formation: string; percentage: number }[];
    playTypeDistribution: {
      quickPass: number;
      deepPass: number;
      qbRun: number;
      screen: number;
    };
    redZoneTendencies: string[];
    thirdDownTendencies: string[];
    favoriteTargets: { player: string; targetShare: number }[];
  };
  defensive: {
    coverageFrequency: { coverage: string; percentage: number }[];
    blitzRate: number;
    blitzTendencies: string[];
    weaknesses: string[];
  };
  specialSituations: {
    twoPointPlays: string[];
    hurryUpOffense: string[];
    endOfHalfStrategy: string[];
  };
}

interface ScoutingReport {
  id: string;
  opponentId: string;
  opponentName: string;
  gameDate: Date;
  createdBy: string;
  executiveSummary: string;
  offensiveGamePlan: {
    attackPoints: string[];
    playsToRun: string[];
    avoidAreas: string[];
  };
  defensiveGamePlan: {
    coverageAdjustments: string[];
    blitzPlan: string[];
    playerMatchups: { ourPlayer: string; theirPlayer: string; notes: string }[];
  };
  sharedWith: "team" | "coaches_only";
  requiredReading: boolean;
  readBy: string[];
  createdAt: Date;
}

@Component({
  selector: "app-scouting-reports",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Card,
    Dialog,
    InputText,
    Select,
    TableModule,
    TableModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    StatusTagComponent,
    Textarea,
    Tooltip,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="scouting-reports">
        <app-page-header
          title="Scouting Reports"
          subtitle="Analyze opponents and prepare game plans"
          icon="pi-search"
        >
          <app-button
            iconLeft="pi-plus"
            (clicked)="showNewReportDialog.set(true)"
            >New Report</app-button
          >
        </app-page-header>

        @if (loading()) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading scouting data...</span>
          </div>
        } @else {
          <p-tabs [value]="0">
            <p-tablist>
              <p-tab [value]="0">
                <i class="pi pi-file"></i>
                Reports
              </p-tab>
              <p-tab [value]="1">
                <i class="pi pi-users"></i>
                Opponents
              </p-tab>
              <p-tab [value]="2">
                <i class="pi pi-chart-bar"></i>
                Tendencies
              </p-tab>
            </p-tablist>

            <p-tabpanels>
              <!-- Reports Tab -->
              <p-tabpanel [value]="0">
                <div class="reports-section">
                  <div class="section-header">
                    <h3>Scouting Reports</h3>
                    <div class="filter-group">
                      <p-select
                        [options]="opponentFilterOptions()"
                        [(ngModel)]="selectedOpponentFilter"
                        placeholder="Filter by opponent"
                        [showClear]="true"
                      ></p-select>
                    </div>
                  </div>

                  @if (filteredReports().length > 0) {
                    <div class="reports-grid">
                      @for (report of filteredReports(); track report.id) {
                        <p-card styleClass="report-card">
                          <ng-template #header>
                            <div class="report-header">
                              <div class="opponent-info">
                                <span class="opponent-name">{{
                                  report.opponentName
                                }}</span>
                                <span class="game-date">{{
                                  report.gameDate | date: "mediumDate"
                                }}</span>
                              </div>
                              <app-status-tag
                                [value]="
                                  report.sharedWith === 'team'
                                    ? 'Team'
                                    : 'Coaches'
                                "
                                [severity]="
                                  report.sharedWith === 'team'
                                    ? 'info'
                                    : 'secondary'
                                "
                                size="sm"
                              />
                            </div>
                          </ng-template>

                          <div class="report-summary">
                            <p>{{ report.executiveSummary }}</p>
                          </div>

                          <div class="report-meta">
                            <span class="created-by">
                              <i class="pi pi-user"></i>
                              {{ report.createdBy }}
                            </span>
                            @if (report.requiredReading) {
                              <span class="required-badge">
                                <i class="pi pi-exclamation-circle"></i>
                                Required Reading
                              </span>
                            }
                            <span class="read-count">
                              <i class="pi pi-eye"></i>
                              {{ report.readBy.length }} viewed
                            </span>
                          </div>

                          <ng-template #footer>
                            <app-button
                              variant="text"
                              iconLeft="pi-eye"
                              (clicked)="viewReport(report)"
                              >View Full Report</app-button
                            >
                            <app-button
                              variant="text"
                              iconLeft="pi-share-alt"
                              (clicked)="shareToChat(report)"
                              >Share to Chat</app-button
                            >
                            <app-icon-button
                              icon="pi-pencil"
                              variant="text"
                              (clicked)="editReport(report)"
                              ariaLabel="Edit scouting report"
                              tooltip="Edit"
                            />
                          </ng-template>
                        </p-card>
                      }
                    </div>
                  } @else {
                    <div class="empty-state">
                      <i class="pi pi-file"></i>
                      <h4>No Scouting Reports</h4>
                      <p>
                        Create a report to prepare your team for upcoming games.
                      </p>
                      <app-button
                        iconLeft="pi-plus"
                        (clicked)="showNewReportDialog.set(true)"
                        >Create Report</app-button
                      >
                    </div>
                  }
                </div>
              </p-tabpanel>

              <!-- Opponents Tab -->
              <p-tabpanel [value]="1">
                <div class="opponents-section">
                  <div class="section-header">
                    <h3>Opponent Database</h3>
                    <app-button
                      variant="outlined"
                      iconLeft="pi-plus"
                      (clicked)="showAddOpponentDialog.set(true)"
                      >Add Opponent</app-button
                    >
                  </div>

                  <div class="opponents-grid">
                    @for (opponent of opponents(); track opponent.id) {
                      <p-card styleClass="opponent-card">
                        <ng-template #header>
                          <div class="opponent-header">
                            <div class="team-info">
                              <span class="team-name">{{
                                opponent.teamName
                              }}</span>
                              @if (opponent.conference) {
                                <span class="conference">{{
                                  opponent.conference
                                }}</span>
                              }
                            </div>
                            <div class="record">
                              {{ opponent.record.wins }}-{{
                                opponent.record.losses
                              }}
                              @if (opponent.record.ties > 0) {
                                -{{ opponent.record.ties }}
                              }
                            </div>
                          </div>
                        </ng-template>

                        <div class="opponent-details">
                          @if (opponent.headCoach) {
                            <div class="detail-row">
                              <span class="label">Head Coach:</span>
                              <span class="value">{{
                                opponent.headCoach
                              }}</span>
                            </div>
                          }
                          @if (opponent.offensiveStyle) {
                            <div class="detail-row">
                              <span class="label">Offensive Style:</span>
                              <span class="value">{{
                                opponent.offensiveStyle
                              }}</span>
                            </div>
                          }
                          @if (opponent.defensiveStyle) {
                            <div class="detail-row">
                              <span class="label">Defensive Style:</span>
                              <span class="value">{{
                                opponent.defensiveStyle
                              }}</span>
                            </div>
                          }

                          @if (opponent.keyPlayers.length > 0) {
                            <div class="key-players">
                              <span class="label">Key Players:</span>
                              <div class="player-list">
                                @for (
                                  player of opponent.keyPlayers.slice(0, 3);
                                  track player.name
                                ) {
                                  <span
                                    class="player-badge"
                                    [class]="player.threatLevel"
                                    pTooltip="{{ player.notes }}"
                                  >
                                    #{{ player.number }} {{ player.name }} ({{
                                      player.position
                                    }})
                                  </span>
                                }
                                @if (opponent.keyPlayers.length > 3) {
                                  <span class="more-players"
                                    >+{{
                                      opponent.keyPlayers.length - 3
                                    }}
                                    more</span
                                  >
                                }
                              </div>
                            </div>
                          }

                          @if (opponent.lastMeetingResult) {
                            <div class="last-meeting">
                              <span class="label">Last Meeting:</span>
                              <span class="value">{{
                                opponent.lastMeetingResult
                              }}</span>
                            </div>
                          }
                        </div>

                        <ng-template #footer>
                          <app-button
                            variant="text"
                            iconLeft="pi-eye"
                            (clicked)="viewOpponent(opponent)"
                            >View Profile</app-button
                          >
                          <app-button
                            variant="text"
                            iconLeft="pi-file"
                            (clicked)="createReportForOpponent(opponent)"
                            >Create Report</app-button
                          >
                        </ng-template>
                      </p-card>
                    }
                  </div>
                </div>
              </p-tabpanel>

              <!-- Tendencies Tab -->
              <p-tabpanel [value]="2">
                <div class="tendencies-section">
                  <div class="section-header">
                    <h3>Team Tendencies Analysis</h3>
                    <p-select
                      [options]="opponentFilterOptions()"
                      [(ngModel)]="selectedTendencyOpponent"
                      placeholder="Select opponent"
                      (onValueChange)="onTendencyOpponentChange()"
                    ></p-select>
                  </div>

                  @if (selectedTendencyOpponent && currentTendencies()) {
                    <div class="tendencies-content">
                      <!-- Offensive Tendencies -->
                      <p-card header="Offensive Tendencies">
                        <div class="tendency-section">
                          <h5>Formation Frequency</h5>
                          <div class="formation-bars">
                            @for (
                              formation of currentTendencies()!.offensive
                                .formationFrequency;
                              track formation.formation
                            ) {
                              <div class="formation-bar">
                                <span class="formation-name">{{
                                  formation.formation
                                }}</span>
                                <div class="bar-container">
                                  <div
                                    class="bar-fill"
                                    [style.width.%]="formation.percentage"
                                  ></div>
                                </div>
                                <span class="percentage"
                                  >{{ formation.percentage }}%</span
                                >
                              </div>
                            }
                          </div>
                        </div>

                        <div class="tendency-section">
                          <h5>Play Type Distribution</h5>
                          <div class="play-distribution">
                            <div class="play-type">
                              <span class="type-name">Quick Pass</span>
                              <span class="type-value"
                                >{{
                                  currentTendencies()!.offensive
                                    .playTypeDistribution.quickPass
                                }}%</span
                              >
                            </div>
                            <div class="play-type">
                              <span class="type-name">Deep Pass</span>
                              <span class="type-value"
                                >{{
                                  currentTendencies()!.offensive
                                    .playTypeDistribution.deepPass
                                }}%</span
                              >
                            </div>
                            <div class="play-type">
                              <span class="type-name">QB Run</span>
                              <span class="type-value"
                                >{{
                                  currentTendencies()!.offensive
                                    .playTypeDistribution.qbRun
                                }}%</span
                              >
                            </div>
                            <div class="play-type">
                              <span class="type-name">Screen</span>
                              <span class="type-value"
                                >{{
                                  currentTendencies()!.offensive
                                    .playTypeDistribution.screen
                                }}%</span
                              >
                            </div>
                          </div>
                        </div>

                        @if (
                          currentTendencies()!.offensive.redZoneTendencies
                            .length > 0
                        ) {
                          <div class="tendency-section">
                            <h5>Red Zone Tendencies</h5>
                            <ul class="tendency-list">
                              @for (
                                tendency of currentTendencies()!.offensive
                                  .redZoneTendencies;
                                track $index
                              ) {
                                <li>{{ tendency }}</li>
                              }
                            </ul>
                          </div>
                        }

                        @if (
                          currentTendencies()!.offensive.favoriteTargets
                            .length > 0
                        ) {
                          <div class="tendency-section">
                            <h5>Favorite Targets</h5>
                            <div class="targets-list">
                              @for (
                                target of currentTendencies()!.offensive
                                  .favoriteTargets;
                                track target.player
                              ) {
                                <div class="target-item">
                                  <span class="target-name">{{
                                    target.player
                                  }}</span>
                                  <span class="target-share"
                                    >{{ target.targetShare }}% target
                                    share</span
                                  >
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </p-card>

                      <!-- Defensive Tendencies -->
                      <p-card header="Defensive Tendencies">
                        <div class="tendency-section">
                          <h5>Coverage Frequency</h5>
                          <div class="formation-bars">
                            @for (
                              coverage of currentTendencies()!.defensive
                                .coverageFrequency;
                              track coverage.coverage
                            ) {
                              <div class="formation-bar">
                                <span class="formation-name">{{
                                  coverage.coverage
                                }}</span>
                                <div class="bar-container">
                                  <div
                                    class="bar-fill defensive"
                                    [style.width.%]="coverage.percentage"
                                  ></div>
                                </div>
                                <span class="percentage"
                                  >{{ coverage.percentage }}%</span
                                >
                              </div>
                            }
                          </div>
                        </div>

                        <div class="tendency-section">
                          <h5>Blitz Rate</h5>
                          <div class="blitz-rate">
                            <span class="rate-value"
                              >{{
                                currentTendencies()!.defensive.blitzRate
                              }}%</span
                            >
                            <span class="rate-label">of plays</span>
                          </div>
                          @if (
                            currentTendencies()!.defensive.blitzTendencies
                              .length > 0
                          ) {
                            <ul class="tendency-list">
                              @for (
                                tendency of currentTendencies()!.defensive
                                  .blitzTendencies;
                                track $index
                              ) {
                                <li>{{ tendency }}</li>
                              }
                            </ul>
                          }
                        </div>

                        @if (
                          currentTendencies()!.defensive.weaknesses.length > 0
                        ) {
                          <div class="tendency-section weaknesses">
                            <h5>
                              <i class="pi pi-exclamation-triangle"></i>
                              Weaknesses to Exploit
                            </h5>
                            <ul class="tendency-list">
                              @for (
                                weakness of currentTendencies()!.defensive
                                  .weaknesses;
                                track $index
                              ) {
                                <li>{{ weakness }}</li>
                              }
                            </ul>
                          </div>
                        }
                      </p-card>

                      <!-- Special Situations -->
                      <p-card header="Special Situations">
                        @if (
                          currentTendencies()!.specialSituations.twoPointPlays
                            .length > 0
                        ) {
                          <div class="tendency-section">
                            <h5>2-Point Conversion Plays</h5>
                            <ul class="tendency-list">
                              @for (
                                play of currentTendencies()!.specialSituations
                                  .twoPointPlays;
                                track $index
                              ) {
                                <li>{{ play }}</li>
                              }
                            </ul>
                          </div>
                        }

                        @if (
                          currentTendencies()!.specialSituations.hurryUpOffense
                            .length > 0
                        ) {
                          <div class="tendency-section">
                            <h5>Hurry-Up Offense</h5>
                            <ul class="tendency-list">
                              @for (
                                tendency of currentTendencies()!
                                  .specialSituations.hurryUpOffense;
                                track $index
                              ) {
                                <li>{{ tendency }}</li>
                              }
                            </ul>
                          </div>
                        }

                        @if (
                          currentTendencies()!.specialSituations
                            .endOfHalfStrategy.length > 0
                        ) {
                          <div class="tendency-section">
                            <h5>End of Half Strategy</h5>
                            <ul class="tendency-list">
                              @for (
                                strategy of currentTendencies()!
                                  .specialSituations.endOfHalfStrategy;
                                track $index
                              ) {
                                <li>{{ strategy }}</li>
                              }
                            </ul>
                          </div>
                        }
                      </p-card>
                    </div>
                  } @else {
                    <div class="select-prompt">
                      <i class="pi pi-chart-bar"></i>
                      <p>Select an opponent to view their tendencies</p>
                    </div>
                  }
                </div>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        }

        <!-- New Report Dialog -->
        <p-dialog
          header="Create Scouting Report"
          [(visible)]="showNewReportDialog"
          [modal]="true"
          [style]="{ width: '700px' }"
          [dismissableMask]="true"
        >
          <div class="report-form">
            <div class="form-group">
              <label>Opponent</label>
              <p-select
                [options]="opponentFilterOptions()"
                [(ngModel)]="newReport.opponentId"
                placeholder="Select opponent"
                styleClass="w-full"
              ></p-select>
            </div>

            <div class="form-group">
              <label>Game Date</label>
              <input
                type="date"
                pInputText
                [(ngModel)]="newReport.gameDate"
                class="w-full"
              />
            </div>

            <div class="form-group">
              <label>Executive Summary</label>
              <textarea
                pInputTextarea
                [(ngModel)]="newReport.executiveSummary"
                rows="4"
                placeholder="2-3 paragraph overview of the opponent..."
                class="w-full"
              ></textarea>
            </div>

            <div class="form-section">
              <h4>Offensive Game Plan</h4>
              <div class="form-group">
                <label>Attack Points</label>
                <textarea
                  pInputTextarea
                  [(ngModel)]="newReport.attackPoints"
                  rows="2"
                  placeholder="Where to attack their defense (one per line)"
                  class="w-full"
                ></textarea>
              </div>
              <div class="form-group">
                <label>Plays to Run</label>
                <textarea
                  pInputTextarea
                  [(ngModel)]="newReport.playsToRun"
                  rows="2"
                  placeholder="Specific plays from playbook (one per line)"
                  class="w-full"
                ></textarea>
              </div>
            </div>

            <div class="form-section">
              <h4>Defensive Game Plan</h4>
              <div class="form-group">
                <label>Coverage Adjustments</label>
                <textarea
                  pInputTextarea
                  [(ngModel)]="newReport.coverageAdjustments"
                  rows="2"
                  placeholder="Coverage changes needed (one per line)"
                  class="w-full"
                ></textarea>
              </div>
              <div class="form-group">
                <label>Blitz Plan</label>
                <textarea
                  pInputTextarea
                  [(ngModel)]="newReport.blitzPlan"
                  rows="2"
                  placeholder="When and how to blitz (one per line)"
                  class="w-full"
                ></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Share With</label>
                <p-select
                  [options]="shareOptions"
                  [(ngModel)]="newReport.sharedWith"
                  styleClass="w-full"
                ></p-select>
              </div>
              <div class="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="newReport.requiredReading"
                  />
                  Mark as required reading
                </label>
              </div>
            </div>
          </div>
          <ng-template #footer>
            <app-button
              variant="text"
              (clicked)="showNewReportDialog.set(false)"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-check" (clicked)="createReport()"
              >Create Report</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- View Report Dialog -->
        <p-dialog
          header="Scouting Report"
          [(visible)]="showViewReportDialog"
          [modal]="true"
          [style]="{ width: '800px' }"
          [dismissableMask]="true"
        >
          @if (viewingReport()) {
            <div class="view-report">
              <div class="report-meta-header">
                <div>
                  <h3>vs {{ viewingReport()!.opponentName }}</h3>
                  <p>{{ viewingReport()!.gameDate | date: "fullDate" }}</p>
                </div>
                <app-status-tag
                  [value]="
                    viewingReport()!.requiredReading
                      ? 'Required Reading'
                      : 'Optional'
                  "
                  [severity]="
                    viewingReport()!.requiredReading ? 'danger' : 'info'
                  "
                  size="sm"
                />
              </div>

              <div class="report-section">
                <h4>Executive Summary</h4>
                <p>{{ viewingReport()!.executiveSummary }}</p>
              </div>

              <div class="report-section">
                <h4>Offensive Game Plan</h4>
                <div class="plan-grid">
                  <div class="plan-item">
                    <h5>Attack Points</h5>
                    <ul>
                      @for (
                        point of viewingReport()!.offensiveGamePlan
                          .attackPoints;
                        track $index
                      ) {
                        <li>{{ point }}</li>
                      }
                    </ul>
                  </div>
                  <div class="plan-item">
                    <h5>Plays to Run</h5>
                    <ul>
                      @for (
                        play of viewingReport()!.offensiveGamePlan.playsToRun;
                        track $index
                      ) {
                        <li>{{ play }}</li>
                      }
                    </ul>
                  </div>
                </div>
              </div>

              <div class="report-section">
                <h4>Defensive Game Plan</h4>
                <div class="plan-grid">
                  <div class="plan-item">
                    <h5>Coverage Adjustments</h5>
                    <ul>
                      @for (
                        adj of viewingReport()!.defensiveGamePlan
                          .coverageAdjustments;
                        track $index
                      ) {
                        <li>{{ adj }}</li>
                      }
                    </ul>
                  </div>
                  <div class="plan-item">
                    <h5>Blitz Plan</h5>
                    <ul>
                      @for (
                        plan of viewingReport()!.defensiveGamePlan.blitzPlan;
                        track $index
                      ) {
                        <li>{{ plan }}</li>
                      }
                    </ul>
                  </div>
                </div>
              </div>

              @if (
                viewingReport()!.defensiveGamePlan.playerMatchups.length > 0
              ) {
                <div class="report-section">
                  <h4>Key Matchups</h4>
                  <div class="matchups-list">
                    @for (
                      matchup of viewingReport()!.defensiveGamePlan
                        .playerMatchups;
                      track $index
                    ) {
                      <div class="matchup">
                        <span class="our-player">{{ matchup.ourPlayer }}</span>
                        <span class="vs">vs</span>
                        <span class="their-player">{{
                          matchup.theirPlayer
                        }}</span>
                        @if (matchup.notes) {
                          <span class="matchup-notes">{{ matchup.notes }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
          <ng-template #footer>
            <app-button
              variant="text"
              iconLeft="pi-share-alt"
              (clicked)="shareToChat(viewingReport()!)"
              >Share to Chat</app-button
            >
            <app-button
              iconLeft="pi-download"
              (clicked)="exportReport(viewingReport()!)"
              >Export PDF</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Add Opponent Dialog -->
        <p-dialog
          header="Add Opponent"
          [(visible)]="showAddOpponentDialog"
          [modal]="true"
          [style]="{ width: '500px' }"
          [dismissableMask]="true"
        >
          <div class="opponent-form">
            <div class="form-group">
              <label>Team Name</label>
              <input
                type="text"
                pInputText
                [(ngModel)]="newOpponent.teamName"
                placeholder="e.g., Phoenix Flames"
                class="w-full"
              />
            </div>
            <div class="form-group">
              <label>Conference/League</label>
              <input
                type="text"
                pInputText
                [(ngModel)]="newOpponent.conference"
                placeholder="e.g., Western Division"
                class="w-full"
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Wins</label>
                <input
                  type="number"
                  pInputText
                  [(ngModel)]="newOpponent.wins"
                  min="0"
                  class="w-full"
                />
              </div>
              <div class="form-group">
                <label>Losses</label>
                <input
                  type="number"
                  pInputText
                  [(ngModel)]="newOpponent.losses"
                  min="0"
                  class="w-full"
                />
              </div>
            </div>
            <div class="form-group">
              <label>Head Coach</label>
              <input
                type="text"
                pInputText
                [(ngModel)]="newOpponent.headCoach"
                class="w-full"
              />
            </div>
            <div class="form-group">
              <label>Offensive Style</label>
              <p-select
                [options]="offensiveStyles"
                [(ngModel)]="newOpponent.offensiveStyle"
                placeholder="Select style"
                styleClass="w-full"
              ></p-select>
            </div>
            <div class="form-group">
              <label>Defensive Style</label>
              <p-select
                [options]="defensiveStyles"
                [(ngModel)]="newOpponent.defensiveStyle"
                placeholder="Select style"
                styleClass="w-full"
              ></p-select>
            </div>
          </div>
          <ng-template #footer>
            <app-button
              variant="text"
              (clicked)="showAddOpponentDialog.set(false)"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-plus" (clicked)="addOpponent()"
              >Add Opponent</app-button
            >
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrls: ["./scouting-reports.component.scss"],
})
export class ScoutingReportsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private logger = inject(LoggerService);

  // State
  loading = signal(true);
  reports = signal<ScoutingReport[]>([]);
  opponents = signal<OpponentProfile[]>([]);
  tendenciesMap = signal<Map<string, TeamTendencies>>(new Map());
  currentTendencies = signal<TeamTendencies | null>(null);

  // UI State
  selectedOpponentFilter: string | null = null;
  selectedTendencyOpponent: string | null = null;
  showNewReportDialog = signal(false);
  showViewReportDialog = signal(false);
  showAddOpponentDialog = signal(false);
  viewingReport = signal<ScoutingReport | null>(null);

  // Form data
  newReport = {
    opponentId: "",
    gameDate: "",
    executiveSummary: "",
    attackPoints: "",
    playsToRun: "",
    coverageAdjustments: "",
    blitzPlan: "",
    sharedWith: "team" as "team" | "coaches_only",
    requiredReading: false,
  };

  newOpponent = {
    teamName: "",
    conference: "",
    wins: 0,
    losses: 0,
    headCoach: "",
    offensiveStyle: "",
    defensiveStyle: "",
  };

  // Options
  shareOptions = [
    { label: "Share with entire team", value: "team" },
    { label: "Coaches only", value: "coaches_only" },
  ];

  offensiveStyles = [
    { label: "Pass-heavy", value: "Pass-heavy" },
    { label: "Balanced", value: "Balanced" },
    { label: "QB-run focused", value: "QB-run focused" },
    { label: "Spread offense", value: "Spread offense" },
    { label: "Short passing game", value: "Short passing game" },
  ];

  defensiveStyles = [
    { label: "Man coverage", value: "Man coverage" },
    { label: "Zone coverage", value: "Zone coverage" },
    { label: "Aggressive blitz", value: "Aggressive blitz" },
    { label: "Contain/Conservative", value: "Contain" },
    { label: "Mixed/Hybrid", value: "Mixed" },
  ];

  // Computed
  opponentFilterOptions = computed(() =>
    this.opponents().map((o) => ({
      label: o.teamName,
      value: o.id,
    })),
  );

  filteredReports = computed(() => {
    if (!this.selectedOpponentFilter) return this.reports();
    return this.reports().filter(
      (r) => r.opponentId === this.selectedOpponentFilter,
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      // Load scouting reports from API
      const [reportsRes, opponentsRes] = await Promise.all([
        firstValueFrom(
          this.api.get<{
            reports: Array<{
              id: string;
              opponent_name: string;
              opponent_profile: {
                city?: string;
                conference?: string;
                coach?: string;
                record?: string;
              };
              game_date: string;
              offensive_notes: string;
              defensive_notes: string;
              key_players: Array<{
                name: string;
                number: string;
                position: string;
                notes: string;
              }>;
              tendencies: Record<string, unknown>;
              game_plan: Record<string, unknown>;
              status: string;
              created_at: string;
              created_by_user?: { full_name: string };
            }>;
          }>("/api/scouting/reports"),
        ),
        firstValueFrom(
          this.api.get<{
            opponents: Array<{
              name: string;
              opponentTeamId?: string;
              profile: {
                city?: string;
                conference?: string;
                coach?: string;
                notes?: string;
              };
              tendencies: Record<string, unknown>;
              gamesPlayed: number;
              wins: number;
              losses: number;
              lastPlayed: string;
            }>;
          }>("/api/scouting/opponents"),
        ),
      ]);

      // Transform reports
      if (reportsRes?.data?.reports) {
        const reports: ScoutingReport[] = reportsRes.data.reports.map((r) => ({
          id: r.id,
          opponentId: r.opponent_name,
          opponentName: r.opponent_name,
          gameDate: r.game_date ? new Date(r.game_date) : new Date(),
          createdBy: r.created_by_user?.full_name || "Unknown",
          executiveSummary: r.offensive_notes || "",
          offensiveGamePlan: {
            attackPoints: [],
            playsToRun: [],
            avoidAreas: [],
            ...(r.game_plan as Record<string, unknown>),
          },
          defensiveGamePlan: {
            coverageAdjustments: [],
            blitzPlan: [],
            playerMatchups: [],
            ...(r.game_plan as Record<string, unknown>),
          },
          sharedWith: r.status === "shared" ? "team" : "coaches_only",
          requiredReading: false,
          readBy: [],
          createdAt: new Date(r.created_at),
        }));
        this.reports.set(reports);
      }

      // Transform opponents
      if (opponentsRes?.data?.opponents) {
        const opponents: OpponentProfile[] = opponentsRes.data.opponents.map(
          (o) => ({
            id: o.name.toLowerCase().replace(/\s+/g, "-"),
            teamName: o.name,
            conference: o.profile?.conference || "Unknown",
            record: {
              wins: o.wins || 0,
              losses: o.losses || 0,
              ties: 0,
            },
            lastMeetingResult: o.lastPlayed
              ? `Last played: ${o.lastPlayed}`
              : undefined,
            headCoach: o.profile?.coach,
            offensiveStyle:
              (o.tendencies as { offensiveStyle?: string })?.offensiveStyle ||
              "Unknown",
            defensiveStyle:
              (o.tendencies as { defensiveStyle?: string })?.defensiveStyle ||
              "Unknown",
            keyPlayers: [],
            generalNotes: o.profile?.notes,
            lastUpdated: o.lastPlayed ? new Date(o.lastPlayed) : new Date(),
            updatedBy: "System",
          }),
        );
        this.opponents.set(opponents);
      }

      // Initialize empty tendencies map
      this.tendenciesMap.set(new Map());
    } catch (error) {
      this.logger.error("Failed to load scouting data", error);
      this.toast.error("Failed to load scouting data");
    } finally {
      this.loading.set(false);
    }
  }

  async loadTendencies(opponentName: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<{
          tendencies: {
            offensive: {
              formations: Record<string, number>;
              playTypes: Record<string, number>;
              notes?: string[];
            };
            defensive: {
              coverages: Record<string, number>;
              notes?: string[];
            };
          };
        }>(`/api/scouting/tendencies/${encodeURIComponent(opponentName)}`),
      );

      if (response?.data?.tendencies) {
        const t = response.data.tendencies;
        const tendencyData: TeamTendencies = {
          opponentId: opponentName,
          offensive: {
            formationFrequency: Object.entries(
              t.offensive.formations || {},
            ).map(([formation, count]) => ({
              formation,
              percentage: count as number,
            })),
            playTypeDistribution: {
              quickPass: 25,
              deepPass: 20,
              qbRun: 15,
              screen: 10,
            },
            redZoneTendencies: [],
            thirdDownTendencies: [],
            favoriteTargets: [],
          },
          defensive: {
            coverageFrequency: Object.entries(t.defensive.coverages || {}).map(
              ([coverage, count]) => ({
                coverage,
                percentage: count as number,
              }),
            ),
            blitzRate: 30,
            blitzTendencies: [],
            weaknesses: t.defensive.notes || [],
          },
          specialSituations: {
            twoPointPlays: [],
            hurryUpOffense: [],
            endOfHalfStrategy: [],
          },
        };

        const currentTendencies = new Map(this.tendenciesMap());
        currentTendencies.set(
          opponentName.toLowerCase().replace(/\s+/g, "-"),
          tendencyData,
        );
        this.tendenciesMap.set(currentTendencies);
      }
    } catch (error) {
      this.logger.error("Failed to load tendencies", error);
    }
  }

  onTendencyOpponentChange(): void {
    if (this.selectedTendencyOpponent) {
      const opponent = this.opponents().find(
        (o) => o.id === this.selectedTendencyOpponent,
      );
      if (opponent) {
        this.loadTendencies(opponent.teamName);
      }
      const tendencies = this.tendenciesMap().get(
        this.selectedTendencyOpponent,
      );
      this.currentTendencies.set(tendencies || null);
    }
  }

  viewReport(report: ScoutingReport): void {
    this.viewingReport.set(report);
    this.showViewReportDialog.set(true);
  }

  async shareToChat(report: ScoutingReport): Promise<void> {
    try {
      await firstValueFrom(
        this.api.post(`/api/scouting/reports/${report.id}/share`),
      );
      this.toast.success(
        `"${report.opponentName}" report shared to team chat!`,
      );
    } catch {
      this.toast.error("Failed to share report");
    }
  }

  editReport(report: ScoutingReport): void {
    this.toast.info(`Opening editor for ${report.opponentName} report`);
  }

  exportReport(report: ScoutingReport): void {
    this.toast.success(`Exporting PDF for ${report.opponentName}...`);
  }

  viewOpponent(opponent: OpponentProfile): void {
    this.toast.info(`Viewing ${opponent.teamName} profile`);
  }

  createReportForOpponent(opponent: OpponentProfile): void {
    this.newReport.opponentId = opponent.id;
    this.showNewReportDialog.set(true);
  }

  async createReport(): Promise<void> {
    if (!this.newReport.opponentId) {
      this.toast.warn("Please select an opponent");
      return;
    }
    if (!this.newReport.executiveSummary) {
      this.toast.warn("Please add an executive summary");
      return;
    }

    const opponent = this.opponents().find(
      (o) => o.id === this.newReport.opponentId,
    );

    try {
      const response = await firstValueFrom(
        this.api.post<{ report: { id: string } }>("/api/scouting/reports", {
          opponentName: opponent?.teamName || "Unknown",
          gameDate: this.newReport.gameDate,
          offensiveNotes: this.newReport.executiveSummary,
          defensiveNotes: this.newReport.coverageAdjustments,
          gamePlan: {
            attackPoints: this.newReport.attackPoints
              .split("\n")
              .filter((p) => p.trim()),
            playsToRun: this.newReport.playsToRun
              .split("\n")
              .filter((p) => p.trim()),
            coverageAdjustments: this.newReport.coverageAdjustments
              .split("\n")
              .filter((p) => p.trim()),
            blitzPlan: this.newReport.blitzPlan
              .split("\n")
              .filter((p) => p.trim()),
          },
        }),
      );

      // Add to local list
      const report: ScoutingReport = {
        id: response?.data?.report?.id || `report${Date.now()}`,
        opponentId: this.newReport.opponentId,
        opponentName: opponent?.teamName || "Unknown",
        gameDate: new Date(this.newReport.gameDate),
        createdBy: "Current User",
        executiveSummary: this.newReport.executiveSummary,
        offensiveGamePlan: {
          attackPoints: this.newReport.attackPoints
            .split("\n")
            .filter((p) => p.trim()),
          playsToRun: this.newReport.playsToRun
            .split("\n")
            .filter((p) => p.trim()),
          avoidAreas: [],
        },
        defensiveGamePlan: {
          coverageAdjustments: this.newReport.coverageAdjustments
            .split("\n")
            .filter((p) => p.trim()),
          blitzPlan: this.newReport.blitzPlan
            .split("\n")
            .filter((p) => p.trim()),
          playerMatchups: [],
        },
        sharedWith: this.newReport.sharedWith,
        requiredReading: this.newReport.requiredReading,
        readBy: [],
        createdAt: new Date(),
      };

      this.reports.set([report, ...this.reports()]);
      this.toast.success("Scouting report created!");
      this.showNewReportDialog.set(false);
      this.resetNewReport();
    } catch {
      this.toast.error("Failed to create report");
    }
  }

  async addOpponent(): Promise<void> {
    if (!this.newOpponent.teamName) {
      this.toast.warn("Please enter a team name");
      return;
    }

    try {
      await firstValueFrom(
        this.api.post("/api/scouting/opponents", {
          name: this.newOpponent.teamName,
          conference: this.newOpponent.conference,
          coach: this.newOpponent.headCoach,
        }),
      );

      const opponent: OpponentProfile = {
        id: `opp${Date.now()}`,
        teamName: this.newOpponent.teamName,
        conference: this.newOpponent.conference,
        record: {
          wins: this.newOpponent.wins,
          losses: this.newOpponent.losses,
          ties: 0,
        },
        headCoach: this.newOpponent.headCoach,
        offensiveStyle: this.newOpponent.offensiveStyle,
        defensiveStyle: this.newOpponent.defensiveStyle,
        keyPlayers: [],
        generalNotes: "",
        lastUpdated: new Date(),
        updatedBy: "Current User",
      };

      this.opponents.set([...this.opponents(), opponent]);
      this.toast.success(`${opponent.teamName} added to database!`);
      this.showAddOpponentDialog.set(false);
      this.resetNewOpponent();
    } catch {
      this.toast.error("Failed to add opponent");
    }
  }

  private resetNewReport(): void {
    this.newReport = {
      opponentId: "",
      gameDate: "",
      executiveSummary: "",
      attackPoints: "",
      playsToRun: "",
      coverageAdjustments: "",
      blitzPlan: "",
      sharedWith: "team",
      requiredReading: false,
    };
  }

  private resetNewOpponent(): void {
    this.newOpponent = {
      teamName: "",
      conference: "",
      wins: 0,
      losses: 0,
      headCoach: "",
      offensiveStyle: "",
      defensiveStyle: "",
    };
  }
}
