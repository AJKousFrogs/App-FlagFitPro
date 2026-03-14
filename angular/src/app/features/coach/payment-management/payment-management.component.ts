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
import { Router } from "@angular/router";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { toSignal } from "@angular/core/rxjs-interop";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { InputNumber } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  paymentStatusSeverityMap,
} from "../../../shared/utils/status.utils";
import { Textarea } from "primeng/textarea";
import { firstValueFrom, startWith } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
import { RosterService } from "../../roster/roster.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../shared/components/ui-components";

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

interface FeeForm {
  name: string;
  type: "dues" | "tournament" | "equipment" | "other";
  amount: number;
  guestFee: number;
  dueDate: Date | null;
  description: string;
  applyTo: "all" | "select";
  notifyOnCreate: boolean;
  remind3Days: boolean;
  remindOverdue: boolean;
}

interface PaymentForm {
  playerId: string;
  amount: number;
  method: string;
  date: Date;
  reference: string;
  sendConfirmation: boolean;
}

type BalanceFilter = "all" | "outstanding" | "overdue" | "paid";
type FeeType = "dues" | "tournament" | "equipment" | "other";

type FeeFormGroup = FormGroup<{
  name: FormControl<string>;
  type: FormControl<FeeType>;
  amount: FormControl<number>;
  guestFee: FormControl<number>;
  dueDate: FormControl<Date | null>;
  description: FormControl<string>;
  applyTo: FormControl<"all" | "select">;
  notifyOnCreate: FormControl<boolean>;
  remind3Days: FormControl<boolean>;
  remindOverdue: FormControl<boolean>;
}>;

