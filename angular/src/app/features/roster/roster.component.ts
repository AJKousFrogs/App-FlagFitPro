import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { InputNumberModule } from "primeng/inputnumber";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { SupabaseService } from "../../core/services/supabase.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";

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
  stats?: Record<string, number | string>;
}

@Component({
  selector: "app-roster",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule, 
    TagModule, 
    ButtonModule, 
    ProgressSpinnerModule, 
    MainLayoutComponent, 
    PageHeaderComponent, 
    EmptyStateComponent,
    DialogModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <app-main-layout>
      <div class="roster-page">
        <!-- Page Header -->
        <app-page-header
          title="Team Roster"
          [subtitle]="'Meet our world-class athletes and coaching staff' + (teamStats().length > 0 ? ' representing ' + getCountryCount() + ' countries' : '')"
          icon="pi-users"
        >
          <p-button
            label="Add Player"
            icon="pi pi-plus"
            (onClick)="openAddPlayer()"
          ></p-button>
        </app-page-header>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state">
            <p-progressSpinner 
              [style]="{ width: '50px', height: '50px' }"
              strokeWidth="4"
            ></p-progressSpinner>
            <p class="loading-message">Loading roster data...</p>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && playersByPosition().length === 0) {
          <app-empty-state
            title="No Players Found"
            message="Your roster is empty. Add players to get started."
            icon="pi-users"
            actionLabel="Add First Player"
            actionIcon="pi pi-plus"
            [actionHandler]="openAddPlayer.bind(this)"
          ></app-empty-state>
        }

        <!-- Content -->
        @if (!isLoading() && playersByPosition().length > 0) {
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
        }
      </div>

      <!-- Add Player Dialog -->
      <p-dialog 
        [(visible)]="showAddPlayerDialog" 
        [modal]="true" 
        header="Add New Player"
        [style]="{ width: '500px' }"
        [closable]="true"
      >
        <form [formGroup]="playerForm" class="player-form">
          <div class="form-field">
            <label for="name">Full Name *</label>
            <input 
              pInputText 
              id="name" 
              formControlName="name" 
              placeholder="Enter player name"
              class="w-full"
            />
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="position">Position *</label>
              <p-select 
                id="position"
                formControlName="position"
                [options]="positionOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select position"
                styleClass="w-full"
              ></p-select>
            </div>
            
            <div class="form-field">
              <label for="jersey">Jersey # *</label>
              <input 
                pInputText 
                id="jersey" 
                formControlName="jersey" 
                placeholder="00"
                class="w-full"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="country">Country</label>
              <input 
                pInputText 
                id="country" 
                formControlName="country" 
                placeholder="Country"
                class="w-full"
              />
            </div>
            
            <div class="form-field">
              <label for="age">Age</label>
              <p-inputNumber 
                id="age" 
                formControlName="age" 
                [min]="16" 
                [max]="60"
                styleClass="w-full"
              ></p-inputNumber>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label for="height">Height</label>
              <input 
                pInputText 
                id="height" 
                formControlName="height" 
                placeholder="e.g., 6'2&quot;"
                class="w-full"
              />
            </div>
            
            <div class="form-field">
              <label for="weight">Weight</label>
              <input 
                pInputText 
                id="weight" 
                formControlName="weight" 
                placeholder="e.g., 210 lbs"
                class="w-full"
              />
            </div>
          </div>
        </form>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            icon="pi pi-times" 
            [text]="true"
            (onClick)="closeAddPlayerDialog()"
          ></p-button>
          <p-button 
            label="Add Player" 
            icon="pi pi-check" 
            (onClick)="savePlayer()"
            [disabled]="!playerForm.valid || isSaving()"
            [loading]="isSaving()"
          ></p-button>
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styles: [
    `
      .roster-page {
        padding: var(--space-6);
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12);
        min-height: 300px;
      }

      .loading-message {
        margin-top: var(--space-4);
        font-size: var(--font-body-md);
        color: var(--text-secondary);
      }

      .separator {
        opacity: 0.5;
      }

      .overview-card {
        margin-bottom: var(--space-8);
      }

      .card-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
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
        font-size: var(--font-heading-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-2);
      }

      .overview-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }

      .position-section {
        margin-bottom: var(--space-8);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
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
        box-shadow: var(--shadow-lg);
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
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-lg);
        color: var(--color-text-on-primary);
        background: linear-gradient(
          135deg,
          var(--color-brand-primary),
          var(--color-brand-secondary)
        );
        box-shadow: var(--shadow-md);
        flex-shrink: 0;
      }

      .player-info {
        flex: 1;
        min-width: 0;
      }

      .player-name {
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-1);
        color: var(--text-primary);
      }

      .player-position {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--space-1);
      }

      .player-meta {
        font-size: var(--font-body-sm);
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
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-lg);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-1);
      }

      .stat-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .achievements {
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .achievements-title {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--space-2);
      }

      .achievement-item {
        font-size: var(--font-body-xs);
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
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .detail-value {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
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

        .player-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          flex: 1;
        }

        .form-field label {
          font-weight: var(--font-weight-medium);
          font-size: var(--font-body-sm);
          color: var(--text-secondary);
        }

        .form-row {
          display: flex;
          gap: var(--space-4);
        }

        .w-full {
          width: 100%;
        }

        @media (max-width: 480px) {
          .form-row {
            flex-direction: column;
          }
        }
    `,
  ],
})
export class RosterComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isLoading = signal(true);
  isSaving = signal(false);
  showAddPlayerDialog = signal(false);
  teamStats = signal<TeamStat[]>([]);
  coachingStaff = signal<StaffMember[]>([]);
  playersByPosition = signal<Array<{
    position: string;
    players: Player[];
  }>>([]);
  
  currentTeamId = signal<string | null>(null);
  allPlayers = signal<Player[]>([]);

  playerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    position: ['', Validators.required],
    jersey: ['', Validators.required],
    country: [''],
    age: [null],
    height: [''],
    weight: [''],
  });

  positionOptions = [
    { label: 'Quarterback (QB)', value: 'QB' },
    { label: 'Wide Receiver (WR)', value: 'WR' },
    { label: 'Running Back (RB)', value: 'RB' },
    { label: 'Defensive Back (DB)', value: 'DB' },
    { label: 'Rusher', value: 'Rusher' },
    { label: 'Center', value: 'C' },
    { label: 'Linebacker (LB)', value: 'LB' },
  ];

  ngOnInit(): void {
    this.loadRosterData();
  }

  openAddPlayer(): void {
    this.playerForm.reset();
    this.showAddPlayerDialog.set(true);
  }

  closeAddPlayerDialog(): void {
    this.showAddPlayerDialog.set(false);
    this.playerForm.reset();
  }

  async savePlayer(): Promise<void> {
    if (!this.playerForm.valid) {
      this.toastService.warn('Please fill in all required fields');
      return;
    }

    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.toastService.error('You must be logged in to add players');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.playerForm.value;

    try {
      // Get or create team for the current user
      let teamId = this.currentTeamId();
      
      if (!teamId) {
        // Check if user has a team
        const { data: teamMember } = await this.supabaseService.client
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .single();
        
        if (teamMember?.team_id) {
          teamId = teamMember.team_id;
          this.currentTeamId.set(teamId);
        } else {
          // Create a default team for the user
          const { data: newTeam, error: teamError } = await this.supabaseService.client
            .from('teams')
            .insert({
              name: 'My Team',
              created_by: userId,
            })
            .select()
            .single();

          if (teamError) throw teamError;
          
          teamId = newTeam.id;
          this.currentTeamId.set(teamId);

          // Add user as team owner
          await this.supabaseService.client
            .from('team_members')
            .insert({
              team_id: teamId,
              user_id: userId,
              role: 'owner',
            });
        }
      }

      // Insert the player into team_players table
      const { error } = await this.supabaseService.client
        .from('team_players')
        .insert({
          team_id: teamId,
          name: formValue.name,
          position: formValue.position,
          jersey_number: formValue.jersey,
          country: formValue.country || null,
          age: formValue.age || null,
          height: formValue.height || null,
          weight: formValue.weight || null,
          created_by: userId,
        });

      if (error) throw error;

      this.toastService.success('Player added successfully!');
      this.closeAddPlayerDialog();
      this.loadRosterData(); // Reload the roster
    } catch (error: any) {
      this.logger.error('[Roster] Error adding player:', error);
      this.toastService.error(error.message || 'Failed to add player');
    } finally {
      this.isSaving.set(false);
    }
  }

  async loadRosterData(): Promise<void> {
    this.isLoading.set(true);
    const userId = this.authService.currentUser()?.id;

    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    try {
      // Get user's team
      const { data: teamMember } = await this.supabaseService.client
        .from('team_members')
        .select('team_id, teams(name)')
        .eq('user_id', userId)
        .single();

      if (!teamMember?.team_id) {
        // No team yet, show empty state
        this.teamStats.set([]);
        this.coachingStaff.set([]);
        this.playersByPosition.set([]);
        this.isLoading.set(false);
        return;
      }

      this.currentTeamId.set(teamMember.team_id);

      // Load team members (coaches/staff)
      const { data: members } = await this.supabaseService.client
        .from('team_members')
        .select(`
          user_id,
          role,
          users:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('team_id', teamMember.team_id);

      // Load players from team_players table
      const { data: players, error: playersError } = await this.supabaseService.client
        .from('team_players')
        .select('*')
        .eq('team_id', teamMember.team_id)
        .order('position', { ascending: true });

      if (playersError) {
        this.logger.warn('[Roster] team_players table may not exist, using fallback');
        // Fall back to showing team members as players
        this.loadFallbackData(members);
        return;
      }

      // Process coaching staff from team members
      const staff: StaffMember[] = (members || [])
        .filter((m: any) => ['coach', 'assistant_coach', 'owner'].includes(m.role))
        .map((m: any) => ({
          name: m.users?.raw_user_meta_data?.full_name || m.users?.email?.split('@')[0] || 'Unknown',
          position: this.getRoleDisplayName(m.role),
          country: m.users?.raw_user_meta_data?.country || 'Unknown',
          experience: m.users?.raw_user_meta_data?.experience || 'N/A',
          achievements: m.users?.raw_user_meta_data?.achievements || [],
        }));

      this.coachingStaff.set(staff);

      // Process players
      const playerList: Player[] = (players || []).map((p: any) => ({
        name: p.name,
        position: p.position,
        jersey: p.jersey_number?.toString() || '0',
        country: p.country || 'Unknown',
        age: p.age || 0,
        height: p.height || 'N/A',
        weight: p.weight || 'N/A',
        stats: p.stats || {},
      }));

      this.allPlayers.set(playerList);

      // Group players by position
      const positionMap = new Map<string, Player[]>();
      playerList.forEach(player => {
        const positionName = this.getPositionFullName(player.position);
        if (!positionMap.has(positionName)) {
          positionMap.set(positionName, []);
        }
        positionMap.get(positionName)!.push(player);
      });

      const groupedPlayers = Array.from(positionMap.entries()).map(([position, players]) => ({
        position,
        players,
      }));

      this.playersByPosition.set(groupedPlayers);

      // Calculate team stats
      const uniqueCountries = new Set(playerList.map(p => p.country).filter(c => c !== 'Unknown'));
      const totalPlayers = playerList.length;
      const avgAge = totalPlayers > 0 
        ? Math.round(playerList.reduce((sum, p) => sum + (p.age || 0), 0) / totalPlayers)
        : 0;

      this.teamStats.set([
        { value: totalPlayers.toString(), label: 'Total Players' },
        { value: uniqueCountries.size.toString(), label: 'Countries Represented' },
        { value: avgAge.toString(), label: 'Average Age' },
        { value: staff.length.toString(), label: 'Coaching Staff' },
      ]);

    } catch (error: any) {
      this.logger.error('[Roster] Error loading roster:', error);
      this.toastService.error('Failed to load roster data');
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadFallbackData(members: any[] | null): void {
    // Fallback when team_players table doesn't exist
    const staff: StaffMember[] = (members || [])
      .filter((m: any) => ['coach', 'assistant_coach', 'owner'].includes(m.role))
      .map((m: any) => ({
        name: m.users?.raw_user_meta_data?.full_name || m.users?.email?.split('@')[0] || 'Unknown',
        position: this.getRoleDisplayName(m.role),
        country: m.users?.raw_user_meta_data?.country || 'Unknown',
        experience: m.users?.raw_user_meta_data?.experience || 'N/A',
        achievements: [],
      }));

    this.coachingStaff.set(staff);
    this.playersByPosition.set([]);
    this.teamStats.set([
      { value: '0', label: 'Total Players' },
      { value: '0', label: 'Countries Represented' },
      { value: '0', label: 'Average Age' },
      { value: staff.length.toString(), label: 'Coaching Staff' },
    ]);
    this.isLoading.set(false);
  }

  private getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      owner: 'Team Owner',
      coach: 'Head Coach',
      assistant_coach: 'Assistant Coach',
      player: 'Player',
      manager: 'Team Manager',
    };
    return roleNames[role] || role;
  }

  private getPositionFullName(position: string): string {
    const positionNames: Record<string, string> = {
      QB: 'Quarterback',
      WR: 'Wide Receiver',
      RB: 'Running Back',
      DB: 'Defensive Back',
      C: 'Center',
      LB: 'Linebacker',
      Rusher: 'Rusher',
    };
    return positionNames[position] || position;
  }

  getCountryCount(): number {
    const countries = new Set(this.allPlayers().map(p => p.country).filter(c => c !== 'Unknown'));
    return countries.size;
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

  getPlayerStats(player: Player): Array<{
    label: string;
    value: string | number;
    key: string;
  }> {
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

  trackByPosition(index: number, positionGroup: { position: string; players: Player[] }): string {
    return positionGroup.position;
  }

  trackByPlayerJersey(index: number, player: Player): string {
    return player.jersey;
  }

  trackByStatKey(index: number, stat: { label: string; value: string | number; key: string }): string {
    return stat.key || index.toString();
  }
}
