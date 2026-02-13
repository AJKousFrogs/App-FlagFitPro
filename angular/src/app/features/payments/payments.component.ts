/**
 * My Payments Component (Player View)
 *
 * ⚠️ IMPORTANT: This is for TRACKING ONLY - No payment processing!
 *
 * FlagFit Pro does NOT process payments (no Stripe, PayPal, credit cards).
 * Players pay coaches directly via cash, Venmo, Zelle, CashApp, etc.
 *
 * This component allows:
 * - Track what players owe (fees, equipment, tournament registration)
 * - View payment status and history
 * - See payment instructions from coaches
 * - Download receipts (if coach provides)
 * - Export payment history
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { TableModule } from "primeng/table";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { ApiResponse } from "../../core/models/common.models";
import { TABLE_COLUMN_WIDTHS } from "../../core/utils/design-tokens.util";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface AccountSummary {
  totalOwed: number;
  totalPaid: number;
  nextPaymentDue?: string;
  nextPaymentAmount?: number;
}

interface Fee {
  id: string;
  name: string;
  description: string;
  amount: number;
  dueDate: string;
  status: FeeStatus;
  breakdown?: FeeBreakdownItem[];
}

interface FeeBreakdownItem {
  label: string;
  amount: number;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  feeId: string;
  feeName: string;
  receiptUrl?: string;
}

interface PaymentInstructions {
  methods: PaymentMethodInfo[];
  notes: string;
}

interface PaymentMethodInfo {
  method: PaymentMethod;
  label: string;
  instructions: string;
  details?: string;
}

type FeeStatus = "paid" | "pending" | "overdue" | "partial";
type PaymentMethod = "check" | "cash" | "online" | "transfer";

// ===== Constants =====
const FEE_STATUS_CONFIG: Record<
  FeeStatus,
  { label: string; severity: "success" | "warning" | "danger" | "info" }
> = {
  paid: { label: "Paid", severity: "success" },
  pending: { label: "Pending", severity: "warning" },
  overdue: { label: "Overdue", severity: "danger" },
  partial: { label: "Partial", severity: "info" },
};

const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; icon: string }
> = {
  check: { label: "Check", icon: "pi-file" },
  cash: { label: "Cash", icon: "pi-dollar" },
  online: { label: "Online", icon: "pi-globe" },
  transfer: { label: "Bank Transfer", icon: "pi-building" },
};

@Component({
  selector: "app-payments",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    Card,
    Dialog,
    
    TableModule,

    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
    StatusTagComponent,
  ],
  template: `
    <app-main-layout>
<div class="payments-page">
        <app-page-header
          title="My Payments"
          subtitle="View fees and payment history"
          icon="pi-wallet"
        ></app-page-header>

        <!-- Tracking Only Disclaimer -->
        <div class="payment-disclaimer">
          <i class="pi pi-info-circle"></i>
          <p>
            <strong>Payment Tracking Only:</strong> FlagFit Pro does not process
            payments. Pay your coach directly (cash, Venmo, Zelle, etc.) and
            they'll mark it as received.
          </p>
        </div>

        <!-- Account Summary -->
        <div class="summary-grid">
          <p-card class="summary-card balance">
            <div class="summary-content">
              <i class="pi pi-dollar summary-icon"></i>
              <div class="summary-details">
                <span class="summary-label">Balance Due</span>
                <span class="summary-value">{{
                  accountSummary().totalOwed | currency
                }}</span>
              </div>
            </div>
          </p-card>

          <p-card class="summary-card paid">
            <div class="summary-content">
              <i class="pi pi-check-circle summary-icon"></i>
              <div class="summary-details">
                <span class="summary-label">Total Paid</span>
                <span class="summary-value">{{
                  accountSummary().totalPaid | currency
                }}</span>
              </div>
            </div>
          </p-card>

          @if (accountSummary().nextPaymentDue) {
            <p-card class="summary-card next">
              <div class="summary-content">
                <i class="pi pi-calendar summary-icon"></i>
                <div class="summary-details">
                  <span class="summary-label">Next Due</span>
                  <span class="summary-value">{{
                    accountSummary().nextPaymentDue | date: "MMM d"
                  }}</span>
                  <span class="summary-amount">{{
                    accountSummary().nextPaymentAmount | currency
                  }}</span>
                </div>
              </div>
            </p-card>
          }
        </div>

        <!-- Outstanding Fees -->
        <p-card class="fees-card">
          <ng-template #header>
            <div class="card-header">
              <h3><i class="pi pi-list"></i> Outstanding Fees</h3>
              <app-button
                variant="secondary"
                size="sm"
                iconLeft="pi-info-circle"
                (clicked)="showInstructions = true"
                >Payment Instructions</app-button
              >
            </div>
          </ng-template>

          @if (outstandingFees().length > 0) {
            <div class="fees-list">
              @for (fee of outstandingFees(); track fee.id) {
                <div
                  class="fee-item"
                  [class.overdue]="fee.status === 'overdue'"
                >
                  <div class="fee-main">
                    <div class="fee-info">
                      <h4>{{ fee.name }}</h4>
                      <p>{{ fee.description }}</p>
                      <span
                        class="due-date"
                        [class.overdue]="isOverdue(fee.dueDate)"
                      >
                        Due: {{ fee.dueDate | date: "MMM d, y" }}
                      </span>
                    </div>
                    <div class="fee-amount">
                      <span class="amount">{{ fee.amount | currency }}</span>
                      <app-status-tag
                        [value]="getFeeStatusConfig(fee.status).label"
                        [severity]="getFeeStatusConfig(fee.status).severity"
                        size="sm"
                      />
                    </div>
                  </div>

                  @if (fee.breakdown && fee.breakdown.length > 0) {
                    <div class="fee-breakdown">
                      <button
                        class="breakdown-toggle"
                        (click)="toggleBreakdown(fee.id)"
                      >
                        <i
                          class="pi"
                          [ngClass]="
                            expandedFee() === fee.id
                              ? 'pi-chevron-up'
                              : 'pi-chevron-down'
                          "
                        ></i>
                        View breakdown
                      </button>

                      @if (expandedFee() === fee.id) {
                        <div class="breakdown-list">
                          @for (item of fee.breakdown; track item.label) {
                            <div class="breakdown-item">
                              <span>{{ item.label }}</span>
                              <span>{{ item.amount | currency }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="empty-fees">
              <i class="pi pi-check-circle"></i>
              <p>No outstanding fees. You're all caught up!</p>
            </div>
          }
        </p-card>

        <!-- Payment History -->
        <p-card class="history-card">
          <ng-template #header>
            <div class="card-header">
              <h3><i class="pi pi-history"></i> Payment History</h3>
            </div>
          </ng-template>

          @if (paymentHistory().length > 0) {
            <p-table
              [value]="paymentHistory()"
              [paginator]="paymentHistory().length > 10"
              [rows]="10"
              class="p-datatable-sm"
            >
              <ng-template #header>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Method</th>
                  <th class="amount-col">Amount</th>
                  <th class="history-actions-col"></th>
                </tr>
              </ng-template>
              <ng-template #body let-payment>
                <tr>
                  <td>{{ payment.date | date: "MMM d, y" }}</td>
                  <td>{{ payment.feeName }}</td>
                  <td>
                    <span class="payment-method">
                      <i
                        [class]="
                          'pi ' + getPaymentMethodConfig(payment.method).icon
                        "
                      ></i>
                      {{ getPaymentMethodConfig(payment.method).label }}
                    </span>
                  </td>
                  <td class="amount-cell">
                    <strong>{{ payment.amount | currency }}</strong>
                  </td>
                  <td>
                    @if (payment.receiptUrl) {
                      <app-button
                        variant="text"
                        size="sm"
                        iconLeft="pi-download"
                        (clicked)="downloadReceipt(payment)"
                        >Download receipt</app-button
                      >
                    }
                  </td>
                </tr>
              </ng-template>
              <ng-template #emptymessage>
                <tr>
                  <td colspan="5" class="empty-table">
                    No payment history found
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <div class="empty-history">
              <i class="pi pi-inbox"></i>
              <p>No payment history yet</p>
            </div>
          }
        </p-card>
      </div>

      <!-- Payment Instructions Dialog -->
      <p-dialog
        [(visible)]="showInstructions"
        header="Payment Instructions"
        [modal]="true"
        [closable]="true"
        class="payments-instructions-dialog"
      >
        <div class="instructions-content">
          @for (method of paymentInstructions().methods; track method.method) {
            <div class="method-card">
              <div class="method-header">
                <i
                  [class]="'pi ' + getPaymentMethodConfig(method.method).icon"
                ></i>
                <h4>{{ method.label }}</h4>
              </div>
              <p class="method-instructions">{{ method.instructions }}</p>
              @if (method.details) {
                <div class="method-details">
                  <pre>{{ method.details }}</pre>
                </div>
              }
            </div>
          }

          @if (paymentInstructions().notes) {
            <div class="instructions-notes">
              <i class="pi pi-info-circle"></i>
              <p>{{ paymentInstructions().notes }}</p>
            </div>
          }
        </div>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./payments.component.scss",
})
export class PaymentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  // Design system tokens
  protected readonly tableColumnWidths = TABLE_COLUMN_WIDTHS;

  // State
  readonly accountSummary = signal<AccountSummary>({
    totalOwed: 0,
    totalPaid: 0,
  });
  readonly fees = signal<Fee[]>([]);
  readonly paymentHistory = signal<PaymentRecord[]>([]);
  readonly paymentInstructions = signal<PaymentInstructions>({
    methods: [],
    notes: "",
  });
  readonly expandedFee = signal<string | null>(null);
  readonly isLoading = signal(true);

  // Dialog state
  showInstructions = false;

  // Computed values
  readonly outstandingFees = computed(() =>
    this.fees().filter((f) => f.status !== "paid"),
  );

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response: ApiResponse<{
        summary?: AccountSummary;
        fees?: Fee[];
        history?: PaymentRecord[];
        instructions?: PaymentInstructions;
      }> = await firstValueFrom(this.api.get("/api/payments"));
      if (response?.success && response.data) {
        if (response.data.summary) {
          this.accountSummary.set(response.data.summary);
        }
        if (response.data.fees) {
          this.fees.set(response.data.fees);
        }
        if (response.data.history) {
          this.paymentHistory.set(response.data.history);
        }
        if (response.data.instructions) {
          this.paymentInstructions.set(response.data.instructions);
        }
      }
    } catch (err) {
      this.logger.error("Failed to load payment data", err);
      // Set empty state - no fees or payment history
      this.accountSummary.set({
        totalOwed: 0,
        totalPaid: 0,
        nextPaymentDue: undefined,
        nextPaymentAmount: 0,
      });
      this.fees.set([]);
      this.paymentHistory.set([]);
      this.paymentInstructions.set({
        methods: [],
        notes: "",
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleBreakdown(feeId: string): void {
    if (this.expandedFee() === feeId) {
      this.expandedFee.set(null);
    } else {
      this.expandedFee.set(feeId);
    }
  }

  downloadReceipt(payment: PaymentRecord): void {
    if (payment.receiptUrl) {
      window.open(payment.receiptUrl, "_blank");
    }
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  getFeeStatusConfig(status: FeeStatus): (typeof FEE_STATUS_CONFIG)[FeeStatus] {
    return FEE_STATUS_CONFIG[status];
  }

  getPaymentMethodConfig(
    method: PaymentMethod,
  ): (typeof PAYMENT_METHOD_CONFIG)[PaymentMethod] {
    return PAYMENT_METHOD_CONFIG[method];
  }
}
