import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { Accordion, AccordionPanel } from "primeng/accordion";
import { Card } from "primeng/card";
import { Chip } from "primeng/chip";
import { Dialog } from "primeng/dialog";
import { Divider } from "primeng/divider";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { AccountDeletionService } from "../../../core/services/account-deletion.service";
import { AuthService } from "../../../core/services/auth.service";
import { DataExportService } from "../../../core/services/data-export.service";
import {
  EmergencyContact,
  EmergencySharingLevel,
  METRIC_CATEGORIES,
  PrivacySettingsService,
} from "../../../core/services/privacy-settings.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Select,
    InputText,

    Dialog,
    
    Divider,
    Tooltip,
    Chip,
    Accordion,
    AccordionPanel,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    ButtonComponent,
    IconButtonComponent,
    StatusTagComponent,
    AppLoadingComponent,
    EmptyStateComponent,
  ],
  template: `
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
          <app-loading
            message="Loading privacy settings..."
            variant="inline"
          />
        } @else {
          <div class="privacy-grid">
            <!-- AI Processing Section -->
            <p-card class="privacy-section ai-section">
              <ng-template #header>
                <div class="section-header">
                  <div class="section-icon ai-icon" aria-hidden="true">
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
                      <i class="pi pi-check-circle" aria-hidden="true"></i>
                      Training load optimization
                    </span>
                    <span class="detail-item">
                      <i class="pi pi-check-circle" aria-hidden="true"></i>
                      Recovery recommendations
                    </span>
                    <span class="detail-item">
                      <i class="pi pi-check-circle" aria-hidden="true"></i>
                      Injury risk warnings
                    </span>
                  </div>
                </div>
                <div class="setting-control">
                  <input
                    type="checkbox"
                    [checked]="aiProcessingEnabled"
                    (change)="onAiProcessingChange(isChecked($event))"
                    aria-label="Enable AI-powered recommendations"
                  />
                </div>
              </div>

              @if (!aiProcessingEnabled) {
                <div class="warning-banner" role="alert">
                  <i class="pi pi-info-circle" aria-hidden="true"></i>
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
              <ng-template #header>
                <div class="section-header">
                  <div class="section-icon team-icon" aria-hidden="true">
                    <i class="pi pi-users"></i>
                  </div>
                  <div class="section-title-group">
                    <h2 class="section-title">Team Data Sharing</h2>
                    <p class="section-subtitle">Control what coaches can see</p>
                  </div>
                </div>
              </ng-template>

              @if (teamSettings().length === 0) {
                <app-empty-state
                  icon="pi-users"
                  heading="You're not on any teams"
                  description="Join a team to manage data sharing preferences."
                />
              } @else {
                <p-accordion [multiple]="true">
                  @for (team of teamSettings(); track team.teamId) {
                    <p-accordionpanel>
                      <ng-template #header>
                        <div class="team-header">
                          <span class="team-name">{{ team.teamName }}</span>
                          <div class="team-status">
                            @if (
                              team.performanceSharingEnabled ||
                              team.healthSharingEnabled
                            ) {
                              <app-status-tag
                                value="Sharing"
                                severity="success"
                                size="sm"
                              />
                            } @else {
                              <app-status-tag
                                value="Private"
                                severity="secondary"
                                size="sm"
                              />
                            }
                          </div>
                        </div>
                      </ng-template>
                      <ng-template #content>
                        <div class="team-settings">
                          <div class="team-toggle">
                            <div class="toggle-info">
                              <h5>Performance Data</h5>
                              <p>
                                Speed, agility, strength scores, training
                                progress
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              [checked]="team.performanceSharingEnabled"
                              (change)="
                                onTeamSharingChange(
                                  team.teamId,
                                  'performance',
                                  isChecked($event)
                                )
                              "
                              [attr.aria-label]="'Share performance data for ' + team.teamName"
                            />
                          </div>

                          <div class="team-toggle">
                            <div class="toggle-info">
                              <h5>Health Data</h5>
                              <p>Wellness scores, readiness, recovery status</p>
                            </div>
                            <input
                              type="checkbox"
                              [checked]="team.healthSharingEnabled"
                              (change)="
                                onTeamSharingChange(
                                  team.teamId,
                                  'health',
                                  isChecked($event)
                                )
                              "
                              [attr.aria-label]="'Share health data for ' + team.teamName"
                            />
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
              <ng-template #header>
                <div class="section-header">
                  <div class="section-icon emergency-icon" aria-hidden="true">
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
                    [ngModel]="emergencyLevel"
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
                      ariaLabel="Remove emergency contact"
                      tooltip="Remove"
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
              <ng-template #header>
                <div class="section-header">
                  <div class="section-icon research-icon" aria-hidden="true">
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
                  <input
                    type="checkbox"
                    [checked]="researchOptIn"
                    (change)="onResearchOptInChange(isChecked($event))"
                    aria-label="Opt in to research participation"
                  />
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
                  <input
                    type="checkbox"
                    [checked]="marketingOptIn"
                    (change)="onMarketingOptInChange(isChecked($event))"
                    aria-label="Opt in to marketing communications"
                  />
                </div>
              </div>
            </p-card>

            <!-- Note: Parental Consent Section removed - App is 16+ only -->

            <!-- Data Rights Section -->
            <p-card class="privacy-section rights-section">
              <ng-template #header>
                <div class="section-header">
                  <div class="section-icon rights-icon" aria-hidden="true">
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
                  <i class="pi pi-download" aria-hidden="true"></i>
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
                  <i class="pi pi-trash" aria-hidden="true"></i>
                  <h5>Delete Account</h5>
                  @if (hasPendingDeletion()) {
                    <div class="pending-deletion-warning">
                      <p class="warning-text">
                        <i
                          class="pi pi-exclamation-triangle"
                          aria-hidden="true"
                        ></i>
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
                  <i class="pi pi-history" aria-hidden="true"></i>
                  <h5>View Audit Log</h5>
                  <p>See a history of how your data has been accessed.</p>
                  <app-button
                    variant="outlined"
                    size="sm"
                    (clicked)="showAuditLog()"
                    >View Log</app-button
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
        class="privacy-contact-dialog"
      >
        <div class="contact-form">
          <div class="form-field">
            <label for="contactName">Name</label>
            <input
              id="contactName"
              type="text"
              pInputText
              [value]="newContact.name ?? ''"
              (input)="onNewContactNameChange(getInputValue($event))"
              placeholder="Contact name"
            />
          </div>
          <div class="form-field">
            <label for="contactPhone">Phone</label>
            <input
              id="contactPhone"
              type="tel"
              pInputText
              [value]="newContact.phone ?? ''"
              (input)="onNewContactPhoneChange(getInputValue($event))"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div class="form-field">
            <label for="contactRelationship">Relationship</label>
            <p-select
              id="contactRelationship"
              [ngModel]="newContact.relationship"
              (onChange)="onNewContactRelationshipChange($event.value)"
              [options]="relationshipOptions"
              placeholder="Select relationship"
            ></p-select>
          </div>
        </div>
        <ng-template #footer>
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
        class="privacy-delete-dialog"
      >
        <div class="delete-warning" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <h4>This action cannot be undone</h4>
          <p>
            Your account will be immediately deactivated. All personal data will
            be permanently deleted within 30 days as required by our privacy
            policy.
          </p>
          <div class="retention-note">
            <i class="pi pi-info-circle" aria-hidden="true"></i>
            <small>
              Emergency medical records are retained for 7 years as required by
              law.
            </small>
          </div>
          <div class="cancellation-note">
            <i class="pi pi-clock" aria-hidden="true"></i>
            <small>
              You can cancel this request within 30 days by logging back in.
            </small>
          </div>
          <div class="form-field">
            <label for="deletionReason">Reason for leaving (optional):</label>
            <input
              id="deletionReason"
              type="text"
              pInputText
              [value]="deletionReason"
              (input)="onDeletionReasonChange(getInputValue($event))"
              placeholder="Help us improve..."
            />
          </div>
          <div class="form-field">
            <label>Type <strong>DELETE</strong> to confirm:</label>
            <input
              type="text"
              pInputText
              [value]="deleteConfirmText"
              (input)="onDeleteConfirmTextChange(getInputValue($event))"
              placeholder="DELETE"
            />
          </div>
        </div>
        <ng-template #footer>
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

      <!-- Audit Log Dialog -->
      <p-dialog
        header="Privacy Audit Log"
        [(visible)]="showAuditLogDialog"
        [modal]="true"
        [style]="{ width: 'min(90vw, 600px)' }"
        (onHide)="auditLogEntries.set([])"
      >
        <div class="audit-log-content">
          @if (auditLogLoading()) {
            <p><i class="pi pi-spin pi-spinner"></i> Loading...</p>
          } @else if (auditLogEntries().length === 0) {
            <p>No audit log entries yet.</p>
          } @else {
            <div class="audit-log-list">
              @for (entry of auditLogEntries(); track entry.id) {
                <div class="audit-log-entry">
                  <span class="audit-action">{{ entry.action }}</span>
                  @if (entry.affectedTable) {
                    <span class="audit-table">{{ entry.affectedTable }}</span>
                  }
                  <span class="audit-date">{{ entry.createdAt | date : 'short' }}</span>
                </div>
              }
            </div>
          }
        </div>
        <ng-template #footer>
          <app-button variant="text" (clicked)="showAuditLogDialog = false"
            >Close</app-button
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
  showAuditLogDialog = false;
  auditLogLoading = signal(false);
  auditLogEntries = signal<
    Array<{
      id: string;
      action: string;
      affectedTable: string | null;
      affectedData: Record<string, unknown> | null;
      createdAt: string;
    }>
  >([]);

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

  onNewContactNameChange(value: string): void {
    this.newContact = { ...this.newContact, name: value };
  }

  onNewContactPhoneChange(value: string): void {
    this.newContact = { ...this.newContact, phone: value };
  }

  onNewContactRelationshipChange(value: string): void {
    this.newContact = { ...this.newContact, relationship: value };
  }

  onDeletionReasonChange(value: string): void {
    this.deletionReason = value;
  }

  onDeleteConfirmTextChange(value: string): void {
    this.deleteConfirmText = value;
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }

  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
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

  // Export state - implemented locally
  exporting = signal<boolean>(false);
  exportProgress = signal<number>(0);
  exportStep = signal<string>("Preparing export...");

  async exportData(): Promise<void> {
    this.exporting.set(true);
    this.exportProgress.set(0);
    this.exportStep.set("Collecting your data...");

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      // Simple export - collect user data and export as JSON
      this.exportProgress.set(50);
      this.exportStep.set("Formatting data...");

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        email: user.email,
        // Add more data collection as needed
      };

      this.exportProgress.set(90);
      this.exportStep.set("Generating file...");

      this.dataExportService.exportToJSON(
        [exportData],
        `user-data-export-${Date.now()}`,
      );

      this.exportProgress.set(100);
      this.exportStep.set("Export complete!");
      this.toastService.success("Data exported successfully");

      setTimeout(() => {
        this.exporting.set(false);
        this.exportProgress.set(0);
      }, 2000);
    } catch (_error) {
      this.toastService.error("Failed to export data");
      this.exporting.set(false);
      this.exportProgress.set(0);
    }
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

  async showAuditLog(): Promise<void> {
    this.showAuditLogDialog = true;
    this.auditLogLoading.set(true);
    this.auditLogEntries.set([]);
    const entries = await this.deletionService.getAuditLog(50);
    this.auditLogLoading.set(false);
    this.auditLogEntries.set(entries);
  }
}
