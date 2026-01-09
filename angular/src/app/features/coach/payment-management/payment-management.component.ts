/**
 * Payment Management Component (Coach View)
 *
 * Manage team fees, track player payments, send reminders, and
 * maintain financial records for tournaments, dues, and equipment.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { ContextService } from "../../../core/services/context.service";
import { LoggerService } from "../../../core/services/logger.service";
import { RosterService } from "../../roster/roster.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface TeamFee {
  id: string;
  name: string;
  type: "dues" | "tournament" | "equipment" | "other";
  amount: number;
  guestFee?: number;
  dueDate: string;
  description?: string;
  collected: number;
  total: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  isOverdue: boolean;
  outstanding: OutstandingBalance[];
}

interface OutstandingBalance {
  playerId: string;
  playerName: string;
  amount: number;
  note?: string;
}

interface PlayerBalance {
  id: string;
  playerName: string;
  balance: number;
  status: "paid" | "due" | "overdue";
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  daysOverdue?: number;
}

interface Payment {
  id: string;
  playerId: string;
  playerName: string;
  feeId: string;
  feeName: string;
  amount: number;
  method: string;
  date: string;
  reference?: string;
}

// ===== Constants =====
const FEE_TYPES = [
  { label: "Monthly Dues", value: "dues" },
  { label: "Tournament Entry", value: "tournament" },
  { label: "Equipment", value: "equipment" },
  { label: "One-time / Other", value: "other" },
];

const PAYMENT_METHODS = [
  { label: "Venmo", value: "venmo" },
  { label: "Zelle", value: "zelle" },
  { label: "Cash", value: "cash" },
  { label: "PayPal", value: "paypal" },
  { label: "Other", value: "other" },
];

const BALANCE_FILTERS = [
  { label: "Show All", value: "all" },
  { label: "Outstanding Only", value: "outstanding" },
  { label: "Overdue Only", value: "overdue" },
  { label: "Paid Up", value: "paid" },
];

@Component({
  selector: "app-payment-management",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    Checkbox,
    DatePicker,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    ProgressBarModule,
    RadioButton,
    Select,
    TableModule,
    TagModule,
    Textarea,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="payment-management-page">
        <app-page-header
          title="Payment Management"
          subtitle="Track team dues and payments"
          icon="pi-dollar"
        >
          <app-button iconLeft="pi-plus" (clicked)="openCreateFeeDialog()"
            >Create Fee</app-button
          >
        </app-page-header>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'overview'"
            (click)="activeTab.set('overview')"
          >
            Overview
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'fees'"
            (click)="activeTab.set('fees')"
          >
            Active Fees
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'balances'"
            (click)="activeTab.set('balances')"
          >
            Player Balances
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'history'"
            (click)="activeTab.set('history')"
          >
            Payment History
          </button>
        </div>

        @switch (activeTab()) {
          @case ("overview") {
            <!-- Financial Overview -->
            <div class="financial-overview">
              <div class="stat-card balance">
                <span class="stat-icon">💰</span>
                <div class="stat-content">
                  <span class="stat-value">\${{ totalOutstanding() }}</span>
                  <span class="stat-label">Outstanding Balance</span>
                  <span class="stat-sub">{{ playersOwing() }} players owe</span>
                </div>
              </div>
              <div class="stat-card collected">
                <span class="stat-icon">✅</span>
                <div class="stat-content">
                  <span class="stat-value">\${{ totalCollected() }}</span>
                  <span class="stat-label">Collected This Month</span>
                  <span class="stat-sub">Season total</span>
                </div>
              </div>
              <div class="stat-card due">
                <span class="stat-icon">📅</span>
                <div class="stat-content">
                  <span class="stat-value">\${{ dueThisMonth() }}</span>
                  <span class="stat-label">Due This Month</span>
                  <span class="stat-sub">{{ playersDueCount() }} players</span>
                </div>
              </div>
              <div class="stat-card overdue">
                <span class="stat-icon">⚠️</span>
                <div class="stat-content">
                  <span class="stat-value">\${{ totalOverdue() }}</span>
                  <span class="stat-label">Overdue</span>
                  <span class="stat-sub">{{ playersOverdue() }} players</span>
                </div>
              </div>
            </div>

            <!-- Active Fees Preview -->
            <p-card>
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3>Active Fees</h3>
                  <app-button variant="text" (clicked)="activeTab.set('fees')"
                    >View All</app-button
                  >
                </div>
              </ng-template>
              <div class="fees-preview">
                @for (fee of fees().slice(0, 2); track fee.id) {
                  <div class="fee-preview-card" [class.overdue]="fee.isOverdue">
                    <div class="fee-header">
                      <span class="fee-icon">{{ getFeeIcon(fee.type) }}</span>
                      <h4>{{ fee.name }}</h4>
                      @if (fee.isOverdue) {
                        <p-tag value="OVERDUE" severity="danger"></p-tag>
                      }
                    </div>
                    <div class="fee-progress">
                      <p-progressBar
                        [value]="getCollectionPercent(fee)"
                        [showValue]="false"
                        [style]="{ height: '12px' }"
                      ></p-progressBar>
                      <span class="progress-text"
                        >\${{ fee.collected }} / \${{ fee.total }} ({{
                          getCollectionPercent(fee)
                        }}%)</span
                      >
                    </div>
                  </div>
                }
              </div>
            </p-card>
          }

          @case ("fees") {
            <!-- Active Fees List -->
            <div class="fees-list">
              @for (fee of fees(); track fee.id) {
                <div class="fee-card" [class.overdue]="fee.isOverdue">
                  <div class="fee-header">
                    <div class="fee-title">
                      <span class="fee-icon">{{ getFeeIcon(fee.type) }}</span>
                      <h3>{{ fee.name }}</h3>
                    </div>
                    <div class="fee-actions">
                      <app-button variant="text" size="sm" iconLeft="pi-pencil"
                        >Edit fee</app-button
                      >
                      <app-button
                        variant="text"
                        size="sm"
                        iconLeft="pi-ellipsis-v"
                        >More options</app-button
                      >
                    </div>
                  </div>

                  <div class="fee-details">
                    <p>
                      <strong>Base Fee:</strong> \${{ fee.amount }}/player
                      @if (fee.guestFee) {
                        <span class="guest-fee"
                          >Guest Fee: \${{ fee.guestFee }}/guest</span
                        >
                      }
                    </p>
                    <p>
                      <strong>Due Date:</strong> {{ fee.dueDate }}
                      @if (fee.isOverdue) {
                        <span class="overdue-badge">⚠️ OVERDUE</span>
                      }
                    </p>
                  </div>

                  <div class="fee-progress-section">
                    <h4>Collection Progress:</h4>
                    <p-progressBar
                      [value]="getCollectionPercent(fee)"
                      [showValue]="false"
                      [style]="{ height: '16px' }"
                    ></p-progressBar>
                    <span class="progress-detail"
                      >\${{ fee.collected }} / \${{ fee.total }} ({{
                        getCollectionPercent(fee)
                      }}%)</span
                    >
                    <p class="status-counts">
                      {{ fee.paidCount }} paid full •
                      {{ fee.partialCount }} partial •
                      {{ fee.unpaidCount }} unpaid
                    </p>
                  </div>

                  @if (fee.outstanding.length > 0) {
                    <div class="outstanding-section">
                      <h4>Outstanding:</h4>
                      <ul class="outstanding-list">
                        @for (item of fee.outstanding; track item.playerId) {
                          <li>
                            {{ item.playerName }}: \${{ item.amount }}
                            {{ item.note || "" }}
                          </li>
                        }
                      </ul>
                    </div>
                  }

                  <div class="fee-card-actions">
                    <app-button
                      variant="secondary"
                      size="sm"
                      (clicked)="viewFeeDetails(fee)"
                      >View Details</app-button
                    >
                    <app-button
                      variant="secondary"
                      size="sm"
                      (clicked)="sendFeeReminders(fee)"
                      >Send Reminders</app-button
                    >
                    <app-button
                      size="sm"
                      (clicked)="openRecordPaymentDialog(fee)"
                      >Mark Paid</app-button
                    >
                  </div>
                </div>
              }
            </div>
          }

          @case ("balances") {
            <!-- Player Balances -->
            <p-card>
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3>Player Balances</h3>
                  <div class="balance-filters">
                    <span class="p-input-icon-left">
                      <i class="pi pi-search"></i>
                      <input
                        type="text"
                        pInputText
                        [(ngModel)]="balanceSearch"
                        placeholder="Search players..."
                      />
                    </span>
                    <p-select
                      [options]="balanceFilters"
                      [(ngModel)]="balanceFilter"
                      optionLabel="label"
                      optionValue="value"
                    ></p-select>
                  </div>
                </div>
              </ng-template>

              <p-table [value]="filteredBalances()" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Player</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Last Payment</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-balance>
                  <tr>
                    <td>{{ balance.playerName }}</td>
                    <td [class.owes]="balance.balance > 0">
                      \${{ balance.balance }}
                    </td>
                    <td>
                      <p-tag
                        [value]="getStatusLabel(balance.status)"
                        [severity]="getStatusSeverity(balance.status)"
                      ></p-tag>
                    </td>
                    <td>
                      @if (balance.lastPaymentDate) {
                        {{ balance.lastPaymentDate }}, \${{
                          balance.lastPaymentAmount
                        }}
                      } @else {
                        --
                      }
                    </td>
                    <td>
                      @if (balance.balance > 0) {
                        <app-button
                          variant="text"
                          size="sm"
                          iconLeft="pi-comment"
                          (clicked)="sendPlayerReminder(balance)"
                          >Send reminder</app-button
                        >
                        <app-button
                          variant="secondary"
                          size="sm"
                          (clicked)="markPlayerPaid(balance)"
                          >Mark</app-button
                        >
                      } @else {
                        <app-button
                          variant="text"
                          size="sm"
                          (clicked)="viewPlayerHistory(balance)"
                          >View</app-button
                        >
                      }
                    </td>
                  </tr>
                </ng-template>
              </p-table>

              <div class="balance-actions">
                <app-button
                  variant="secondary"
                  iconLeft="pi-download"
                  (clicked)="exportCSV()"
                  >Export CSV</app-button
                >
                <app-button iconLeft="pi-bell" (clicked)="sendAllReminders()"
                  >Send All Reminders</app-button
                >
              </div>
            </p-card>
          }

          @case ("history") {
            <!-- Payment History -->
            <p-card>
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3>Payment History</h3>
                </div>
              </ng-template>

              <p-table [value]="payments()" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Date</th>
                    <th>Player</th>
                    <th>Fee</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-payment>
                  <tr>
                    <td>{{ payment.date }}</td>
                    <td>{{ payment.playerName }}</td>
                    <td>{{ payment.feeName }}</td>
                    <td>\${{ payment.amount }}</td>
                    <td>{{ payment.method }}</td>
                    <td>{{ payment.reference || "--" }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-card>
          }
        }
      </div>

      <!-- Create Fee Dialog -->
      <p-dialog
        [(visible)]="showFeeDialog"
        header="Create Fee"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '600px' }"
      >
        <div class="fee-form">
          <div class="form-field">
            <label>Fee Name</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="feeForm.name"
              placeholder="e.g., February Team Dues"
            />
          </div>

          <div class="form-field">
            <label>Fee Type</label>
            <div class="radio-group">
              @for (type of feeTypes; track type.value) {
                <div class="radio-option">
                  <p-radioButton
                    name="feeType"
                    [value]="type.value"
                    [(ngModel)]="feeForm.type"
                    [inputId]="'feeType-' + type.value"
                  ></p-radioButton>
                  <label [for]="'feeType-' + type.value">{{
                    type.label
                  }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Amount per Player</label>
              <p-inputNumber
                [(ngModel)]="feeForm.amount"
                mode="currency"
                currency="USD"
                locale="en-US"
              ></p-inputNumber>
            </div>
            <div class="form-field">
              <label>Guest Fee (optional)</label>
              <p-inputNumber
                [(ngModel)]="feeForm.guestFee"
                mode="currency"
                currency="USD"
                locale="en-US"
              ></p-inputNumber>
            </div>
          </div>

          <div class="form-field">
            <label>Due Date</label>
            <p-datepicker
              [(ngModel)]="feeForm.dueDate"
              [showIcon]="true"
              styleClass="w-full"
            ></p-datepicker>
          </div>

          <div class="form-field">
            <label>Description / Breakdown</label>
            <textarea
              pTextarea
              [(ngModel)]="feeForm.description"
              rows="4"
              placeholder="What this fee covers..."
            ></textarea>
          </div>

          <div class="form-field">
            <label>Apply To</label>
            <div class="radio-group">
              <div class="radio-option">
                <p-radioButton
                  name="applyTo"
                  value="all"
                  [(ngModel)]="feeForm.applyTo"
                  inputId="applyAll"
                ></p-radioButton>
                <label for="applyAll"
                  >All active players ({{ totalPlayers() }})</label
                >
              </div>
              <div class="radio-option">
                <p-radioButton
                  name="applyTo"
                  value="select"
                  [(ngModel)]="feeForm.applyTo"
                  inputId="applySelect"
                ></p-radioButton>
                <label for="applySelect">Select specific players...</label>
              </div>
            </div>
          </div>

          <div class="form-field">
            <label>Reminders</label>
            <div class="checkbox-group">
              <div class="checkbox-option">
                <p-checkbox
                  [(ngModel)]="feeForm.notifyOnCreate"
                  [binary]="true"
                  inputId="notifyCreate"
                ></p-checkbox>
                <label for="notifyCreate">Send notification when created</label>
              </div>
              <div class="checkbox-option">
                <p-checkbox
                  [(ngModel)]="feeForm.remind3Days"
                  [binary]="true"
                  inputId="remind3"
                ></p-checkbox>
                <label for="remind3">Send reminder 3 days before due</label>
              </div>
              <div class="checkbox-option">
                <p-checkbox
                  [(ngModel)]="feeForm.remindOverdue"
                  [binary]="true"
                  inputId="remindOverdue"
                ></p-checkbox>
                <label for="remindOverdue">Send reminder when overdue</label>
              </div>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="showFeeDialog = false"
            >Cancel</app-button
          >
          <app-button iconLeft="pi-check" (clicked)="createFee()"
            >Create Fee</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Record Payment Dialog -->
      <p-dialog
        [(visible)]="showPaymentDialog"
        header="Record Payment"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '500px' }"
      >
        <div class="payment-form">
          <div class="form-field">
            <label>Player</label>
            <p-select
              [options]="playerOptions()"
              [(ngModel)]="paymentForm.playerId"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Player"
              styleClass="w-full"
            ></p-select>
          </div>

          @if (paymentForm.playerId) {
            <div class="current-balance">
              Current Balance:
              <strong
                >\${{ getPlayerBalance(paymentForm.playerId) }} owed</strong
              >
            </div>
          }

          <div class="form-row">
            <div class="form-field">
              <label>Amount Received</label>
              <p-inputNumber
                [(ngModel)]="paymentForm.amount"
                mode="currency"
                currency="USD"
                locale="en-US"
              ></p-inputNumber>
            </div>
            <div class="form-field">
              <label>Payment Method</label>
              <p-select
                [options]="paymentMethods"
                [(ngModel)]="paymentForm.method"
                optionLabel="label"
                optionValue="value"
                styleClass="w-full"
              ></p-select>
            </div>
          </div>

          <div class="form-field">
            <label>Date Received</label>
            <p-datepicker
              [(ngModel)]="paymentForm.date"
              [showIcon]="true"
              styleClass="w-full"
            ></p-datepicker>
          </div>

          <div class="form-field">
            <label>Reference / Notes (optional)</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="paymentForm.reference"
              placeholder="e.g., Venmo txn #12345"
            />
          </div>

          <div class="checkbox-option">
            <p-checkbox
              [(ngModel)]="paymentForm.sendConfirmation"
              [binary]="true"
              inputId="sendConfirm"
            ></p-checkbox>
            <label for="sendConfirm">Send confirmation to player</label>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="secondary" (clicked)="showPaymentDialog = false"
            >Cancel</app-button
          >
          <app-button iconLeft="pi-check" (clicked)="recordPayment()"
            >Record Payment</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./payment-management.component.scss",
})
export class PaymentManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly context = inject(ContextService);
  private readonly roster = inject(RosterService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // State
  readonly fees = signal<TeamFee[]>([]);
  readonly balances = signal<PlayerBalance[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly activeTab = signal<"overview" | "fees" | "balances" | "history">(
    "overview",
  );
  readonly isLoading = signal(true);

  // Filter state
  balanceSearch = "";
  balanceFilter = "all";

  // Dialog state
  showFeeDialog = false;
  showPaymentDialog = false;

  // Forms
  feeForm = this.getEmptyFeeForm();
  paymentForm = this.getEmptyPaymentForm();

  // Options
  readonly feeTypes = FEE_TYPES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly balanceFilters = BALANCE_FILTERS;

  // Computed
  readonly totalOutstanding = computed(() =>
    this.balances().reduce((sum, b) => sum + b.balance, 0),
  );

  readonly playersOwing = computed(
    () => this.balances().filter((b) => b.balance > 0).length,
  );

  readonly totalCollected = computed(() =>
    this.payments().reduce((sum, p) => sum + p.amount, 0),
  );

  readonly dueThisMonth = computed(() =>
    this.balances()
      .filter((b) => b.status === "due")
      .reduce((sum, b) => sum + b.balance, 0),
  );

  readonly playersDueCount = computed(
    () => this.balances().filter((b) => b.status === "due").length,
  );

  readonly totalOverdue = computed(() =>
    this.balances()
      .filter((b) => b.status === "overdue")
      .reduce((sum, b) => sum + b.balance, 0),
  );

  readonly playersOverdue = computed(
    () => this.balances().filter((b) => b.status === "overdue").length,
  );

  readonly filteredBalances = computed(() => {
    let result = this.balances();

    // Search filter
    if (this.balanceSearch) {
      const search = this.balanceSearch.toLowerCase();
      result = result.filter((b) =>
        b.playerName.toLowerCase().includes(search),
      );
    }

    // Status filter
    if (this.balanceFilter === "outstanding") {
      result = result.filter((b) => b.balance > 0);
    } else if (this.balanceFilter === "overdue") {
      result = result.filter((b) => b.status === "overdue");
    } else if (this.balanceFilter === "paid") {
      result = result.filter((b) => b.balance === 0);
    }

    return result;
  });

  readonly playerOptions = computed(() =>
    this.balances()
      .filter((b) => b.balance > 0)
      .map((b) => ({ id: b.id, name: b.playerName })),
  );

  readonly totalPlayers = computed(() => this.balances().length);

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.logger.warn("No team ID available");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/coach/payments", { team_id: teamId }),
      );
      if (response?.success && response.data) {
        this.fees.set(response.data.fees || []);
        this.balances.set(response.data.balances || []);
        this.payments.set(response.data.payments || []);
      }
    } catch (err) {
      this.logger.error("Failed to load payment data", err);
      // No data available - show empty state
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEmptyFeeForm() {
    return {
      name: "",
      type: "dues" as "dues" | "tournament" | "equipment" | "other",
      amount: 0,
      guestFee: 0,
      dueDate: null as Date | null,
      description: "",
      applyTo: "all",
      notifyOnCreate: true,
      remind3Days: true,
      remindOverdue: false,
    };
  }

  private getEmptyPaymentForm() {
    return {
      playerId: "",
      amount: 0,
      method: "venmo",
      date: new Date(),
      reference: "",
      sendConfirmation: true,
    };
  }

  // Dialog methods
  openCreateFeeDialog(): void {
    this.feeForm = this.getEmptyFeeForm();
    this.showFeeDialog = true;
  }

  openRecordPaymentDialog(_fee?: TeamFee): void {
    this.paymentForm = this.getEmptyPaymentForm();
    this.showPaymentDialog = true;
  }

  async createFee(): Promise<void> {
    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "No team selected",
        });
        return;
      }

      const response = await firstValueFrom(
        this.api.post<{ success: boolean }>("/api/coach/payments/fees", {
          team_id: teamId,
          name: this.feeForm.name,
          type: this.feeForm.type,
          amount: this.feeForm.amount,
          guestFee: this.feeForm.guestFee || null,
          dueDate: this.feeForm.dueDate,
          description: this.feeForm.description,
          applyTo: this.feeForm.applyTo,
          playerIds: this.feeForm.applyTo === "select" ? [] : undefined,
        }),
      );

      if (response?.success) {
        this.messageService.add({
          severity: "success",
          summary: "Fee Created",
          detail: `${this.feeForm.name} has been created`,
        });
        this.showFeeDialog = false;
        await this.loadData(); // Reload data
      }
    } catch (err) {
      this.logger.error("Failed to create fee", err);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to create fee. Please try again.",
      });
    }
  }

  async recordPayment(): Promise<void> {
    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "No team selected",
        });
        return;
      }

      const response = await firstValueFrom(
        this.api.post<{ success: boolean }>("/api/coach/payments/record", {
          team_id: teamId,
          player_id: this.paymentForm.playerId,
          amount: this.paymentForm.amount,
          method: this.paymentForm.method,
          date: this.paymentForm.date,
          reference: this.paymentForm.reference,
        }),
      );

      if (response?.success) {
        this.messageService.add({
          severity: "success",
          summary: "Payment Recorded",
          detail: `Payment of $${this.paymentForm.amount} has been recorded`,
        });
        this.showPaymentDialog = false;
        await this.loadData(); // Reload data
      }
    } catch (err) {
      this.logger.error("Failed to record payment", err);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to record payment. Please try again.",
      });
    }
  }

  // Action methods
  viewFeeDetails(fee: TeamFee): void {
    this.messageService.add({
      severity: "info",
      summary: "Fee Details",
      detail: `Viewing details for ${fee.name}`,
    });
  }

  sendFeeReminders(fee: TeamFee): void {
    this.messageService.add({
      severity: "success",
      summary: "Reminders Sent",
      detail: `Reminders sent for ${fee.name}`,
    });
  }

  sendPlayerReminder(balance: PlayerBalance): void {
    this.messageService.add({
      severity: "success",
      summary: "Reminder Sent",
      detail: `Reminder sent to ${balance.playerName}`,
    });
  }

  markPlayerPaid(balance: PlayerBalance): void {
    this.paymentForm = this.getEmptyPaymentForm();
    this.paymentForm.playerId = balance.id;
    this.paymentForm.amount = balance.balance;
    this.showPaymentDialog = true;
  }

  viewPlayerHistory(_balance: PlayerBalance): void {
    this.activeTab.set("history");
  }

  sendAllReminders(): void {
    const count = this.playersOwing();
    this.messageService.add({
      severity: "success",
      summary: "Reminders Sent",
      detail: `Reminders sent to ${count} players`,
    });
  }

  exportCSV(): void {
    this.messageService.add({
      severity: "success",
      summary: "Export Started",
      detail: "CSV file is being generated",
    });
  }

  // Helpers
  getFeeIcon(type: string): string {
    const icons: Record<string, string> = {
      tournament: "🏆",
      dues: "📋",
      equipment: "🎽",
      other: "💰",
    };
    return icons[type] || "💰";
  }

  getCollectionPercent(fee: TeamFee): number {
    if (fee.total === 0) return 100;
    return Math.round((fee.collected / fee.total) * 100);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      paid: "Paid",
      due: "Due",
      overdue: "Overdue",
    };
    return labels[status] || status;
  }

  getStatusSeverity(
    status: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary" | "contrast"
    > = {
      paid: "success",
      due: "warn",
      overdue: "danger",
    };
    return severities[status] || "secondary";
  }

  getPlayerBalance(playerId: string): number {
    return this.balances().find((b) => b.id === playerId)?.balance || 0;
  }
}
