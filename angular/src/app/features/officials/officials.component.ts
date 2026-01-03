import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule, DatePipe, CurrencyPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { Select } from "primeng/select";
import { DatePicker } from "primeng/datepicker";
import { TooltipModule } from "primeng/tooltip";
import { AvatarModule } from "primeng/avatar";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  OfficialsService,
  Official,
  GameOfficial,
} from "../../core/services/officials.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";

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
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    Select,
    TooltipModule,
    AvatarModule,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    CurrencyPipe,
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
              <p-button
                label="Add Official"
                icon="pi pi-plus"
                (onClick)="openAddOfficialDialog()"
              ></p-button>
            }
          </div>
        </app-page-header>

        <div class="officials-content">
          <!-- Officials Directory -->
          <p-card styleClass="directory-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>Officials Directory</h3>
                <div class="filter-actions">
                  <p-select
                    [options]="certificationOptions"
                    [(ngModel)]="selectedCertification"
                    placeholder="All Levels"
                    [showClear]="true"
                    (onChange)="filterOfficials()"
                  ></p-select>
                </div>
              </div>
            </ng-template>

            <p-table
              [value]="filteredOfficials()"
              [paginator]="true"
              [rows]="10"
              styleClass="p-datatable-sm"
              [rowHover]="true"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Official</th>
                  <th>Contact</th>
                  <th>Certification</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-official>
                <tr>
                  <td>
                    <div class="official-cell">
                      <p-avatar
                        [label]="getInitials(official.name)"
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
                    <p-tag
                      [value]="
                        getCertificationLabel(official.certification_level)
                      "
                      [severity]="
                        getCertificationSeverity(official.certification_level)
                      "
                    ></p-tag>
                  </td>
                  <td>
                    @if (official.years_experience) {
                      {{ official.years_experience }} years
                    } @else {
                      -
                    }
                  </td>
                  <td>
                    <p-tag
                      [value]="official.is_active ? 'Active' : 'Inactive'"
                      [severity]="official.is_active ? 'success' : 'secondary'"
                    ></p-tag>
                  </td>
                  <td>
                    <div class="action-buttons">
                      @if (isCoach()) {
                        <p-button
                          icon="pi pi-calendar-plus"
                          [text]="true"
                          pTooltip="Schedule for Game"
                          (onClick)="openScheduleDialog(official)"
                        ></p-button>
                        <p-button
                          icon="pi pi-pencil"
                          [text]="true"
                          pTooltip="Edit"
                          (onClick)="openEditOfficialDialog(official)"
                        ></p-button>
                      }
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
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
          <p-card styleClass="assignments-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>Upcoming Game Assignments</h3>
              </div>
            </ng-template>

            @if (upcomingAssignments().length === 0) {
              <div class="empty-state">
                <i class="pi pi-calendar"></i>
                <p>No upcoming game assignments</p>
              </div>
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
                        <p-tag
                          [value]="getRoleLabel(assignment.role)"
                          size="small"
                        ></p-tag>
                      </div>
                    </div>
                    <div class="assignment-status">
                      <p-tag
                        [value]="getStatusLabel(assignment.status)"
                        [severity]="getStatusSeverity(assignment.status)"
                      ></p-tag>
                      @if (assignment.payment_amount) {
                        <span class="payment">
                          {{ assignment.payment_amount | currency }}
                          <small>({{ assignment.payment_status }})</small>
                        </span>
                      }
                    </div>
                    @if (isCoach()) {
                      <div class="assignment-actions">
                        <p-button
                          icon="pi pi-check"
                          [text]="true"
                          pTooltip="Confirm"
                          (onClick)="
                            updateAssignmentStatus(assignment, 'confirmed')
                          "
                          [disabled]="assignment.status === 'confirmed'"
                        ></p-button>
                        <p-button
                          icon="pi pi-times"
                          [text]="true"
                          severity="danger"
                          pTooltip="Remove"
                          (onClick)="removeAssignment(assignment)"
                        ></p-button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </p-card>

          <!-- Payment Summary (Coach View) -->
          @if (isCoach() && paymentSummary().length > 0) {
            <p-card styleClass="payment-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3>Payment Summary</h3>
                </div>
              </ng-template>

              <p-table [value]="paymentSummary()" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Official</th>
                    <th>Games</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Pending</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-summary>
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
          [style]="{ width: '500px' }"
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

            <div class="form-row">
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

            <div class="form-row">
              <div class="form-field">
                <label>Certification Level</label>
                <p-select
                  [options]="certificationOptions"
                  [(ngModel)]="officialForm.certification_level"
                  placeholder="Select level"
                  [style]="{ width: '100%' }"
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

          <ng-template pTemplate="footer">
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="showOfficialDialog = false"
            ></p-button>
            <p-button
              [label]="editingOfficial ? 'Save Changes' : 'Add Official'"
              icon="pi pi-check"
              (onClick)="saveOfficial()"
              [disabled]="!officialForm.name"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Schedule Official Dialog -->
        <p-dialog
          header="Schedule Official for Game"
          [(visible)]="showScheduleDialog"
          [modal]="true"
          [style]="{ width: '450px' }"
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
                  [style]="{ width: '100%' }"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Role *</label>
                <p-select
                  [options]="roleOptions"
                  [(ngModel)]="scheduleForm.role"
                  placeholder="Select role"
                  [style]="{ width: '100%' }"
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

          <ng-template pTemplate="footer">
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="showScheduleDialog = false"
            ></p-button>
            <p-button
              label="Schedule"
              icon="pi pi-check"
              (onClick)="scheduleOfficial()"
              [disabled]="!scheduleForm.game_id || !scheduleForm.role"
            ></p-button>
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrl: './officials.component.scss',
})
export class OfficialsComponent implements OnInit {
  private officialsService = inject(OfficialsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
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
      .sort(
        (a, b) =>
          new Date(a.game_date!).getTime() - new Date(b.game_date!).getTime(),
      );
  });

  ngOnInit(): void {
    this.loadOfficials();
    this.loadPaymentSummary();
    this.loadUpcomingGames();
  }

  loadUpcomingGames(): void {
    const user = this.authService.getUser();
    const teamId = user?.id || "default"; // Use user ID as team ID for now

    this.officialsService.getUpcomingGames(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (games) => {
          this.upcomingGames.set(
            games.map(g => ({
              label: `${new Date(g.date).toLocaleDateString()} vs ${g.opponent}`,
              value: g.gameId
            }))
          );
        },
        error: (err) => this.logger.error("Failed to load upcoming games", err)
      });
  }

  isCoach(): boolean {
    const user = this.authService.getUser();
    return (
      user?.user_metadata?.role === "coach" ||
      user?.user_metadata?.role === "admin"
    );
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
        error: () => this.toastService.error("Failed to load officials"),
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

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
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
  ): "success" | "info" | "warn" | "danger" {
    const severities: Record<string, "success" | "info" | "warn" | "danger"> = {
      professional: "success",
      college: "info",
      high_school: "warn",
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

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" {
    const severities: Record<string, "success" | "info" | "warn" | "danger"> = {
      confirmed: "success",
      scheduled: "info",
      declined: "warn",
      no_show: "danger",
    };
    return severities[status] || "info";
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
            this.toastService.success("Official updated");
            this.showOfficialDialog = false;
            this.loadOfficials();
          },
          error: () => this.toastService.error("Failed to update official"),
        });
    } else {
      this.officialsService
        .createOfficial(data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success("Official added");
            this.showOfficialDialog = false;
            this.loadOfficials();
          },
          error: () => this.toastService.error("Failed to add official"),
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
          this.toastService.success("Official scheduled successfully");
          this.showScheduleDialog = false;
          this.loadPaymentSummary();
        },
        error: () => this.toastService.error("Failed to schedule official"),
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
          this.toastService.success("Status updated");
          this.gameAssignments.update((list) =>
            list.map((a) => (a.id === assignment.id ? { ...a, status } : a)),
          );
        },
        error: () => this.toastService.error("Failed to update status"),
      });
  }

  removeAssignment(assignment: GameOfficial): void {
    if (!confirm("Remove this official from the game?")) return;

    this.officialsService
      .removeGameOfficial(assignment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success("Assignment removed");
          this.gameAssignments.update((list) =>
            list.filter((a) => a.id !== assignment.id),
          );
          this.loadPaymentSummary();
        },
        error: () => this.toastService.error("Failed to remove assignment"),
      });
  }
}
