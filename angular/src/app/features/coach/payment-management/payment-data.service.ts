/**
 * Payment Data Service
 *
 * Data access layer for team payment management: fees, player balances,
 * and payment history. Extracted from PaymentManagementComponent to
 * separate data concerns from UI/dialog logic.
 */
import { computed, inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import {
  extractApiPayload,
  isSuccessfulApiResponse,
} from "../../../core/utils/api-response-mapper";
import { RosterService } from "../../roster/roster.service";

// ===== Interfaces =====

export interface TeamFee {
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

export interface OutstandingBalance {
  playerId: string;
  playerName: string;
  amount: number;
  note?: string;
}

export interface PlayerBalance {
  id: string;
  playerName: string;
  balance: number;
  status: "paid" | "due" | "overdue";
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  daysOverdue?: number;
}

export interface Payment {
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

export interface FeeForm {
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

export interface PaymentForm {
  playerId: string;
  amount: number;
  method: string;
  date: Date;
  reference: string;
  sendConfirmation: boolean;
}

export type BalanceFilter = "all" | "outstanding" | "overdue" | "paid";
export type FeeType = "dues" | "tournament" | "equipment" | "other";

// ===== Service =====

@Injectable({ providedIn: "root" })
export class PaymentDataService {
  private readonly api = inject(ApiService);
  private readonly roster = inject(RosterService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly fees = signal<TeamFee[]>([]);
  readonly balances = signal<PlayerBalance[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly selectedFee = signal<TeamFee | null>(null);

  // Computed — financial summaries
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

  readonly playerOptions = computed(() =>
    this.balances()
      .filter((b) => b.balance > 0)
      .map((b) => ({ id: b.id, name: b.playerName })),
  );

  readonly totalPlayers = computed(() => this.balances().length);

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.logger.warn("No team ID available");
        return;
      }

      const response = await firstValueFrom(
        this.api.get<{
          fees?: TeamFee[];
          balances?: PlayerBalance[];
          payments?: Payment[];
        }>(API_ENDPOINTS.coach.payments, { team_id: teamId }),
      );
      const payload = extractApiPayload<{
        fees?: TeamFee[];
        balances?: PlayerBalance[];
        payments?: Payment[];
      }>(response);
      this.fees.set(payload?.fees || []);
      this.balances.set(payload?.balances || []);
      this.payments.set(payload?.payments || []);
    } catch (err) {
      this.logger.error("Failed to load payment data", err);
      this.fees.set([]);
      this.balances.set([]);
      this.payments.set([]);
      this.loadError.set("We couldn't load payment data. Please try again.");
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Returns true if the fee was created successfully. */
  async createFee(feeForm: FeeForm): Promise<boolean> {
    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.toastService.error("No team selected");
        return false;
      }

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

      if (isSuccessfulApiResponse(response)) {
        this.toastService.success(
          `${feeForm.name} has been created`,
          "Fee Created",
        );
        await this.loadData();
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error("Failed to create fee", err);
      this.toastService.error("Failed to create fee. Please try again.");
      return false;
    }
  }

  /** Returns true if the payment was recorded successfully. */
  async recordPayment(paymentForm: PaymentForm): Promise<boolean> {
    try {
      const teamId = this.roster.currentTeamId();
      if (!teamId) {
        this.toastService.error("No team selected");
        return false;
      }

      const response = await firstValueFrom(
        this.api.post<{ success: boolean }>(
          API_ENDPOINTS.coach.paymentRecord,
          {
            team_id: teamId,
            player_id: paymentForm.playerId,
            amount: paymentForm.amount,
            method: paymentForm.method,
            date: paymentForm.date,
            reference: paymentForm.reference,
          },
        ),
      );

      if (isSuccessfulApiResponse(response)) {
        this.toastService.success(
          `Payment of $${paymentForm.amount} has been recorded`,
          "Payment Recorded",
        );
        await this.loadData();
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error("Failed to record payment", err);
      this.toastService.error("Failed to record payment. Please try again.");
      return false;
    }
  }
}
