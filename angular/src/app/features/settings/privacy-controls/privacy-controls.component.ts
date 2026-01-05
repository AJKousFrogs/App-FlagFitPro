import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Select } from "primeng/select";
import { InputTextModule } from "primeng/inputtext";
import { ToastModule } from "primeng/toast";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { TooltipModule } from "primeng/tooltip";
import { Chip } from "primeng/chip";
import { TagModule } from "primeng/tag";
import { AccordionModule } from "primeng/accordion";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import {
  PrivacySettingsService,
  EmergencySharingLevel,
  EmergencyContact,
  METRIC_CATEGORIES,
} from "../../../core/services/privacy-settings.service";
import { DataExportService } from "../../../core/services/data-export.service";
import { AccountDeletionService } from "../../../core/services/account-deletion.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { DIALOG_STYLES } from "../../../core/utils/design-tokens.util";

/**
 * Privacy Controls Component
 *
 * Implements the "Settings > Privacy Controls" page as referenced in PRIVACY_POLICY.md
 * Provides granular controls for:
 * - AI Processing opt-out (Article 22 GDPR)
 * - Research data participation
 * - Emergency data sharing
 * - Team-specific data sharing
 * - Marketing communications
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

@Component({
  selector: "app-privacy-controls",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ToggleSwitch,
    Select,
    InputTextModule,
    ToastModule,
    DialogModule,
    DividerModule,
    TooltipModule,
    Chip,
    TagModule,
    AccordionModule,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,

    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="privacy-controls-page">
        <app-page-header
          title="Privacy Controls"
          subtitle="Manage how your data is used and shared"
          icon="pi-shield"
        >
          <app-button
            variant="outlined"
            iconLeft="pi-download"
            (clicked)="exportData()"
            >Export My Data</app-button
          >
        </app-page-header>

        @if (loading()) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading privacy settings...</span>
          </div>
        } @else {
          <div class="privacy-grid">
            <!-- AI Processing Section -->
            <p-card class="privacy-section ai-section">
              <ng-template pTemplate="header">
                <div class="section-header">
                  <div class="section-icon ai-icon">
                    <i class="pi pi-sparkles"></i>
                  </div>
                  <div class="section-title-group">
                    <h2 class="section-title">AI Processing</h2>
                    <p class="section-subtitle">
                      Article 22 GDPR - Automated Decision Making
                    </p>
                  </div>
                </div>
              </ng-template>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>AI-Powered Recommendations</h4>
                  <p>
                    Allow our AI to analyze your training data to provide
                    personalized recommendations, injury risk assessments, and
                    performance insights.
                  </p>
                  <div class="setting-details">
                    <span class="detail-item">
                      <i class="pi pi-check-circle"></i>
                      Training load optimization
                    </span>
                    <span class="detail-item">
                      <i class="pi pi-check-circle"></i>
                      Recovery recommendations
                    </span>
                    <span class="detail-item">
                      <i class="pi pi-check-circle"></i>
                      Injury risk warnings
                    </span>
                  </div>
                </div>
                <div class="setting-control">
                  <p-toggleswitch
                    [(ngModel)]="aiProcessingEnabled"
                    (onChange)="onAiProcessingChange($event.checked)"
                  ></p-toggleswitch>
                </div>
              </div>

              @if (!aiProcessingEnabled) {
                <div class="warning-banner">
                  <i class="pi pi-info-circle"></i>
                  <span>
                    With AI processing disabled, you won't receive personalized
                    training recommendations or automated injury risk
                    assessments. All AI features will show generic guidance
                    instead.
                  </span>
                </div>
              }

              <div class="consent-info">
                @if (aiConsentStatus()) {
                  <div class="consent-status-detail">
                    <div class="status-row">
                      <span class="status-label">Status:</span>
                      <span
                        class="status-value"
                        [class.enabled]="aiConsentStatus()?.canProcess"
                        [class.disabled]="!aiConsentStatus()?.canProcess"
                      >
                        {{
                          aiConsentStatus()?.canProcess ? "Enabled" : "Disabled"
                        }}
                      </span>
                    </div>
                    <div class="status-row">
                      <span class="status-label">Reason:</span>
                      <span class="status-value">{{
                        aiConsentStatus()?.reason
                      }}</span>
                    </div>
                    @if (aiConsentStatus()?.consentDate) {
                      <div class="status-row">
                        <span class="status-label">Consent Date:</span>
                        <span class="status-value">{{
                          aiConsentStatus()?.consentDate | date: "medium"
                        }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </p-card>

            <!-- Team Data Sharing Section -->
            <p-card class="privacy-section team-section">
              <ng-template pTemplate="header">
                <div class="section-header">
                  <div class="section-icon team-icon">
                    <i class="pi pi-users"></i>
                  </div>
                  <div class="section-title-group">
                    <h2 class="section-title">Team Data Sharing</h2>
                    <p class="section-subtitle">Control what coaches can see</p>
                  </div>
                </div>
              </ng-template>

              @if (teamSettings().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-users"></i>
                  <p>You're not currently on any teams.</p>
                  <small>Join a team to manage data sharing preferences.</small>
                </div>
              } @else {
                <p-accordion [multiple]="true">
                  @for (team of teamSettings(); track team.teamId) {
                    <p-accordionpanel>
                      <ng-template pTemplate="header">
                        <div class="team-header">
                          <span class="team-name">{{ team.teamName }}</span>
                          <div class="team-status">
                            @if (
                              team.performanceSharingEnabled ||
                              team.healthSharingEnabled
                            ) {
                              <p-tag severity="success" value="Sharing"></p-tag>
                            } @else {
                              <p-tag
                                severity="secondary"
                                value="Private"
                              ></p-tag>
                            }
                          </div>
                        </div>
                      </ng-template>
                      <ng-template pTemplate="content">
                        <div class="team-settings">
                          <div class="team-toggle">
                            <div class="toggle-info">
                              <h5>Performance Data</h5>
                              <p>
                                Speed, agility, strength scores, training
                                progress
                              </p>
                            </div>
                            <p-toggleswitch
                              [(ngModel)]="team.performanceSharingEnabled"
                              (onChange)="
                                onTeamSharingChange(
                                  team.teamId,
                                  'performance',
                                  $event.checked
                                )
                              "
                            ></p-toggleswitch>
                          </div>

                          <div class="team-toggle">
                            <div class="toggle-info">
                              <h5>Health Data</h5>
                              <p>Wellness scores, readiness, recovery status</p>
                            </div>
                            <p-toggleswitch
                              [(ngModel)]="team.healthSharingEnabled"
                              (onChange)="
                                onTeamSharingChange(
                                  team.teamId,
                                  'health',
                                  $event.checked
                                )
                              "
                            ></p-toggleswitch>
                          </div>

                          @if (
                            team.performanceSharingEnabled ||
                            team.healthSharingEnabled
                          ) {
                            <div class="metric-categories">
                              <h5>Specific Metrics</h5>
                              <p>Choose exactly which metrics to share:</p>
                              <div class="category-chips">
                                @for (
                                  category of metricCategories;
                                  track category.value
                                ) {
                                  <p-chip
                                    [label]="category.label"
                                    [class.selected]="
                                      isCategorySelected(team, category.value)
                                    "
                                    (click)="
                                      toggleCategory(team, category.value)
                                    "
                                    [pTooltip]="category.description"
                                  ></p-chip>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      </ng-template>
                    </p-accordionpanel>
                  }
                </p-accordion>
              }
            </p-card>

            <!-- Emergency Data Section -->
            <p-card class="privacy-section emergency-section">
              <ng-template pTemplate="header">
                <div class="section-header">
                  <div class="section-icon emergency-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                  </div>
                  <div class="section-title-group">
                    <h2 class="section-title">Emergency Data Sharing</h2>
                    <p class="section-subtitle">In case of medical emergency</p>
                  </div>
                </div>
              </ng-template>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Emergency Sharing Level</h4>
                  <p>
                    Choose what information can be shared with emergency
                    services or designated contacts in case of a medical
                    emergency.
                  </p>
                </div>
                <div class="setting-control wide">
                  <p-select
                    [(ngModel)]="emergencyLevel"
                    [options]="emergencyLevelOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select level"
                    (onChange)="onEmergencyLevelChange($event.value)"
                  ></p-select>
                </div>
              </div>

              <p-divider></p-divider>

              <div class="emergency-contacts">
                <h4>Emergency Contacts</h4>
                <p>
                  These people will be notified and may receive your medical
                  data in an emergency.
                </p>

                @for (contact of emergencyContacts(); track $index) {
                  <div class="contact-item">
                    <div class="contact-info">
                      <span class="contact-name">{{ contact.name }}</span>
                      <span class="contact-relationship">{{
                        contact.relationship
                      }}</span>
                      <span class="contact-phone">{{ contact.phone }}</span>
                    </div>
                    <app-icon-button
                      icon="pi-trash"
                      variant="text"
                      (clicked)="removeEmergencyContact($index)"
                      ariaLabel="trash"
                    />
                  </div>
                }

                @if (emergencyContacts().length < 3) {
                  <app-button
                    variant="outlined"
                    iconLeft="pi-plus"
                    (clicked)="showAddContactDialog = true"
                    >Add Emergency Contact</app-button
                  >
                }
              </div>
            </p-card>

            <!-- Research & Marketing Section -->
            <p-card class="privacy-section research-section">
              <ng-template pTemplate="header">
                <div class="section-header">
                  <div class="section-icon research-icon">
                    <i class="pi pi-chart-bar"></i>
                  </div>
                  <div class="section-title-group">
                    <h2 class="section-title">Research & Communications</h2>
                    <p class="section-subtitle">Optional data usage</p>
                  </div>
                </div>
              </ng-template>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Research Participation</h4>
                  <p>
                    Contribute anonymized data to sports science research. Your
                    data will be aggregated and de-identified before use.
                  </p>
                </div>
                <div class="setting-control">
                  <p-toggleswitch
                    [(ngModel)]="researchOptIn"
                    (onChange)="onResearchOptInChange($event.checked)"
                  ></p-toggleswitch>
                </div>
              </div>

              <p-divider></p-divider>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Marketing Communications</h4>
                  <p>
                    Receive updates about new features, training tips, and
                    special offers.
                  </p>
                </div>
                <div class="setting-control">
                  <p-toggleswitch
                    [(ngModel)]="marketingOptIn"
                    (onChange)="onMarketingOptInChange($event.checked)"
                  ></p-toggleswitch>
                </div>
              </div>
            </p-card>

            <!-- Note: Parental Consent Section removed - App is 16+ only -->

            <!-- Data Rights Section -->
            <p-card class="privacy-section rights-section">
              <ng-template pTemplate="header">
                <div class="section-header">
                  <div class="section-icon rights-icon">
                    <i class="pi pi-file-check"></i>
                  </div>
                  <div class="section-title-group">
                    <h2 class="section-title">Your Data Rights</h2>
                    <p class="section-subtitle">GDPR Article 15-22</p>
                  </div>
                </div>
              </ng-template>

              <div class="rights-grid">
                <div class="right-item">
                  <i class="pi pi-download"></i>
                  <h5>Export Data</h5>
                  <p>Download all your personal data in a portable format.</p>
                  @if (exporting()) {
                    <div class="export-progress">
                      <small>{{ exportStep() }}</small>
                      <div class="progress-bar">
                        <div
                          class="progress-fill"
                          [style.width.%]="exportProgress()"
                        ></div>
                      </div>
                    </div>
                  } @else {
                    <app-button
                      variant="outlined"
                      size="sm"
                      (clicked)="exportData()"
                      >Export</app-button
                    >
                  }
                </div>

                <div class="right-item">
                  <i class="pi pi-trash"></i>
                  <h5>Delete Account</h5>
                  @if (hasPendingDeletion()) {
                    <div class="pending-deletion-warning">
                      <p class="warning-text">
                        <i class="pi pi-exclamation-triangle"></i>
                        Deletion scheduled in
                        {{ deletionStatus()?.daysUntilDeletion }} days
                      </p>
                      <app-button
                        variant="outlined"
                        size="sm"
                        [loading]="deletionLoading()"
                        (clicked)="cancelDeletion()"
                        >Cancel Deletion</app-button
                      >
                    </div>
                  } @else {
                    <p>Permanently delete your account and all data.</p>
                    <app-button
                      variant="outlined"
                      size="sm"
                      (clicked)="showDeleteAccountDialog = true"
                      >Delete</app-button
                    >
                  }
                </div>

                <div class="right-item">
                  <i class="pi pi-history"></i>
                  <h5>View Audit Log</h5>
                  <p>See a history of how your data has been accessed.</p>
                  <app-button variant="outlined" size="sm" [disabled]="true"
                    >Coming Soon</app-button
                  >
                </div>
              </div>
            </p-card>
          </div>
        }
      </div>

      <!-- Add Emergency Contact Dialog -->
      <p-dialog
        header="Add Emergency Contact"
        [(visible)]="showAddContactDialog"
        [modal]="true"
        [style]="dialogStyles.form"
      >
        <div class="contact-form">
          <div class="p-field">
            <label for="contactName">Name</label>
            <input
              id="contactName"
              type="text"
              pInputText
              [(ngModel)]="newContact.name"
              placeholder="Contact name"
            />
          </div>
          <div class="p-field">
            <label for="contactPhone">Phone</label>
            <input
              id="contactPhone"
              type="tel"
              pInputText
              [(ngModel)]="newContact.phone"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div class="p-field">
            <label for="contactRelationship">Relationship</label>
            <p-select
              id="contactRelationship"
              [(ngModel)]="newContact.relationship"
              [options]="relationshipOptions"
              placeholder="Select relationship"
            ></p-select>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <app-button variant="text" (clicked)="showAddContactDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-plus"
            [disabled]="!isContactValid()"
            (clicked)="addEmergencyContact()"
            >Add Contact</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Note: Parental Consent Dialog removed - App is 16+ only -->

      <!-- Delete Account Confirmation Dialog -->
      <p-dialog
        header="Delete Account"
        [(visible)]="showDeleteAccountDialog"
        [modal]="true"
        [style]="dialogStyles.form"
      >
        <div class="delete-warning">
          <i class="pi pi-exclamation-triangle"></i>
          <h4>This action cannot be undone</h4>
          <p>
            Your account will be immediately deactivated. All personal data will
            be permanently deleted within 30 days as required by our privacy
            policy.
          </p>
          <div class="retention-note">
            <i class="pi pi-info-circle"></i>
            <small>
              Emergency medical records are retained for 7 years as required by
              law.
            </small>
          </div>
          <div class="cancellation-note">
            <i class="pi pi-clock"></i>
            <small>
              You can cancel this request within 30 days by logging back in.
            </small>
          </div>
          <div class="p-field">
            <label for="deletionReason">Reason for leaving (optional):</label>
            <input
              id="deletionReason"
              type="text"
              pInputText
              [(ngModel)]="deletionReason"
              placeholder="Help us improve..."
            />
          </div>
          <div class="p-field">
            <label>Type <strong>DELETE</strong> to confirm:</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="deleteConfirmText"
              placeholder="DELETE"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <app-button variant="text" (clicked)="showDeleteAccountDialog = false"
            >Cancel</app-button
          >
          <app-button
            variant="danger"
            iconLeft="pi-trash"
            [loading]="deletionLoading()"
            [disabled]="deleteConfirmText !== 'DELETE'"
            (clicked)="deleteAccount()"
            >Delete My Account</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./privacy-controls.component.scss",
})
export class PrivacyControlsComponent implements OnInit {
  private privacyService = inject(PrivacySettingsService);
  private dataExportService = inject(DataExportService);
  private deletionService = inject(AccountDeletionService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Design system tokens
  protected readonly dialogStyles = DIALOG_STYLES;

  // State from service
  settings = this.privacyService.settings;
  teamSettings = this.privacyService.teamSettings;
  parentalConsent = this.privacyService.parentalConsent;
  loading = this.privacyService.loading;

  // AI consent status from database
  aiConsentStatus = signal<{
    aiEnabled: boolean;
    consentDate: string | null;
    canProcess: boolean;
    reason: string;
  } | null>(null);

  // Local form state
  aiProcessingEnabled = true;
  researchOptIn = false;
  marketingOptIn = false;
  emergencyLevel: EmergencySharingLevel = "medical_only";
  emergencyContacts = signal<EmergencyContact[]>([]);

  // Dialog visibility
  showAddContactDialog = false;
  showDeleteAccountDialog = false;

  // Form data
  newContact: Partial<EmergencyContact> = {};
  deleteConfirmText = "";

  // Options
  metricCategories = METRIC_CATEGORIES;

  emergencyLevelOptions = [
    { label: "No sharing", value: "none" },
    { label: "Medical data only", value: "medical_only" },
    { label: "Medical + Location", value: "medical_and_location" },
    { label: "Full emergency access", value: "full" },
  ];

  relationshipOptions = [
    { label: "Parent", value: "Parent" },
    { label: "Spouse/Partner", value: "Spouse/Partner" },
    { label: "Sibling", value: "Sibling" },
    { label: "Coach", value: "Coach" },
    { label: "Friend", value: "Friend" },
    { label: "Other", value: "Other" },
  ];

  // Note: isMinor() removed - App is 16+ only, no minors allowed

  async ngOnInit(): Promise<void> {
    await this.privacyService.loadSettings();
    await this.loadAiConsentStatus();
    await this.deletionService.checkDeletionStatus();
    this.syncLocalState();
  }

  private async loadAiConsentStatus(): Promise<void> {
    const status = await this.privacyService.getAiConsentStatus();
    this.aiConsentStatus.set(status);
  }

  private syncLocalState(): void {
    const settings = this.settings();
    if (settings) {
      this.aiProcessingEnabled = settings.aiProcessingEnabled;
      this.researchOptIn = settings.researchOptIn;
      this.marketingOptIn = settings.marketingOptIn;
      this.emergencyLevel = settings.emergencySharingLevel;
      this.emergencyContacts.set(settings.emergencyContacts);
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  async onAiProcessingChange(enabled: boolean): Promise<void> {
    await this.privacyService.updateAiProcessing(enabled);
    // Refresh consent status after change
    await this.loadAiConsentStatus();
  }

  async onResearchOptInChange(optIn: boolean): Promise<void> {
    await this.privacyService.updateResearchOptIn(optIn);
  }

  async onMarketingOptInChange(optIn: boolean): Promise<void> {
    await this.privacyService.updateMarketingOptIn(optIn);
  }

  async onEmergencyLevelChange(level: EmergencySharingLevel): Promise<void> {
    await this.privacyService.updateEmergencySharing(level);
  }

  async onTeamSharingChange(
    teamId: string,
    type: "performance" | "health",
    enabled: boolean,
  ): Promise<void> {
    const settings =
      type === "performance"
        ? { performanceSharingEnabled: enabled }
        : { healthSharingEnabled: enabled };

    await this.privacyService.updateTeamSharing(teamId, settings);
  }

  // ============================================================================
  // METRIC CATEGORIES
  // ============================================================================

  isCategorySelected(
    team: { allowedMetricCategories: string[] },
    category: string,
  ): boolean {
    return team.allowedMetricCategories.includes(category);
  }

  async toggleCategory(
    team: { teamId: string; allowedMetricCategories: string[] },
    category: string,
  ): Promise<void> {
    const categories = [...team.allowedMetricCategories];
    const index = categories.indexOf(category);

    if (index >= 0) {
      categories.splice(index, 1);
    } else {
      categories.push(category);
    }

    await this.privacyService.updateTeamSharing(team.teamId, {
      allowedMetricCategories: categories,
    });
  }

  // ============================================================================
  // EMERGENCY CONTACTS
  // ============================================================================

  isContactValid(): boolean {
    return !!(
      this.newContact.name?.trim() &&
      this.newContact.phone?.trim() &&
      this.newContact.relationship
    );
  }

  async addEmergencyContact(): Promise<void> {
    if (!this.isContactValid()) return;

    const contacts = [
      ...this.emergencyContacts(),
      this.newContact as EmergencyContact,
    ];
    const success = await this.privacyService.updateEmergencyContacts(contacts);

    if (success) {
      this.emergencyContacts.set(contacts);
      this.newContact = {};
      this.showAddContactDialog = false;
    }
  }

  async removeEmergencyContact(index: number): Promise<void> {
    const contacts = this.emergencyContacts().filter((_, i) => i !== index);
    const success = await this.privacyService.updateEmergencyContacts(contacts);

    if (success) {
      this.emergencyContacts.set(contacts);
    }
  }

  // Note: Parental consent methods removed - App is 16+ only

  // ============================================================================
  // DATA RIGHTS
  // ============================================================================

  // Export state from service
  exporting = this.dataExportService.exporting;
  exportProgress = this.dataExportService.progress;
  exportStep = this.dataExportService.currentStep;

  async exportData(): Promise<void> {
    await this.dataExportService.exportAllData("json");
  }

  // Deletion state from service
  deletionStatus = this.deletionService.deletionStatus;
  hasPendingDeletion = this.deletionService.hasPendingDeletion;
  deletionLoading = this.deletionService.loading;
  deletionReason = "";

  async deleteAccount(): Promise<void> {
    if (this.deleteConfirmText !== "DELETE") return;

    const success = await this.deletionService.requestDeletion({
      reason: this.deletionReason || undefined,
      confirmText: this.deleteConfirmText,
    });

    if (success) {
      this.showDeleteAccountDialog = false;
      this.deleteConfirmText = "";
      this.deletionReason = "";
    }
  }

  async cancelDeletion(): Promise<void> {
    await this.deletionService.cancelDeletion();
  }

  showAuditLog(): void {
    // TODO: Navigate to audit log page or show dialog
    this.toastService.info("Audit log feature coming soon");
  }
}
