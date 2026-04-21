import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { InputNumber, type InputNumberInputEvent } from "primeng/inputnumber";
import { TableModule } from "primeng/table";
import { FormInputComponent } from "../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../shared/components/select/select.component";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  officialAssignmentStatusSeverityMap,
} from "../../shared/utils/status.utils";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { LoggerService } from "../../core/services/logger.service";
import {
  GameOfficial,
  Official,
  OfficialsService,
} from "../../core/services/officials.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { DialogService } from "../../core/ui/dialog.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { formatDate } from "../../shared/utils/date.utils";
import { getInitials } from "../../shared/utils/format.utils";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../shared/components/ui-components";

type CertificationLevel = "youth" | "high_school" | "college" | "professional";
type OfficialRole =
  | "head_referee"
  | "line_judge"
  | "field_judge"
  | "back_judge"
  | "scorekeeper"
  | "timekeeper";
type AssignmentStatus = "scheduled" | "confirmed" | "declined" | "no_show";

@Component({
  selector: "app-officials",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TableModule,
    StatusTagComponent,
    InputNumber,
    FormInputComponent,
    SelectComponent,
    AvatarComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    CurrencyPipe,
    ButtonComponent,
    CardShellComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./officials.component.html",
  styleUrl: "./officials.component.scss",
})
export class OfficialsComponent implements OnInit {
  private officialsService = inject(OfficialsService);
  private teamMembershipService = inject(TeamMembershipService);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  // State
  officials = signal<Official[]>([]);
  gameAssignments = signal<GameOfficial[]>([]);
  paymentSummary = signal<
    {
      official_id: string;
      official_name: string;
      total_games: number;
      total_payment: number;
      paid: number;
      pending: number;
    }[]
  >([]);
  upcomingGames = signal<{ label: string; value: string }[]>([]);

  // UI State
  selectedCertification: CertificationLevel | null = null;
  showOfficialDialog = false;
  showScheduleDialog = false;
  editingOfficial: Official | null = null;
  selectedOfficial = signal<Official | null>(null);

  // Form data
  officialForm = this.getEmptyOfficialForm();
  scheduleForm = { game_id: "", role: "" as OfficialRole, payment_amount: 0 };

  // Options
  certificationOptions = this.officialsService.CERTIFICATION_LEVELS.map(
    (c) => ({
      label: c.label,
      value: c.value,
    }),
  );

  roleOptions = this.officialsService.OFFICIAL_ROLES.map((r) => ({
    label: r.label,
    value: r.value,
  }));

  // Computed
  filteredOfficials = computed(() => {
    let list = this.officials();
    if (this.selectedCertification) {
      list = list.filter(
        (o) => o.certification_level === this.selectedCertification,
      );
    }
    return list;
  });

  upcomingAssignments = computed(() => {
    const now = new Date();
    return this.gameAssignments()
      .filter((a) => a.game_date && new Date(a.game_date) >= now)
      .sort((a, b) => {
        const dateA = a.game_date ? new Date(a.game_date).getTime() : 0;
        const dateB = b.game_date ? new Date(b.game_date).getTime() : 0;
        return dateA - dateB;
      });
  });

  ngOnInit(): void {
    this.loadOfficials();
    this.loadPaymentSummary();
    this.loadUpcomingGames();
  }

  loadUpcomingGames(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId) {
      this.upcomingGames.set([]);
      return;
    }

