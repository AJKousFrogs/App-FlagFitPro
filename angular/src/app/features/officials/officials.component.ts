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
import { FormsModule } from "@angular/forms";
import { Avatar } from "primeng/avatar";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  officialAssignmentStatusSeverityMap,
} from "../../shared/utils/status.utils";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { AuthService } from "../../core/services/auth.service";
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
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { formatDate } from "../../shared/utils/date.utils";
import { getInitials } from "../../shared/utils/format.utils";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    TableModule,
    StatusTagComponent,
    Dialog,
    
    InputText,
    InputNumber,
    Select,
    Avatar,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    CurrencyPipe,
    ButtonComponent,
    IconButtonComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-main-layout>
      <div class="officials-page">
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

        <div class="officials-content">
          <!-- Officials Directory -->
          <p-card class="directory-card">
            <ng-template #header>
              <div class="card-header">
                <h3>Officials Directory</h3>
                <div class="filter-actions">
                  <p-select
                    [options]="certificationOptions"
                    [(ngModel)]="selectedCertification"
                    placeholder="All Levels"
                    [showClear]="true"
                    (onValueChange)="filterOfficials()"
                  ></p-select>
                </div>
              </div>
            </ng-template>

            <p-table
              [value]="filteredOfficials()"
              [paginator]="true"
              [rows]="10"
              class="p-datatable-sm"
              [rowHover]="true"
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
                      <p-avatar
                        [label]="getInitialsStr(official.name)"
                        shape="circle"
                        size="normal"
                      ></p-avatar>
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
          </p-card>

          <!-- Upcoming Game Assignments -->
          <p-card class="assignments-card">
            <ng-template #header>
              <div class="card-header">
                <h3>Upcoming Game Assignments</h3>
              </div>
            </ng-template>

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
          </p-card>

          <!-- Payment Summary (Coach View) -->
          @if (isCoach() && paymentSummary().length > 0) {
            <p-card class="payment-card">
              <ng-template #header>
                <div class="card-header">
                  <h3>Payment Summary</h3>
                </div>
              </ng-template>

              <p-table [value]="paymentSummary()" class="p-datatable-sm">
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
            </p-card>
          }
        </div>

        <!-- Add/Edit Official Dialog -->
        <p-dialog
          [header]="editingOfficial ? 'Edit Official' : 'Add Official'"
          [(visible)]="showOfficialDialog"
          [modal]="true"
          class="officials-standard-dialog"
        >
          <div class="dialog-form">
            <div class="form-field">
              <label>Name *</label>
              <input
                pInputText
                [(ngModel)]="officialForm.name"
                placeholder="Full name"
              />
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label>Email</label>
                <input
                  pInputText
                  [(ngModel)]="officialForm.email"
                  type="email"
                  placeholder="email@example.com"
                />
              </div>

              <div class="form-field">
                <label>Phone</label>
                <input
                  pInputText
                  [(ngModel)]="officialForm.phone"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label>Certification Level</label>
                <p-select
                  [options]="certificationOptions"
                  [(ngModel)]="officialForm.certification_level"
                  placeholder="Select level"
                  class="w-full"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Years Experience</label>
                <p-inputNumber
                  [(ngModel)]="officialForm.years_experience"
                  [min]="0"
                ></p-inputNumber>
              </div>
            </div>

            <div class="form-field">
              <label>Notes</label>
              <input
                pInputText
                [(ngModel)]="officialForm.notes"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <ng-template #footer>
            <app-button variant="text" (clicked)="showOfficialDialog = false"
              >Cancel</app-button
            >
            <app-icon-button
              icon="pi-check"
              [disabled]="!officialForm.name"
              (clicked)="saveOfficial()"
              ariaLabel="Save official"
              tooltip="Save"
            />
          </ng-template>
        </p-dialog>

        <!-- Schedule Official Dialog -->
        <p-dialog
          header="Schedule Official for Game"
          [(visible)]="showScheduleDialog"
          [modal]="true"
          class="officials-schedule-dialog"
        >
          @if (selectedOfficial()) {
            <div class="dialog-form">
              <p class="schedule-info">
                Scheduling: <strong>{{ selectedOfficial()!.name }}</strong>
              </p>

              <div class="form-field">
                <label>Game *</label>
                <p-select
                  [options]="upcomingGames()"
                  [(ngModel)]="scheduleForm.game_id"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select game"
                  class="w-full"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Role *</label>
                <p-select
                  [options]="roleOptions"
                  [(ngModel)]="scheduleForm.role"
                  placeholder="Select role"
                  class="w-full"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Payment Amount</label>
                <p-inputNumber
                  [(ngModel)]="scheduleForm.payment_amount"
                  mode="currency"
                  currency="USD"
                  [min]="0"
                ></p-inputNumber>
              </div>
            </div>
          }

          <ng-template #footer>
            <app-button variant="text" (clicked)="showScheduleDialog = false"
              >Cancel</app-button
            >
            <app-button
              iconLeft="pi-check"
              [disabled]="!scheduleForm.game_id || !scheduleForm.role"
              (clicked)="scheduleOfficial()"
              >Schedule</app-button
            >
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./officials.component.scss",
})
export class OfficialsComponent implements OnInit {
  private officialsService = inject(OfficialsService);
  private authService = inject(AuthService);
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
    const user = this.authService.getUser();
    const teamId = user?.id || "default"; // Use user ID as team ID for now

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

  openAddOfficialDialog(): void {
    this.editingOfficial = null;
    this.officialForm = this.getEmptyOfficialForm();
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
            this.showOfficialDialog = false;
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
            this.showOfficialDialog = false;
            this.loadOfficials();
          },
          error: () => this.toastService.error(TOAST.ERROR.OFFICIAL_ADD_FAILED),
        });
    }
  }

  openScheduleDialog(official: Official): void {
    this.selectedOfficial.set(official);
    this.scheduleForm = {
      game_id: "",
      role: "" as OfficialRole,
      payment_amount: 0,
    };
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
          this.showScheduleDialog = false;
          this.loadPaymentSummary();
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
          this.loadPaymentSummary();
        },
        error: () =>
          this.toastService.error(TOAST.ERROR.ASSIGNMENT_REMOVE_FAILED),
      });
  }
}
