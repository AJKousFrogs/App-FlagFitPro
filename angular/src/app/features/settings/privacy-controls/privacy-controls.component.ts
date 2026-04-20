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
import { Chip } from "primeng/chip";
import { Divider } from "primeng/divider";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { Tooltip } from "primeng/tooltip";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { AccountDeletionService } from "../../../core/services/account-deletion.service";
import { DataExportService } from "../../../core/services/data-export.service";
import {
  EmergencyContact,
  EmergencySharingLevel,
  METRIC_CATEGORIES,
  PrivacySettingsService,
} from "../../../core/services/privacy-settings.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
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
    SelectComponent,
    FormInputComponent,
    Divider,
    Tooltip,
    Chip,
    Accordion,
    AccordionPanel,
    CardShellComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    ButtonComponent,
    IconButtonComponent,
    AlertComponent,
    StatusTagComponent,
    AppLoadingComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./privacy-controls.component.html",
  styleUrl: "./privacy-controls.component.scss",
})
export class PrivacyControlsComponent implements OnInit {
  private privacyService = inject(PrivacySettingsService);
  private dataExportService = inject(DataExportService);
  private deletionService = inject(AccountDeletionService);
  private supabase = inject(SupabaseService);
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

  onNewContactRelationshipSelect(value: string | null | undefined): void {
    this.newContact = { ...this.newContact, relationship: typeof value === "string" ? value : "" };
  }

  onDeletionReasonChange(value: string): void {
    this.deletionReason = value;
  }

  onDeleteConfirmTextChange(value: string): void {
    this.deleteConfirmText = value;
  }

  private readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  async onAiProcessingToggle(event: Event): Promise<void> {
    await this.onAiProcessingChange(this.readChecked(event));
  }

  async onAiProcessingChange(enabled: boolean): Promise<void> {
    await this.privacyService.updateAiProcessing(enabled);
    // Refresh consent status after change
    await this.loadAiConsentStatus();
  }

  async onResearchOptInToggle(event: Event): Promise<void> {
    await this.onResearchOptInChange(this.readChecked(event));
  }

  async onResearchOptInChange(optIn: boolean): Promise<void> {
    await this.privacyService.updateResearchOptIn(optIn);
  }

  async onMarketingOptInToggle(event: Event): Promise<void> {
    await this.onMarketingOptInChange(this.readChecked(event));
  }

  async onMarketingOptInChange(optIn: boolean): Promise<void> {
    await this.privacyService.updateMarketingOptIn(optIn);
  }

  async onEmergencyLevelSelect(value: EmergencySharingLevel | null | undefined): Promise<void> {
    if (!value) {
      return;
    }

    await this.onEmergencyLevelChange(value);
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

  async onTeamSharingToggle(
    teamId: string,
    type: "performance" | "health",
    event: Event,
  ): Promise<void> {
    await this.onTeamSharingChange(teamId, type, this.readChecked(event));
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
      const user = this.supabase.currentUser();
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
