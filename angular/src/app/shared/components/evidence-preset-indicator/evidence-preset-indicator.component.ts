/**
 * Evidence Preset Indicator Component
 * 
 * Displays the active evidence preset and provides access to evidence information.
 * Shows what "model" is being used and allows preset switching.
 */

import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { EvidenceConfigService } from '../../../core/services/evidence-config.service';
import { EvidencePreset } from '../../../core/config/evidence-config';

@Component({
  selector: 'app-evidence-preset-indicator',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TooltipModule, DialogModule],
  template: `
    <div class="evidence-preset-indicator">
      <p-card class="preset-card">
        <div class="preset-header flex items-center justify-between">
          <div class="preset-info">
            <div class="preset-label text-xs text-text-secondary mb-1">
              Evidence-Based Model
            </div>
            <div class="preset-name font-semibold text-text-primary">
              {{ activePreset().name }}
            </div>
            <div class="preset-version text-xs text-text-secondary">
              Version {{ activePreset().version }}
            </div>
          </div>
          <p-button
            icon="pi pi-info-circle"
            [text]="true"
            [rounded]="true"
            (onClick)="showDetails = true"
            pTooltip="View evidence details and citations"
            tooltipPosition="left">
          </p-button>
        </div>
        
        <div class="preset-population mt-3 text-xs text-text-secondary">
          <div>{{ activePreset().population.ageRange }} • {{ activePreset().population.sportType }}</div>
          <div>{{ activePreset().population.competitionLevel }} • {{ activePreset().population.trainingFrequency }}</div>
        </div>
      </p-card>

      <!-- Evidence Details Dialog -->
      <p-dialog
        [(visible)]="showDetails"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '800px' }"
        [closable]="true"
        header="Evidence-Based Configuration Details">
        
        <div class="evidence-details">
          <!-- Preset Info -->
          <div class="preset-section mb-6">
            <h3 class="text-lg font-bold mb-2">{{ activePreset().name }}</h3>
            <p class="text-text-secondary mb-4">{{ activePreset().description }}</p>
            
            <div class="population-info bg-surface-secondary rounded-lg p-4 mb-4">
              <h4 class="font-semibold mb-2">Population Assumptions</h4>
              <ul class="list-none pl-0">
                <li><strong>Age Range:</strong> {{ activePreset().population.ageRange }}</li>
                <li><strong>Sport Type:</strong> {{ activePreset().population.sportType }}</li>
                <li><strong>Competition Level:</strong> {{ activePreset().population.competitionLevel }}</li>
                <li><strong>Training Frequency:</strong> {{ activePreset().population.trainingFrequency }}</li>
                @if (activePreset().population.notes) {
                  <li class="mt-2 text-text-secondary">{{ activePreset().population.notes }}</li>
                }
              </ul>
            </div>
          </div>

          <!-- ACWR Evidence -->
          <div class="acwr-section mb-6">
            <h4 class="font-semibold mb-3">ACWR Thresholds</h4>
            <div class="science-notes science-info-box rounded-lg p-4 mb-3">
              <div class="flex items-start gap-2">
                <i class="pi pi-info-circle science-icon mt-1"></i>
                <div>
                  <div class="font-semibold mb-1">Science (Research-Based)</div>
                  <div class="text-sm text-text-secondary">{{ activePreset().acwr.scienceNotes.thresholds }}</div>
                </div>
              </div>
            </div>
            <div class="coach-notes coach-override-box rounded-lg p-4 mb-3">
              <div class="flex items-start gap-2">
                <i class="pi pi-wrench coach-icon mt-1"></i>
                <div>
                  <div class="font-semibold mb-1">Coach Override</div>
                  <div class="text-sm text-text-secondary">{{ activePreset().acwr.scienceNotes.coachOverride }}</div>
                </div>
              </div>
            </div>
            
            <div class="citations mt-3">
              <h5 class="font-semibold mb-2">Supporting Research</h5>
              @for (citation of activePreset().acwr.citations; track citation.year) {
                <div class="citation-item mb-2 text-sm">
                  <div class="font-medium">{{ citation.authors }} ({{ citation.year }})</div>
                  <div class="text-text-secondary">{{ citation.title }}</div>
                  @if (citation.doi) {
                    <div class="text-xs text-primary">
                      <a [href]="'https://doi.org/' + citation.doi" target="_blank" class="text-primary hover:underline">
                        DOI: {{ citation.doi }}
                      </a>
                    </div>
                  }
                  @if (citation.notes) {
                    <div class="text-xs text-text-secondary mt-1">{{ citation.notes }}</div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Readiness Evidence -->
          <div class="readiness-section mb-6">
            <h4 class="font-semibold mb-3">Readiness Scoring</h4>
            <div class="science-notes science-info-box rounded-lg p-4 mb-3">
              <div class="flex items-start gap-2">
                <i class="pi pi-info-circle science-icon mt-1"></i>
                <div>
                  <div class="font-semibold mb-2">Science (Research-Based)</div>
                  <div class="text-sm text-text-secondary mb-2">
                    <strong>Weightings:</strong> {{ activePreset().readiness.scienceNotes.weightings }}
                  </div>
                  <div class="text-sm text-text-secondary">
                    <strong>Cut-Points:</strong> {{ activePreset().readiness.scienceNotes.cutPoints }}
                  </div>
                </div>
              </div>
            </div>
            <div class="coach-notes coach-override-box rounded-lg p-4 mb-3">
              <div class="flex items-start gap-2">
                <i class="pi pi-wrench coach-icon mt-1"></i>
                <div>
                  <div class="font-semibold mb-1">Coach Override</div>
                  <div class="text-sm text-text-secondary">{{ activePreset().readiness.scienceNotes.coachOverride }}</div>
                </div>
              </div>
            </div>
            
            <div class="citations mt-3">
              <h5 class="font-semibold mb-2">Supporting Research</h5>
              @for (citation of activePreset().readiness.citations; track citation.year) {
                <div class="citation-item mb-2 text-sm">
                  <div class="font-medium">{{ citation.authors }} ({{ citation.year }})</div>
                  <div class="text-text-secondary">{{ citation.title }}</div>
                  @if (citation.doi) {
                    <div class="text-xs text-primary">
                      <a [href]="'https://doi.org/' + citation.doi" target="_blank" class="text-primary hover:underline">
                        DOI: {{ citation.doi }}
                      </a>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Tapering Evidence -->
          <div class="tapering-section">
            <h4 class="font-semibold mb-3">Tapering Protocols</h4>
            <div class="science-notes science-info-box rounded-lg p-4 mb-3">
              <div class="flex items-start gap-2">
                <i class="pi pi-info-circle science-icon mt-1"></i>
                <div>
                  <div class="font-semibold mb-2">Science (Research-Based)</div>
                  <div class="text-sm text-text-secondary mb-2">
                    <strong>Taper Duration:</strong> {{ activePreset().tapering.scienceNotes.taperDuration }}
                  </div>
                  <div class="text-sm text-text-secondary mb-2">
                    <strong>Volume Reduction:</strong> {{ activePreset().tapering.scienceNotes.volumeReduction }}
                  </div>
                  <div class="text-sm text-text-secondary">
                    <strong>Intensity Floor:</strong> {{ activePreset().tapering.scienceNotes.intensityFloor }}
                  </div>
                </div>
              </div>
            </div>
            <div class="coach-notes coach-override-box rounded-lg p-4 mb-3">
              <div class="flex items-start gap-2">
                <i class="pi pi-wrench coach-icon mt-1"></i>
                <div>
                  <div class="font-semibold mb-1">Coach Override</div>
                  <div class="text-sm text-text-secondary">{{ activePreset().tapering.scienceNotes.coachOverride }}</div>
                </div>
              </div>
            </div>
            
            <div class="citations mt-3">
              <h5 class="font-semibold mb-2">Supporting Research</h5>
              @for (citation of activePreset().tapering.citations; track citation.year) {
                <div class="citation-item mb-2 text-sm">
                  <div class="font-medium">{{ citation.authors }} ({{ citation.year }})</div>
                  <div class="text-text-secondary">{{ citation.title }}</div>
                  @if (citation.doi) {
                    <div class="text-xs text-primary">
                      <a [href]="'https://doi.org/' + citation.doi" target="_blank" class="text-primary hover:underline">
                        DOI: {{ citation.doi }}
                      </a>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button
            label="Close"
            icon="pi pi-times"
            (onClick)="showDetails = false"
            [text]="true">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .preset-card {
      min-height: 100px;
    }
    .preset-header {
      margin-bottom: 0.5rem;
    }
    .preset-name {
      font-size: 1.1rem;
    }
    .preset-population {
      line-height: 1.5;
    }
    .evidence-details {
      max-height: 70vh;
      overflow-y: auto;
    }
    .citation-item {
      padding: 0.5rem;
      background: var(--surface-secondary);
      border-radius: 0.25rem;
    }
    
    /* Science Info Box - Uses brand primary subtle background */
    .science-info-box {
      background: var(--ds-primary-green-subtle, rgba(8, 153, 73, 0.1));
      border: 1px solid var(--ds-primary-green-ultra-subtle, rgba(8, 153, 73, 0.2));
    }
    .science-icon {
      color: var(--color-brand-primary, #089949);
    }
    
    /* Coach Override Box - Uses surface secondary with subtle border */
    .coach-override-box {
      background: var(--surface-secondary, #f8faf9);
      border: 1px solid var(--color-border-primary, #e5e7eb);
    }
    .coach-icon {
      color: var(--color-text-secondary, #4a4a4a);
    }
  `]
})
export class EvidencePresetIndicatorComponent {
  private evidenceConfigService = inject(EvidenceConfigService);

  activePreset = computed<EvidencePreset>(() => this.evidenceConfigService.getActivePreset());
  showDetails = signal(false);
}