type PaymentFormGroup = FormGroup<{
  playerId: FormControl<string>;
  amount: FormControl<number>;
  method: FormControl<string>;
  date: FormControl<Date>;
  reference: FormControl<string>;
  sendConfirmation: FormControl<boolean>;
}>;

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardShellComponent,
    Checkbox,
    DatePicker,
    InputNumber,
    InputText,
    ProgressBar,
    RadioButton,
    Select,
    TableModule,
    StatusTagComponent,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    ButtonComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <app-main-layout>
      <div class="payment-management-page ui-page-shell ui-page-shell--content-lg ui-page-stack">
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

        @if (isLoading()) {
          <app-loading message="Loading payment data..." />
        } @else if (loadError(); as errorMessage) {
          <app-page-error-state
            title="Unable to load payment data"
            [message]="errorMessage"
            (retry)="retryLoadData()"
          />
        } @else {
          @switch (activeTab()) {
            @case ("overview") {
            <!-- Financial Overview -->
            <div class="financial-overview">
              <div class="stat-card balance">
                <span class="stat-icon">💰</span>
                <div class="stat-content">
                  <span class="stat-block__value"
                    >\${{ totalOutstanding() }}</span
                  >
                  <span class="stat-block__label">Outstanding Balance</span>
                  <span class="stat-sub">{{ playersOwing() }} players owe</span>
                </div>
              </div>
              <div class="stat-card collected">
                <span class="stat-icon">✅</span>
                <div class="stat-content">
                  <span class="stat-block__value"
                    >\${{ totalCollected() }}</span
                  >
                  <span class="stat-block__label">Collected This Month</span>
                  <span class="stat-sub">Season total</span>
                </div>
              </div>
              <div class="stat-card due">
                <span class="stat-icon">📅</span>
                <div class="stat-content">
                  <span class="stat-block__value">\${{ dueThisMonth() }}</span>
                  <span class="stat-block__label">Due This Month</span>
                  <span class="stat-sub">{{ playersDueCount() }} players</span>
                </div>
              </div>
              <div class="stat-card overdue">
                <span class="stat-icon">⚠️</span>
                <div class="stat-content">
                  <span class="stat-block__value">\${{ totalOverdue() }}</span>
                  <span class="stat-block__label">Overdue</span>
                  <span class="stat-sub">{{ playersOverdue() }} players</span>
                </div>
              </div>
            </div>

            <!-- Active Fees Preview -->
            <app-card-shell class="payment-shell-card" title="Active Fees">
              <app-button
                header-actions
                variant="text"
                (clicked)="activeTab.set('fees')"
                >View All</app-button
              >
              <div class="fees-preview">
                @for (fee of fees().slice(0, 2); track fee.id) {
                  <div class="fee-preview-card" [class.overdue]="fee.isOverdue">
                    <div class="fee-header">
                      <span class="fee-icon">{{ getFeeIcon(fee.type) }}</span>
                      <h4>{{ fee.name }}</h4>
                      @if (fee.isOverdue) {
                        <app-status-tag
                          value="OVERDUE"
                          severity="danger"
                          size="sm"
                        />
                      }
                    </div>
                    <div class="fee-progress">
                      <p-progressBar
                        [value]="getCollectionPercent(fee)"
                        [showValue]="false"
                        class="fees-preview-progress"
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
            </app-card-shell>
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
                      class="fees-list-progress"
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
            <app-card-shell class="payment-shell-card" title="Player Balances">
              <div header-actions class="balance-filters">
                <span class="p-input-icon-left">
                  <i class="pi pi-search"></i>
                  <input
                    type="text"
                    pInputText
                    [formControl]="balanceSearchControl"
                    placeholder="Search players..."
                  />
                </span>
                <p-select
                  [options]="balanceFilters"
                  [formControl]="balanceFilterControl"
                  optionLabel="label"
                  optionValue="value"
                ></p-select>
              </div>

              <p-table
                [value]="filteredBalances()"
                class="p-datatable-sm"
                [scrollable]="true"
              >
                <ng-template #header>
                  <tr>
                    <th>Player</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Last Payment</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template #body let-balance>
                  <tr>
                    <td>{{ balance.playerName }}</td>
                    <td [class.owes]="balance.balance > 0">
                      \${{ balance.balance }}
                    </td>
                    <td>
                      <app-status-tag
                        [value]="getStatusLabel(balance.status)"
                        [severity]="getStatusSeverity(balance.status)"
                        size="sm"
                      />
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
            </app-card-shell>
          }

            @case ("history") {
            <!-- Payment History -->
            <app-card-shell class="payment-shell-card" title="Payment History">
              <p-table
                [value]="payments()"
                class="p-datatable-sm"
                [scrollable]="true"
              >
                <ng-template #header>
                  <tr>
                    <th>Date</th>
                    <th>Player</th>
                    <th>Fee</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                  </tr>
                </ng-template>
                <ng-template #body let-payment>
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
            </app-card-shell>
            }
          }
        }
      </div>

      <!-- Create Fee Dialog -->
      <app-dialog
        [(visible)]="showFeeDialog"
        [modal]="true"
        styleClass="payment-fee-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Create fee"
      >
        <app-dialog-header
          icon="wallet"
          title="Create Fee"
          subtitle="Create dues, tournament fees, or equipment charges for your roster."
          (close)="showFeeDialog = false"
        />
        <form class="fee-form" [formGroup]="feeFormGroup">
          <div class="form-field">
            <label>Fee Name</label>
            <input
              type="text"
              pInputText
              formControlName="name"
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
                    formControlName="type"
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
                formControlName="amount"
                mode="currency"
                currency="USD"
                locale="en-US"
              ></p-inputNumber>
            </div>
            <div class="form-field">
              <label>Guest Fee (optional)</label>
              <p-inputNumber
                formControlName="guestFee"
                mode="currency"
                currency="USD"
                locale="en-US"
              ></p-inputNumber>
            </div>
          </div>

          <div class="form-field">
            <label>Due Date</label>
            <p-datepicker
              formControlName="dueDate"
              [showIcon]="true"
              class="w-full"
            ></p-datepicker>
          </div>

          <div class="form-field">
            <label>Description / Breakdown</label>
            <textarea
              pTextarea
              formControlName="description"
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
                  formControlName="applyTo"
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
                  formControlName="applyTo"
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
                  formControlName="notifyOnCreate"
                  [binary]="true"
                  variant="filled"
                  inputId="notifyCreate"
                ></p-checkbox>
                <label for="notifyCreate">Send notification when created</label>
              </div>
              <div class="checkbox-option">
                <p-checkbox
                  formControlName="remind3Days"
                  [binary]="true"
                  variant="filled"
                  inputId="remind3"
                ></p-checkbox>
                <label for="remind3">Send reminder 3 days before due</label>
              </div>
              <div class="checkbox-option">
                <p-checkbox
                  formControlName="remindOverdue"
                  [binary]="true"
                  variant="filled"
                  inputId="remindOverdue"
                ></p-checkbox>
                <label for="remindOverdue">Send reminder when overdue</label>
              </div>
            </div>
          </div>
        </form>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Create Fee"
          primaryIcon="check"
          (cancel)="showFeeDialog = false"
          (primary)="createFee()"
        />
      </app-dialog>

      <!-- Record Payment Dialog -->
      <app-dialog
        [(visible)]="showPaymentDialog"
        [modal]="true"
        styleClass="payment-record-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Record payment"
      >
        <app-dialog-header
          icon="credit-card"
          title="Record Payment"
          subtitle="Log incoming payments and keep player balances current."
          (close)="showPaymentDialog = false"
        />
        <form class="payment-form" [formGroup]="paymentFormGroup">
          <div class="form-field">
            <label>Player</label>
            <p-select
              [options]="playerOptions()"
              formControlName="playerId"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Player"
              class="w-full"
            ></p-select>
          </div>

          @if (selectedPaymentPlayerId()) {
            <div class="current-balance">
              Current Balance:
              <strong
                >\${{ getPlayerBalance(selectedPaymentPlayerId()) }} owed</strong
              >
            </div>
          }

          <div class="form-row">
            <div class="form-field">
              <label>Amount Received</label>
              <p-inputNumber
                formControlName="amount"
                mode="currency"
                currency="USD"
                locale="en-US"
              ></p-inputNumber>
            </div>
            <div class="form-field">
              <label>Payment Method</label>
              <p-select
                [options]="paymentMethods"
                formControlName="method"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              ></p-select>
            </div>
          </div>

          <div class="form-field">
            <label>Date Received</label>
            <p-datepicker
              formControlName="date"
              [showIcon]="true"
              class="w-full"
            ></p-datepicker>
          </div>

          <div class="form-field">
            <label>Reference / Notes (optional)</label>
            <input
              type="text"
              pInputText
              formControlName="reference"
              placeholder="e.g., Venmo txn #12345"
            />
          </div>

          <div class="checkbox-option">
            <p-checkbox
              formControlName="sendConfirmation"
              [binary]="true"
              variant="filled"
              inputId="sendConfirm"
            ></p-checkbox>
            <label for="sendConfirm">Send confirmation to player</label>
          </div>
        </form>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Record Payment"
          primaryIcon="check"
          (cancel)="showPaymentDialog = false"
          (primary)="recordPayment()"
        />
      </app-dialog>

      <app-dialog
        [(visible)]="showFeeDetailsDialog"
        [modal]="true"
        styleClass="payment-fee-details-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Fee details"
      >
        <app-dialog-header
          icon="wallet"
          [title]="selectedFee()?.name || 'Fee Details'"
          subtitle="Review collection progress, fee timing, and outstanding balances."
          (close)="showFeeDetailsDialog = false"
        />
        @if (selectedFee(); as fee) {
          <div class="fee-details-dialog-content">
            <div class="fee-details-grid">
              <div class="fee-detail-card">
                <span class="fee-detail-label">Type</span>
                <span class="fee-detail-value">{{ getFeeTypeLabel(fee.type) }}</span>
              </div>
              <div class="fee-detail-card">
                <span class="fee-detail-label">Due date</span>
                <span class="fee-detail-value">{{ fee.dueDate }}</span>
              </div>
              <div class="fee-detail-card">
                <span class="fee-detail-label">Base fee</span>
                <span class="fee-detail-value">\${{ fee.amount }}/player</span>
              </div>
              <div class="fee-detail-card">
                <span class="fee-detail-label">Guest fee</span>
                <span class="fee-detail-value">{{
                  fee.guestFee ? "$" + fee.guestFee + "/guest" : "Not set"
                }}</span>
              </div>
              <div class="fee-detail-card fee-detail-card--wide">
                <span class="fee-detail-label">Collection progress</span>
                <div class="fee-detail-progress">
                  <p-progressBar
                    [value]="getCollectionPercent(fee)"
                    [showValue]="false"
                    class="fees-list-progress"
                  ></p-progressBar>
                  <span class="fee-detail-value"
                    >\${{ fee.collected }} / \${{ fee.total }} ({{
                      getCollectionPercent(fee)
                    }}%)</span
                  >
                </div>
                <span class="fee-detail-subtle"
                  >{{ fee.paidCount }} paid full, {{ fee.partialCount }} partial,
                  {{ fee.unpaidCount }} unpaid</span
                >
              </div>
              <div class="fee-detail-card fee-detail-card--wide">
                <span class="fee-detail-label">Description</span>
                <span class="fee-detail-value">{{
                  fee.description?.trim() || "No additional description provided."
                }}</span>
              </div>
            </div>

            <div class="fee-outstanding-summary">
              <h4>Outstanding balances</h4>
              @if (fee.outstanding.length > 0) {
                <div class="fee-outstanding-list">
                  @for (item of fee.outstanding; track item.playerId) {
                    <div class="fee-outstanding-row">
                      <span>{{ item.playerName }}</span>
                      <span>\${{ item.amount }}</span>
                      <span class="fee-outstanding-note">{{
                        item.note || "No note"
                      }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p>All assigned players are currently settled on this fee.</p>
              }
            </div>
          </div>
        }

        <app-dialog-footer
          dialogFooter
          cancelLabel="Close"
          primaryLabel="Record Payment"
          primaryIcon="check"
          (cancel)="showFeeDetailsDialog = false"
          (primary)="openPaymentDialogFromDetails()"
        />
      </app-dialog>
    </app-main-layout>
  `,
  styleUrl: "./payment-management.component.scss",
})
export class PaymentManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly roster = inject(RosterService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // State
  readonly fees = signal<TeamFee[]>([]);
  readonly balances = signal<PlayerBalance[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly activeTab = signal<"overview" | "fees" | "balances" | "history">(
    "overview",
  );
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  // Filter controls
  readonly balanceSearchControl = new FormControl("", { nonNullable: true });
  readonly balanceFilterControl = new FormControl<BalanceFilter>("all", {
    nonNullable: true,
  });
  readonly balanceSearch = toSignal(
    this.balanceSearchControl.valueChanges.pipe(
      startWith(this.balanceSearchControl.value),
    ),
    { initialValue: this.balanceSearchControl.value },
  );
  readonly balanceFilter = toSignal(
    this.balanceFilterControl.valueChanges.pipe(
      startWith(this.balanceFilterControl.value),
    ),
    { initialValue: this.balanceFilterControl.value },
  );

  // Dialog state
  showFeeDialog = false;
  showPaymentDialog = false;
  showFeeDetailsDialog = false;
  readonly selectedFee = signal<TeamFee | null>(null);

  // Forms
  readonly feeFormGroup: FeeFormGroup = this.createFeeForm();
  readonly paymentFormGroup: PaymentFormGroup = this.createPaymentForm();

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
    const searchValue = this.balanceSearch();
    const filterValue = this.balanceFilter();

    // Search filter
    if (searchValue) {
      const search = searchValue.toLowerCase();
      result = result.filter((b) =>
        b.playerName.toLowerCase().includes(search),
      );
    }

    // Status filter
    if (filterValue === "outstanding") {
      result = result.filter((b) => b.balance > 0);
    } else if (filterValue === "overdue") {
      result = result.filter((b) => b.status === "overdue");
    } else if (filterValue === "paid") {
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
  readonly selectedPaymentPlayerId = computed(
    () => this.paymentFormGroup.controls.playerId.value,
  );

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.logger.warn("No team ID available");
        return;
      }

      const response: ApiResponse<{
        fees?: TeamFee[];
        balances?: PlayerBalance[];
        payments?: Payment[];
      }> = await firstValueFrom(
        this.api.get(API_ENDPOINTS.coach.payments, { team_id: teamId }),
      );
      if (response?.success && response.data) {
        this.fees.set(response.data.fees || []);
        this.balances.set(response.data.balances || []);
        this.payments.set(response.data.payments || []);
      }
    } catch (err) {
      this.logger.error("Failed to load payment data", err);
      this.fees.set([]);
      this.balances.set([]);
      this.payments.set([]);
      this.loadError.set(
        "We couldn't load payment data. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadData(): void {
    void this.loadData();
  }

  private getEmptyFeeForm(): FeeForm {
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

  private getEmptyPaymentForm(): PaymentForm {
    return {
      playerId: "",
      amount: 0,
      method: "venmo",
      date: new Date(),
      reference: "",
      sendConfirmation: true,
    };
  }

  private createFeeForm(): FeeFormGroup {
    const defaults = this.getEmptyFeeForm();
    return new FormGroup({
      name: new FormControl(defaults.name, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      type: new FormControl(defaults.type, { nonNullable: true }),
      amount: new FormControl(defaults.amount, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      guestFee: new FormControl(defaults.guestFee, { nonNullable: true }),
      dueDate: new FormControl(defaults.dueDate),
      description: new FormControl(defaults.description, { nonNullable: true }),
      applyTo: new FormControl(defaults.applyTo, { nonNullable: true }),
      notifyOnCreate: new FormControl(defaults.notifyOnCreate, {
        nonNullable: true,
      }),
      remind3Days: new FormControl(defaults.remind3Days, { nonNullable: true }),
      remindOverdue: new FormControl(defaults.remindOverdue, {
        nonNullable: true,
      }),
    });
  }

  private createPaymentForm(): PaymentFormGroup {
    const defaults = this.getEmptyPaymentForm();
    return new FormGroup({
      playerId: new FormControl(defaults.playerId, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      amount: new FormControl(defaults.amount, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
      }),
      method: new FormControl(defaults.method, { nonNullable: true }),
      date: new FormControl(defaults.date, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      reference: new FormControl(defaults.reference, { nonNullable: true }),
      sendConfirmation: new FormControl(defaults.sendConfirmation, {
        nonNullable: true,
      }),
    });
  }

  // Dialog methods
  openCreateFeeDialog(): void {
    this.feeFormGroup.reset(this.getEmptyFeeForm());
    this.showFeeDialog = true;
  }

  openRecordPaymentDialog(_fee?: TeamFee): void {
    this.paymentFormGroup.reset(this.getEmptyPaymentForm());
    this.showPaymentDialog = true;
  }

  async createFee(): Promise<void> {
    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.toastService.error("No team selected");
        return;
      }
      if (this.feeFormGroup.invalid) {
        this.feeFormGroup.markAllAsTouched();
        this.toastService.error("Please complete required fee fields.");
        return;
      }
      const feeForm = this.feeFormGroup.getRawValue();

      const response = await firstValueFrom(
        this.api.post<{ success: boolean }>(API_ENDPOINTS.coach.paymentFees, {
          team_id: teamId,
          name: feeForm.name,
          type: feeForm.type,
          amount: feeForm.amount,
          guestFee: feeForm.guestFee || null,
          dueDate: feeForm.dueDate,
          description: feeForm.description,
          applyTo: feeForm.applyTo,
          playerIds: feeForm.applyTo === "select" ? [] : undefined,
        }),
      );

      if (response?.success) {
        this.toastService.success(
          `${feeForm.name} has been created`,
          "Fee Created",
        );
        this.showFeeDialog = false;
        await this.loadData(); // Reload data
      }
    } catch (err) {
      this.logger.error("Failed to create fee", err);
      this.toastService.error("Failed to create fee. Please try again.");
    }
  }

  async recordPayment(): Promise<void> {
    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.toastService.error("No team selected");
        return;
      }
      if (this.paymentFormGroup.invalid) {
        this.paymentFormGroup.markAllAsTouched();
        this.toastService.error("Please complete required payment fields.");
        return;
      }
      const paymentForm = this.paymentFormGroup.getRawValue();

      const response = await firstValueFrom(
        this.api.post<{ success: boolean }>(API_ENDPOINTS.coach.paymentRecord, {
          team_id: teamId,
          player_id: paymentForm.playerId,
          amount: paymentForm.amount,
          method: paymentForm.method,
          date: paymentForm.date,
          reference: paymentForm.reference,
        }),
      );

      if (response?.success) {
        this.toastService.success(
          `Payment of $${paymentForm.amount} has been recorded`,
          "Payment Recorded",
        );
        this.showPaymentDialog = false;
        await this.loadData(); // Reload data
      }
    } catch (err) {
      this.logger.error("Failed to record payment", err);
      this.toastService.error("Failed to record payment. Please try again.");
    }
  }

  // Action methods
  viewFeeDetails(fee: TeamFee): void {
    this.selectedFee.set(fee);
    this.showFeeDetailsDialog = true;
  }

  sendFeeReminders(fee: TeamFee): void {
    const draft = `Reminder: ${fee.name} is due on ${fee.dueDate}. Please review your payment status and settle any outstanding balance.`;
    void this.openReminderComposer(draft, "Fee Reminder Draft");
  }

  sendPlayerReminder(balance: PlayerBalance): void {
    const draft = `Hi ${balance.playerName}, this is a reminder that your current outstanding balance is $${balance.balance}. Please check the latest team fee details.`;
    void this.openReminderComposer(draft, "Player Reminder Draft");
  }

  markPlayerPaid(balance: PlayerBalance): void {
    this.paymentFormGroup.reset({
      ...this.getEmptyPaymentForm(),
      playerId: balance.id,
      amount: balance.balance,
    });
    this.showPaymentDialog = true;
  }

  viewPlayerHistory(_balance: PlayerBalance): void {
    this.activeTab.set("history");
  }

  sendAllReminders(): void {
    const count = this.playersOwing();
    if (count === 0) {
      this.toastService.info("No outstanding balances need reminders.");
      return;
    }

    const draft = `Team reminder: ${count} players still have outstanding balances. Please review payment details and update your status as soon as possible.`;
    void this.openReminderComposer(draft, "Team Reminder Draft");
  }

  exportCSV(): void {
    const rows = [
      ["Player", "Fee", "Amount", "Method", "Date", "Reference"],
      ...this.payments().map((payment) => [
        payment.playerName,
        payment.feeName,
        payment.amount.toString(),
        payment.method,
        payment.date,
        payment.reference || "",
      ]),
    ];
    this.downloadCsv("payment-history.csv", rows);
    this.toastService.success("Payment CSV downloaded.", "Export Ready");
  }

  private async openReminderComposer(
    draft: string,
    toastTitle: string,
  ): Promise<void> {
    await this.router.navigate(["/team-chat"], {
      queryParams: {
        source: "payments",
        draft,
      },
    });
    this.toastService.success(
      "Reminder draft opened in team chat.",
      toastTitle,
    );
  }

  private downloadCsv(filename: string, rows: string[][]): void {
    const content = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
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
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    return getMappedStatusSeverity(
      status,
      paymentStatusSeverityMap,
      "secondary",
    );
  }

  getPlayerBalance(playerId: string): number {
    return this.balances().find((b) => b.id === playerId)?.balance || 0;
  }

  getFeeTypeLabel(type: TeamFee["type"]): string {
    return this.feeTypes.find((option) => option.value === type)?.label || type;
  }

  openPaymentDialogFromDetails(): void {
    this.showFeeDetailsDialog = false;
    this.openRecordPaymentDialog(this.selectedFee() || undefined);
  }
}