    this.officialsService
      .getUpcomingGames(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (games) => {
          this.upcomingGames.set(
            games.map((g) => ({
              label: `${formatDate(g.date, "P")} vs ${g.opponent}`,
              value: g.value,
            })),
          );
        },
        error: (err) => this.logger.error("Failed to load upcoming games", err),
      });
  }

  /**
   * Check if user is a coach - uses TeamMembershipService as single source of truth
   */
  isCoach(): boolean {
    return this.teamMembershipService.canManageRoster();
  }

  getEmptyOfficialForm() {
    return {
      name: "",
      email: "",
      phone: "",
      certification_level: undefined as CertificationLevel | undefined,
      years_experience: undefined as number | undefined,
      notes: "",
      is_active: true,
    };
  }

  loadOfficials(): void {
    this.officialsService
      .getOfficials({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (officials) => this.officials.set(officials),
        error: () => this.toastService.error(TOAST.ERROR.OFFICIAL_LOAD_FAILED),
      });
  }

  loadPaymentSummary(): void {
    this.officialsService
      .getPaymentSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => this.paymentSummary.set(summary),
        error: () => this.logger.error("Failed to load payment summary"),
      });
  }

  filterOfficials(): void {
    // Computed handles filtering
  }

  onSelectedCertificationChange(value: CertificationLevel | null): void {
    this.selectedCertification = value;
    this.filterOfficials();
  }

  onOfficialNameChange(value: string): void {
    this.officialForm = { ...this.officialForm, name: value };
  }

  onOfficialNameInput(event: Event): void {
    this.onOfficialNameChange(this.readInputValue(event));
  }

  onOfficialEmailChange(value: string): void {
    this.officialForm = { ...this.officialForm, email: value };
  }

  onOfficialEmailInput(event: Event): void {
    this.onOfficialEmailChange(this.readInputValue(event));
  }

  onOfficialPhoneChange(value: string): void {
    this.officialForm = { ...this.officialForm, phone: value };
  }

  onOfficialPhoneInput(event: Event): void {
    this.onOfficialPhoneChange(this.readInputValue(event));
  }

  onOfficialCertificationChange(value: CertificationLevel | null): void {
    this.officialForm = {
      ...this.officialForm,
      certification_level: value ?? undefined,
    };
  }

  onOfficialYearsExperienceInput(event: InputNumberInputEvent): void {
    this.onOfficialYearsExperienceChange(event.value ?? null);
  }

  onOfficialYearsExperienceChange(value: number | null): void {
    this.officialForm = {
      ...this.officialForm,
      years_experience: value ?? undefined,
    };
  }

  onOfficialNotesChange(value: string): void {
    this.officialForm = { ...this.officialForm, notes: value };
  }

  onOfficialNotesInput(event: Event): void {
    this.onOfficialNotesChange(this.readInputValue(event));
  }

  onScheduleGameIdChange(value: string | null): void {
    this.scheduleForm = { ...this.scheduleForm, game_id: value ?? "" };
  }

  onScheduleRoleChange(value: OfficialRole | null): void {
    this.scheduleForm = { ...this.scheduleForm, role: value ?? ("" as OfficialRole) };
  }

  onSchedulePaymentAmountInput(event: InputNumberInputEvent): void {
    this.onSchedulePaymentAmountChange(event.value ?? null);
  }

  onSchedulePaymentAmountChange(value: number | null): void {
    this.scheduleForm = { ...this.scheduleForm, payment_amount: value ?? 0 };
  }

  private readInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getCertificationLabel(level: string | undefined): string {
    if (!level) return "N/A";
    const found = this.officialsService.CERTIFICATION_LEVELS.find(
      (c) => c.value === level,
    );
    return found?.label || level;
  }

  getCertificationSeverity(
    level: string | undefined,
  ): "success" | "info" | "warning" | "danger" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger"
    > = {
      professional: "success",
      college: "info",
      high_school: "warning",
      youth: "secondary" as "info",
    };
    return severities[level || ""] || "info";
  }

  getRoleLabel(role: string): string {
    const found = this.officialsService.OFFICIAL_ROLES.find(
      (r) => r.value === role,
    );
    return found?.label || role;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      scheduled: "Scheduled",
      confirmed: "Confirmed",
      declined: "Declined",
      no_show: "No Show",
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): "success" | "info" | "warning" | "danger" {
    return getMappedStatusSeverity(
      status,
      officialAssignmentStatusSeverityMap,
      "info",
    );
  }

  private refreshAssignmentsOverview(): void {
    this.loadPaymentSummary();
  }

  closeOfficialDialog(): void {
    this.showOfficialDialog = false;
    this.editingOfficial = null;
    this.officialForm = this.getEmptyOfficialForm();
  }

  closeScheduleDialog(): void {
    this.showScheduleDialog = false;
    this.selectedOfficial.set(null);
    this.scheduleForm = {
      game_id: "",
      role: "" as OfficialRole,
      payment_amount: 0,
    };
  }

  openAddOfficialDialog(): void {
    this.closeOfficialDialog();
    this.showOfficialDialog = true;
  }

  openEditOfficialDialog(official: Official): void {
    this.editingOfficial = official;
    this.officialForm = {
      name: official.name,
      email: official.email || "",
      phone: official.phone || "",
      certification_level: official.certification_level,
      years_experience: official.years_experience,
      notes: official.notes || "",
      is_active: official.is_active,
    };
    this.showOfficialDialog = true;
  }

  saveOfficial(): void {
    if (!this.officialForm.name) return;

    const data = {
      name: this.officialForm.name,
      email: this.officialForm.email || undefined,
      phone: this.officialForm.phone || undefined,
      certification_level: this.officialForm.certification_level,
      years_experience: this.officialForm.years_experience,
      notes: this.officialForm.notes || undefined,
      is_active: this.officialForm.is_active,
    };

    if (this.editingOfficial) {
      this.officialsService
        .updateOfficial(this.editingOfficial.id, data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success(TOAST.SUCCESS.OFFICIAL_UPDATED);
            this.closeOfficialDialog();
            this.loadOfficials();
          },
          error: () =>
            this.toastService.error(TOAST.ERROR.OFFICIAL_UPDATE_FAILED),
        });
    } else {
      this.officialsService
        .createOfficial(data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success(TOAST.SUCCESS.OFFICIAL_ADDED);
            this.closeOfficialDialog();
            this.loadOfficials();
          },
          error: () => this.toastService.error(TOAST.ERROR.OFFICIAL_ADD_FAILED),
        });
    }
  }

  openScheduleDialog(official: Official): void {
    this.closeScheduleDialog();
    this.selectedOfficial.set(official);
    this.showScheduleDialog = true;
  }

  scheduleOfficial(): void {
    const official = this.selectedOfficial();
    if (!official || !this.scheduleForm.game_id || !this.scheduleForm.role)
      return;

    this.officialsService
      .scheduleOfficial({
        game_id: this.scheduleForm.game_id,
        official_id: official.id,
        role: this.scheduleForm.role,
        payment_amount: this.scheduleForm.payment_amount || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.OFFICIAL_SCHEDULED);
          this.closeScheduleDialog();
          this.refreshAssignmentsOverview();
        },
        error: () =>
          this.toastService.error(TOAST.ERROR.OFFICIAL_SCHEDULE_FAILED),
      });
  }

  updateAssignmentStatus(
    assignment: GameOfficial,
    status: AssignmentStatus,
  ): void {
    this.officialsService
      .updateGameOfficial(assignment.id, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.STATUS_UPDATED);
          this.gameAssignments.update((list) =>
            list.map((a) => (a.id === assignment.id ? { ...a, status } : a)),
          );
        },
        error: () => this.toastService.error(TOAST.ERROR.STATUS_UPDATE_FAILED),
      });
  }

  async removeAssignment(assignment: GameOfficial): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      "Remove this official from the game?",
      "Remove Official",
    );
    if (!confirmed) return;

    this.officialsService
      .removeGameOfficial(assignment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.ASSIGNMENT_REMOVED);
          this.gameAssignments.update((list) =>
            list.filter((a) => a.id !== assignment.id),
          );
          this.refreshAssignmentsOverview();
        },
        error: () =>
          this.toastService.error(TOAST.ERROR.ASSIGNMENT_REMOVE_FAILED),
      });
  }
}
