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
import { ButtonComponent } from "../../shared/components/button/button.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";
import { TABLE_COLUMN_WIDTHS } from "../../core/utils/design-tokens.util";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    AlertComponent,
    CardShellComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    MainLayoutComponent,
    EmptyStateComponent,
    PageHeaderComponent,

    ButtonComponent,
    StatusTagComponent,
  ],
  templateUrl: "./payments.component.html",
  styleUrl: "./payments.component.scss",
})
export class PaymentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  // Design system tokens
  protected readonly tableColumnWidths = TABLE_COLUMN_WIDTHS;
  private readonly paymentHistoryPageSize = 10;

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
  readonly currentHistoryPage = signal(1);

  // Dialog state
  showInstructions = false;

  // Computed values
  readonly outstandingFees = computed(() =>
    this.fees().filter((f) => f.status !== "paid"),
  );
  readonly paymentHistoryPageCount = computed(() =>
    Math.max(
      1,
      Math.ceil(this.paymentHistory().length / this.paymentHistoryPageSize),
    ),
  );
  readonly paginatedPaymentHistory = computed(() => {
    const start = (this.currentHistoryPage() - 1) * this.paymentHistoryPageSize;
    return this.paymentHistory().slice(
      start,
      start + this.paymentHistoryPageSize,
    );
  });
  readonly paymentHistoryPageRangeLabel = computed(() => {
    const total = this.paymentHistory().length;
    if (total === 0) {
      return "No payment history";
    }

    const start = (this.currentHistoryPage() - 1) * this.paymentHistoryPageSize + 1;
    const end = Math.min(
      total,
      start + this.paymentHistoryPageSize - 1,
    );

    return `Showing ${start}-${end} of ${total}`;
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.api.get<{
          summary?: AccountSummary;
          fees?: Fee[];
          history?: PaymentRecord[];
          instructions?: PaymentInstructions;
        }>(API_ENDPOINTS.payments),
      );
      const payload = extractApiPayload<{
        summary?: AccountSummary;
        fees?: Fee[];
        history?: PaymentRecord[];
        instructions?: PaymentInstructions;
      }>(response);
      if (payload) {
        if (payload.summary) {
          this.accountSummary.set(payload.summary);
        }
        if (payload.fees) {
          this.fees.set(payload.fees);
        }
        if (payload.history) {
          this.paymentHistory.set(payload.history);
          this.currentHistoryPage.set(1);
        }
        if (payload.instructions) {
          this.paymentInstructions.set(payload.instructions);
        }
      } else {
        throw new Error("Payment payload missing");
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
      this.currentHistoryPage.set(1);
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

  goToPreviousHistoryPage(): void {
    this.currentHistoryPage.update((page) => Math.max(1, page - 1));
  }

  goToNextHistoryPage(): void {
    this.currentHistoryPage.update((page) =>
      Math.min(this.paymentHistoryPageCount(), page + 1),
    );
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
