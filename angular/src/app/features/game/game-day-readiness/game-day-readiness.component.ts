/**
 * Game Day Readiness Component
 * 
 * Pre-competition wellness check-in for Olympic-bound flag football athletes.
 * Calculates readiness score and alerts coaches if athlete isn't competition-ready.
 * 
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Component, computed, signal, inject, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Slider } from 'primeng/slider';
import { Textarea } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { Chip } from 'primeng/chip';
import { TagModule } from 'primeng/tag';

// Services
import { WellnessService } from '../../../core/services/wellness.service';
import { AcwrService } from '../../../core/services/acwr.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { SupabaseService } from '../../../core/services/supabase.service';

interface ReadinessMetric {
  key: string;
  label: string;
  icon: string;
  value: number;
  weight: number;
  description: string;
  lowWarning: string;
}

@Component({
  selector: 'app-game-day-readiness',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    Slider,
    Textarea,
    ProgressBarModule,
    TooltipModule,
    Chip,
    TagModule,
  ],
  template: `
    <div class="game-day-readiness">
      <!-- Header -->
      <div class="readiness-header">
        <div class="header-content">
          <h1><i class="pi pi-flag"></i> Game Day Readiness</h1>
          <p class="subtitle">Pre-Competition Check-in for {{ gameInfo() }}</p>
        </div>
        <div class="acwr-badge" [class]="acwrStatus()">
          <span class="acwr-label">ACWR</span>
          <span class="acwr-value">{{ acwrValue() | number:'1.2-2' }}</span>
        </div>
      </div>

      @if (!isSubmitted()) {
        <!-- Check-in Form -->
        <div class="checkin-form">
          @for (metric of metrics(); track metric.key) {
            <div class="metric-card">
              <div class="metric-header">
                <span class="metric-icon">{{ metric.icon }}</span>
                <span class="metric-label">{{ metric.label }}</span>
                <span class="metric-value" [class.warning]="metric.value < 5">{{ metric.value }}/10</span>
              </div>
              <p-slider 
                [(ngModel)]="metric.value" 
                [min]="1" 
                [max]="10" 
                [step]="1"
                (onChange)="updateMetric(metric.key, $event.value || 1)"
              ></p-slider>
              <p class="metric-description">{{ metric.description }}</p>
              @if (metric.value < 5) {
                <div class="metric-warning">
                  <i class="pi pi-exclamation-triangle"></i>
                  {{ metric.lowWarning }}
                </div>
              }
            </div>
          }

          <!-- Additional Notes -->
          <div class="notes-section">
            <label>Any concerns or notes for today?</label>
            <textarea 
              pInputTextarea 
              [(ngModel)]="notes" 
              [rows]="3"
              placeholder="E.g., slight tightness in hamstring, nervous about opponent..."
            ></textarea>
          </div>

          <!-- Readiness Score Preview -->
          <div class="readiness-preview">
            <div class="score-display" [class]="readinessStatus()">
              <div class="score-circle">
                <span class="score-value">{{ readinessScore() }}</span>
                <span class="score-label">/ 100</span>
              </div>
              <div class="score-info">
                <h3>{{ readinessLabel() }}</h3>
                <p>{{ readinessMessage() }}</p>
              </div>
            </div>

            @if (readinessScore() < 70) {
              <div class="coach-alert-warning">
                <i class="pi pi-bell"></i>
                <div>
                  <strong>Coach will be notified</strong>
                  <p>Your readiness score is below 70%. Your coach will receive an alert to discuss modifications.</p>
                </div>
              </div>
            }
          </div>

          <!-- Submit Button -->
          <div class="submit-section">
            <p-button 
              label="Submit Readiness Check"
              icon="pi pi-check"
              [loading]="isSubmitting()"
              (onClick)="submitReadiness()"
              styleClass="p-button-lg"
            ></p-button>
            <p class="submit-note">
              <i class="pi pi-info-circle"></i>
              Complete this check-in at least 2 hours before competition
            </p>
          </div>
        </div>
      } @else {
        <!-- Confirmation View -->
        <div class="confirmation-view">
          <div class="confirmation-icon" [class]="readinessStatus()">
            @if (readinessScore() >= 85) {
              ✅
            } @else if (readinessScore() >= 70) {
              👍
            } @else {
              ⚠️
            }
          </div>
          
          <h2>Check-in Complete</h2>
          
          <div class="final-score" [class]="readinessStatus()">
            <span class="score">{{ readinessScore() }}</span>
            <span class="label">Readiness Score</span>
          </div>

          <div class="recommendations">
            <h3>Pre-Game Recommendations</h3>
            <ul>
              @for (rec of recommendations(); track rec) {
                <li>{{ rec }}</li>
              }
            </ul>
          </div>

          @if (readinessScore() < 70) {
            <div class="coach-notified">
              <i class="pi pi-send"></i>
              <p>Your coach has been notified and may reach out to discuss adjustments.</p>
            </div>
          }

          <div class="action-buttons">
            <p-button 
              label="Back to Dashboard"
              icon="pi pi-home"
              [outlined]="true"
              (onClick)="goToDashboard()"
            ></p-button>
            <p-button 
              label="Tournament Nutrition"
              icon="pi pi-heart"
              [outlined]="true"
              routerLink="/game/nutrition"
              pTooltip="Plan your fueling for all games"
            ></p-button>
            <p-button 
              label="View Game Plan"
              icon="pi pi-file"
              (onClick)="viewGamePlan()"
            ></p-button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-day-readiness {
      max-width: 800px;
      margin: 0 auto;
      padding: var(--space-6);
    }

    .readiness-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-8);
      gap: var(--space-4);
    }

    .header-content h1 {
      font-size: var(--text-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-2) 0;
    }

    .subtitle {
      color: var(--color-text-secondary);
      font-size: var(--text-lg);
      margin: 0;
    }

    .acwr-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-xl);
      min-width: 80px;
    }

    .acwr-badge.green { background: var(--color-status-success-subtle); border: 2px solid var(--color-status-success); }
    .acwr-badge.yellow { background: var(--color-status-warning-subtle); border: 2px solid var(--color-status-warning); }
    .acwr-badge.orange { background: #fff3e0; border: 2px solid #ff9800; }
    .acwr-badge.red { background: var(--color-status-error-subtle); border: 2px solid var(--color-status-error); }

    .acwr-label {
      font-size: var(--text-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .acwr-value {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-bold);
    }

    .checkin-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .metric-card {
      background: var(--surface-primary);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-primary);
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .metric-icon {
      font-size: var(--text-2xl);
    }

    .metric-label {
      flex: 1;
      font-weight: var(--font-weight-semibold);
      font-size: var(--text-lg);
    }

    .metric-value {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-brand-primary);
    }

    .metric-value.warning {
      color: var(--color-status-error);
    }

    .metric-description {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin: var(--space-3) 0 0 0;
    }

    .metric-warning {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-top: var(--space-3);
      padding: var(--space-3);
      background: var(--color-status-warning-subtle);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      color: var(--color-status-warning);
    }

    .notes-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .notes-section label {
      font-weight: var(--font-weight-semibold);
    }

    .notes-section textarea {
      width: 100%;
      resize: vertical;
    }

    .readiness-preview {
      background: var(--surface-secondary);
      border-radius: var(--radius-2xl);
      padding: var(--space-6);
    }

    .score-display {
      display: flex;
      align-items: center;
      gap: var(--space-6);
    }

    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: var(--radius-full);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--surface-primary);
      box-shadow: var(--shadow-md);
    }

    .score-display.excellent .score-circle { border: 4px solid var(--color-status-success); }
    .score-display.good .score-circle { border: 4px solid #2196f3; }
    .score-display.caution .score-circle { border: 4px solid var(--color-status-warning); }
    .score-display.concern .score-circle { border: 4px solid var(--color-status-error); }

    .score-value {
      font-size: var(--text-3xl);
      font-weight: var(--font-weight-bold);
      line-height: 1;
    }

    .score-label {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    .score-info h3 {
      margin: 0 0 var(--space-2) 0;
      font-size: var(--text-xl);
    }

    .score-info p {
      margin: 0;
      color: var(--color-text-secondary);
    }

    .coach-alert-warning {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      margin-top: var(--space-4);
      padding: var(--space-4);
      background: var(--color-status-warning-subtle);
      border: 1px solid var(--color-status-warning);
      border-radius: var(--radius-lg);
    }

    .coach-alert-warning i {
      font-size: var(--text-xl);
      color: var(--color-status-warning);
    }

    .coach-alert-warning strong {
      display: block;
      margin-bottom: var(--space-1);
    }

    .coach-alert-warning p {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    .submit-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }

    .submit-note {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }

    /* Confirmation View */
    .confirmation-view {
      text-align: center;
      padding: var(--space-8);
    }

    .confirmation-icon {
      font-size: 5rem;
      margin-bottom: var(--space-4);
    }

    .confirmation-view h2 {
      font-size: var(--text-2xl);
      margin-bottom: var(--space-6);
    }

    .final-score {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-6) var(--space-10);
      border-radius: var(--radius-2xl);
      margin-bottom: var(--space-8);
    }

    .final-score.excellent { background: var(--color-status-success-subtle); }
    .final-score.good { background: #e3f2fd; }
    .final-score.caution { background: var(--color-status-warning-subtle); }
    .final-score.concern { background: var(--color-status-error-subtle); }

    .final-score .score {
      font-size: var(--text-5xl);
      font-weight: var(--font-weight-bold);
    }

    .final-score .label {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .recommendations {
      text-align: left;
      background: var(--surface-primary);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .recommendations h3 {
      margin: 0 0 var(--space-4) 0;
    }

    .recommendations ul {
      margin: 0;
      padding-left: var(--space-5);
    }

    .recommendations li {
      margin-bottom: var(--space-2);
      color: var(--color-text-secondary);
    }

    .coach-notified {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--color-status-info-subtle);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-6);
    }

    .coach-notified i {
      font-size: var(--text-xl);
      color: var(--color-status-info);
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: var(--space-4);
    }

    @media (max-width: 768px) {
      .readiness-header {
        flex-direction: column;
      }

      .score-display {
        flex-direction: column;
        text-align: center;
      }

      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class GameDayReadinessComponent implements OnInit {
  private readonly wellnessService = inject(WellnessService);
  private readonly acwrService = inject(AcwrService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ACWR from service
  acwrValue = this.acwrService.acwrRatio;
  acwrStatus = computed(() => {
    const ratio = this.acwrValue();
    if (ratio === 0) return 'yellow';
    if (ratio < 0.8) return 'orange';
    if (ratio <= 1.3) return 'green';
    if (ratio <= 1.5) return 'yellow';
    return 'red';
  });

  // Form state
  metrics = signal<ReadinessMetric[]>([
    {
      key: 'sleep',
      label: 'Sleep Quality',
      icon: '😴',
      value: 7,
      weight: 20,
      description: 'How well did you sleep last night?',
      lowWarning: 'Poor sleep affects reaction time and decision-making'
    },
    {
      key: 'energy',
      label: 'Energy Level',
      icon: '⚡',
      value: 7,
      weight: 15,
      description: 'How energized do you feel right now?',
      lowWarning: 'Low energy may impact your explosiveness'
    },
    {
      key: 'soreness',
      label: 'Muscle Soreness',
      icon: '💪',
      value: 3,
      weight: 20,
      description: '1 = No soreness, 10 = Very sore',
      lowWarning: 'High soreness increases injury risk during competition'
    },
    {
      key: 'hydration',
      label: 'Hydration',
      icon: '💧',
      value: 7,
      weight: 15,
      description: 'How well hydrated do you feel?',
      lowWarning: 'Dehydration significantly impacts performance'
    },
    {
      key: 'mental',
      label: 'Mental Focus',
      icon: '🧠',
      value: 7,
      weight: 15,
      description: 'How focused and mentally prepared are you?',
      lowWarning: 'Mental preparation is key for flag football reads'
    },
    {
      key: 'confidence',
      label: 'Confidence',
      icon: '🔥',
      value: 7,
      weight: 15,
      description: 'How confident do you feel about today\'s competition?',
      lowWarning: 'Confidence affects decision-making under pressure'
    }
  ]);

  notes = '';
  isSubmitting = signal(false);
  isSubmitted = signal(false);
  
  // Game info from route params
  gameInfo = signal('Today\'s Competition');

  // Computed readiness score (0-100)
  readinessScore = computed(() => {
    const m = this.metrics();
    let totalWeightedScore = 0;
    let totalWeight = 0;

    m.forEach(metric => {
      let normalizedValue = metric.value;
      // Invert soreness (lower is better)
      if (metric.key === 'soreness') {
        normalizedValue = 11 - metric.value;
      }
      totalWeightedScore += (normalizedValue / 10) * metric.weight;
      totalWeight += metric.weight;
    });

    // Factor in ACWR penalty if in danger zone
    let acwrPenalty = 0;
    const acwr = this.acwrValue();
    if (acwr > 1.5) acwrPenalty = 15;
    else if (acwr > 1.3) acwrPenalty = 5;
    else if (acwr < 0.8 && acwr > 0) acwrPenalty = 10;

    const baseScore = Math.round((totalWeightedScore / totalWeight) * 100);
    return Math.max(0, baseScore - acwrPenalty);
  });

  readinessStatus = computed(() => {
    const score = this.readinessScore();
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'caution';
    return 'concern';
  });

  readinessLabel = computed(() => {
    const status = this.readinessStatus();
    switch (status) {
      case 'excellent': return '🟢 Competition Ready';
      case 'good': return '🔵 Good to Compete';
      case 'caution': return '🟡 Proceed with Caution';
      case 'concern': return '🔴 Concerns Identified';
    }
  });

  readinessMessage = computed(() => {
    const status = this.readinessStatus();
    switch (status) {
      case 'excellent': return 'You\'re in great shape for today\'s competition. Go get it!';
      case 'good': return 'You\'re ready to compete. Focus on your warmup and stay hydrated.';
      case 'caution': return 'Some areas need attention. Consider modified warmup and communicate with your coach.';
      case 'concern': return 'Multiple concerns flagged. Your coach will be notified to discuss options.';
    }
  });

  recommendations = computed(() => {
    const recs: string[] = [];
    const m = this.metrics();
    const acwr = this.acwrValue();

    // Sleep recommendations
    const sleep = m.find(x => x.key === 'sleep');
    if (sleep && sleep.value < 6) {
      recs.push('Consider a 20-minute power nap before warmup if possible');
      recs.push('Increase caffeine intake moderately (200-300mg)');
    }

    // Soreness recommendations
    const soreness = m.find(x => x.key === 'soreness');
    if (soreness && soreness.value > 6) {
      recs.push('Extended dynamic warmup (15-20 minutes)');
      recs.push('Focus on mobility work for affected areas');
      recs.push('Consider reduced sprint volume during competition');
    }

    // Hydration recommendations
    const hydration = m.find(x => x.key === 'hydration');
    if (hydration && hydration.value < 6) {
      recs.push('Drink 500ml water in the next hour');
      recs.push('Add electrolytes to your pre-game hydration');
    }

    // Mental focus recommendations
    const mental = m.find(x => x.key === 'mental');
    if (mental && mental.value < 6) {
      recs.push('5-minute visualization exercise before warmup');
      recs.push('Review game plan and key assignments');
    }

    // ACWR recommendations
    if (acwr > 1.3) {
      recs.push('Monitor fatigue levels closely during competition');
      recs.push('Consider rotation strategy with coach');
    }

    // Default recommendations
    if (recs.length === 0) {
      recs.push('Standard dynamic warmup protocol');
      recs.push('Stay hydrated throughout competition');
      recs.push('Trust your preparation and compete with confidence');
    }

    return recs;
  });

  ngOnInit(): void {
    // Get game info from route if available
    const gameParam = this.route.snapshot.queryParamMap.get('game');
    if (gameParam) {
      this.gameInfo.set(gameParam);
    }
  }

  updateMetric(key: string, value: number): void {
    const current = this.metrics();
    const updated = current.map(m => 
      m.key === key ? { ...m, value } : m
    );
    this.metrics.set(updated);
  }

  async submitReadiness(): Promise<void> {
    this.isSubmitting.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.toastService.error('Please log in to submit readiness check');
        return;
      }

      const metrics = this.metrics();
      const readinessData = {
        athlete_id: user.id,
        date: new Date().toISOString().split('T')[0],
        check_in_time: new Date().toISOString(),
        sleep_quality: metrics.find(m => m.key === 'sleep')?.value,
        energy_level: metrics.find(m => m.key === 'energy')?.value,
        muscle_soreness: metrics.find(m => m.key === 'soreness')?.value,
        hydration_level: metrics.find(m => m.key === 'hydration')?.value,
        mental_focus: metrics.find(m => m.key === 'mental')?.value,
        confidence_level: metrics.find(m => m.key === 'confidence')?.value,
        readiness_score: this.readinessScore(),
        acwr_at_checkin: this.acwrValue(),
        notes: this.notes || null,
        game_info: this.gameInfo(),
      };

      // Save to game_day_readiness table (or wellness_entries if table doesn't exist)
      const { error } = await this.supabaseService.client
        .from('game_day_readiness')
        .insert(readinessData);

      if (error) {
        // Fallback: save as wellness entry
        this.logger.warn('[GameDayReadiness] Table not found, saving as wellness entry');
        await this.wellnessService.logWellness({
          sleep: readinessData.sleep_quality,
          energy: readinessData.energy_level,
          soreness: readinessData.muscle_soreness,
          hydration: readinessData.hydration_level,
          motivation: readinessData.confidence_level,
          notes: `[Game Day Check-in] Score: ${readinessData.readiness_score}. ${this.notes}`,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      }

      // Alert coach if readiness is low
      if (this.readinessScore() < 70) {
        await this.notifyCoach(user.id, readinessData);
      }

      this.isSubmitted.set(true);
      this.toastService.success('Game day readiness submitted!');
      this.logger.success('[GameDayReadiness] Check-in saved successfully');

    } catch (error) {
      this.logger.error('[GameDayReadiness] Error submitting:', error);
      this.toastService.error('Failed to submit readiness check');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async notifyCoach(athleteId: string, readinessData: Record<string, unknown>): Promise<void> {
    try {
      // Get athlete's team and coach
      const { data: teamMember } = await this.supabaseService.client
        .from('team_members')
        .select('team_id, teams(name)')
        .eq('user_id', athleteId)
        .single();

      if (!teamMember?.team_id) return;

      // Get coaches for this team
      const { data: coaches } = await this.supabaseService.client
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamMember.team_id)
        .in('role', ['head_coach', 'coach', 'owner']);

      if (!coaches?.length) return;

      const user = this.authService.getUser();
      const athleteName = user?.name || user?.email || 'An athlete';

      // Create notifications for coaches
      for (const coach of coaches) {
        await this.supabaseService.client
          .from('notifications')
          .insert({
            user_id: coach.user_id,
            type: 'readiness_alert',
            title: '⚠️ Low Game Day Readiness',
            message: `${athleteName} reported a readiness score of ${readinessData['readiness_score']}/100 before competition. Review recommended.`,
            data: { athleteId, readinessScore: readinessData['readiness_score'] },
            read: false,
          });
      }

      this.logger.info('[GameDayReadiness] Coach notification sent');
    } catch (error) {
      this.logger.warn('[GameDayReadiness] Could not notify coach:', error);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  viewGamePlan(): void {
    this.router.navigate(['/game-tracker']);
  }
}
