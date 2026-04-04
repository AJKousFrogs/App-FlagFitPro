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
  template: `
    <app-main-layout>
      <div class="officials-page ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Officials Management"
          subtitle="Schedule and manage referees"
        >
          <div class="header-actions">
            @if (isCoach()) {
              <app-button iconLeft="pi-plus" (clicked)="openAddOfficialDialog()"
                >Add Official</app-button
              >
            }
          </div>
        </app-page-header>

        <div class="officials-content ui-page-stack">
          <!-- Officials Directory -->
          <app-card-shell class="directory-card" title="Officials Directory">
            <div header-actions class="filter-actions">
              <app-select
                [options]="certificationOptions"
                (change)="onSelectedCertificationChange($event)"
                placeholder="All Levels"
                [showClear]="true"
                class="officials-filter-select"
              ></app-select>
            </div>

            <p-table
              [value]="filteredOfficials()"
              [paginator]="true"
              [rows]="10"
              class="table-compact"
              [rowHover]="true"
              [scrollable]="true"
            >
              <ng-template #header>
                <tr>
                  <th>Official</th>
                  <th>Contact</th>
                  <th>Certification</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template #body let-official>
                <tr>
                  <td>
                    <div class="official-cell">
                      <app-avatar
                        [label]="getInitialsStr(official.name)"
                        shape="circle"
                      />
                      <span class="official-name">{{ official.name }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="contact-info">
                      @if (official.email) {
                        <span
                          ><i class="pi pi-envelope"></i>
                          {{ official.email }}</span
                        >
                      }
                      @if (official.phone) {
                        <span
                          ><i class="pi pi-phone"></i>
                          {{ official.phone }}</span
                        >
                      }
                    </div>
                  </td>
                  <td>
                    <app-status-tag
                      [value]="
                        getCertificationLabel(official.certification_level)
                      "
                      [severity]="
                        getCertificationSeverity(official.certification_level)
                      "
                      size="sm"
                    />
                  </td>
                  <td>
                    @if (official.years_experience) {
                      {{ official.years_experience }} years
                    } @else {
                      -
                    }
                  </td>
                  <td>
                    <app-status-tag
                      [value]="official.is_active ? 'Active' : 'Inactive'"
                      [severity]="official.is_active ? 'success' : 'secondary'"
                      size="sm"
                    />
                  </td>
                  <td>
                    <div class="action-buttons">
                      @if (isCoach()) {
                        <app-icon-button
                          icon="pi-calendar-plus"
                          variant="text"
                          (clicked)="openScheduleDialog(official)"
                          ariaLabel="Schedule official for game"
                          tooltip="Schedule"
                        />
                        <app-icon-button
                          icon="pi-pencil"
                          variant="text"
                          (clicked)="openEditOfficialDialog(official)"
                          ariaLabel="Edit official"
                          tooltip="Edit"
                        />
                      }
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template #emptymessage>
                <tr>
                  <td colspan="6">
                    <div class="empty-message">
                      <i class="pi pi-users"></i>
                      <p>No officials found</p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </app-card-shell>

          <!-- Upcoming Game Assignments -->
          <app-card-shell class="assignments-card" title="Upcoming Game Assignments">
            @if (upcomingAssignments().length === 0) {
              <app-empty-state
                icon="pi-calendar"
                heading="No upcoming game assignments"
                description="Game assignments will appear here when officials are scheduled."
              />
            } @else {
              <div class="assignments-list">
                @for (
                  assignment of upcomingAssignments();
                  track assignment.id
                ) {
                  <div class="assignment-item">
                    <div class="assignment-info">
                      <div class="game-info">
                        <span class="game-date">{{
                          assignment.game_date | date: "EEE, MMM d"
                        }}</span>
                        @if (assignment.game_location) {
                          <span class="game-location">
                            <i class="pi pi-map-marker"></i>
                            {{ assignment.game_location }}
                          </span>
                        }
                      </div>
                      <div class="official-info">
                        <span class="official-name">{{
                          assignment.official_name
                        }}</span>
                        <app-status-tag
                          [value]="getRoleLabel(assignment.role)"
                          size="sm"
                        />
                      </div>
                    </div>
                    <div class="assignment-status">
                      <app-status-tag
                        [value]="getStatusLabel(assignment.status)"
                        [severity]="getStatusSeverity(assignment.status)"
                        size="sm"
                      />
                      @if (assignment.payment_amount) {
                        <span class="payment">
                          {{ assignment.payment_amount | currency }}
                          <small>({{ assignment.payment_status }})</small>
                        </span>
                      }
                    </div>
                    @if (isCoach()) {
                      <div class="assignment-actions">
                        <app-icon-button
                          icon="pi-check"
                          variant="text"
                          [disabled]="assignment.status === 'confirmed'"
                          (clicked)="
                            updateAssignmentStatus(assignment, 'confirmed')
                          "
                          ariaLabel="Confirm assignment"
                          tooltip="Confirm"
                        />
                        <app-icon-button
                          icon="pi-times"
                          variant="text"
                          (clicked)="removeAssignment(assignment)"
                          ariaLabel="Remove assignment"
                          tooltip="Remove"
                        />
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </app-card-shell>

          <!-- Payment Summary (Coach View) -->
          @if (isCoach() && paymentSummary().length > 0) {
            <app-card-shell class="payment-card" title="Payment Summary">
              <p-table
                [value]="paymentSummary()"
                class="table-compact"
                [scrollable]="true"
              >
                <ng-template #header>
                  <tr>
                    <th>Official</th>
                    <th>Games</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Pending</th>
                  </tr>
                </ng-template>
                <ng-template #body let-summary>
                  <tr>
                    <td>{{ summary.official_name }}</td>
                    <td>{{ summary.total_games }}</td>
                    <td>{{ summary.total_payment | currency }}</td>
                    <td class="paid">{{ summary.paid | currency }}</td>
                    <td class="pending">{{ summary.pending | currency }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </app-card-shell>
          }
        </div>

        <!-- Add/Edit Official Dialog -->
        <app-dialog
          [(visible)]="showOfficialDialog"
          [modal]="true"
          dialogSize="md"
          [blockScroll]="true"
          [draggable]="false"
          [ariaLabel]="editingOfficial ? 'Edit official' : 'Add official'"
        >
        <app-dialog-header
          icon="user-plus"
          [title]="editingOfficial ? 'Edit Official' : 'Add Official'"
          subtitle="Manage referee contact details, certification, and availability notes."
            (close)="closeOfficialDialog()"
          />
          <div class="officials-dialog-form">
            <div class="form-field">
              <app-form-input
                label="Name *"
                [value]="officialForm.name"
                (valueChange)="onOfficialNameChange($event)"
                placeholder="Full name"
              />
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <app-form-input
                  label="Email"
                  [value]="officialForm.email"
                  (valueChange)="onOfficialEmailChange($event)"
                  type="email"
                  placeholder="email@example.com"
                />
              </div>

              <div class="form-field">
                <app-form-input
                  label="Phone"
                  [value]="officialForm.phone"
                  (valueChange)="onOfficialPhoneChange($event)"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <app-select
                  label="Certification Level"
                  [options]="certificationOptions"
                  (change)="onOfficialCertificationChange($event)"
                  placeholder="Select level"
                  class="w-full"
                ></app-select>
              </div>

              <div class="form-field">
                <label>Years Experience</label>
                <p-inputNumber
                  (onInput)="onOfficialYearsExperienceInput($event)"
                  [min]="0"
                ></p-inputNumber>
              </div>
            </div>

            <div class="form-field">
              <app-form-input
                label="Notes"
                [value]="officialForm.notes"
                (valueChange)="onOfficialNotesChange($event)"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <app-dialog-footer
            dialogFooter
            cancelLabel="Cancel"
            primaryLabel="Save Official"
            primaryIcon="check"
            [disabled]="!officialForm.name"
            (cancel)="closeOfficialDialog()"
            (primary)="saveOfficial()"
          />
        </app-dialog>

        <!-- Schedule Official Dialog -->
        <app-dialog
          [(visible)]="showScheduleDialog"
          [modal]="true"
          dialogSize="sm"
          [blockScroll]="true"
          [draggable]="false"
          ariaLabel="Schedule official for game"
        >
          <app-dialog-header
            icon="calendar-plus"
            title="Schedule Official for Game"
            subtitle="Assign the official to an upcoming game and record the expected payment."
            (close)="closeScheduleDialog()"
          />
          @if (selectedOfficial()) {
            <div class="officials-dialog-form">
              <p class="schedule-info">
                Scheduling: <strong>{{ selectedOfficial()!.name }}</strong>
              </p>

              <div class="form-field">
                <app-select
                  label="Game *"
                  [options]="upcomingGames()"
                  (change)="onScheduleGameIdChange($event)"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select game"
                  class="w-full"
                ></app-select>
              </div>

              <div class="form-field">
                <app-select
                  label="Role *"
                  [options]="roleOptions"
                  (change)="onScheduleRoleChange($event)"
                  placeholder="Select role"
                  class="w-full"
                ></app-select>
              </div>

              <div class="form-field">
                <label>Payment Amount</label>
                <p-inputNumber
                  (onInput)="onSchedulePaymentAmountInput($event)"
                  mode="currency"
                  currency="USD"
                  [min]="0"
                ></p-inputNumber>
              </div>
            </div>
          }

          <app-dialog-footer
            dialogFooter
            cancelLabel="Cancel"
            primaryLabel="Schedule"
            primaryIcon="check"
            [disabled]="!scheduleForm.game_id || !scheduleForm.role"
            (cancel)="closeScheduleDialog()"
            (primary)="scheduleOfficial()"
          />
        </app-dialog>
      </div>
    </app-main-layout>
  `,
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
    Array<{
      official_id: string;
      official_name: string;
      total_games: number;
      total_payment: number;
      paid: number;
      pending: number;
    }>
  >([]);
  upcomingGames = signal<Array<{ label: string; value: string }>>([]);

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
