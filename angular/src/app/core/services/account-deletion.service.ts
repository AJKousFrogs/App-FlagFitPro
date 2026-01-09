import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { ToastService } from "./toast.service";
import { Router } from "@angular/router";
import { TOAST } from "../constants/toast-messages.constants";

/**
 * Account Deletion Service
 *
 * Implements GDPR Article 17 - Right to Erasure ("Right to be Forgotten")
 *
 * Deletion Pipeline:
 * 1. User requests deletion → Immediate soft-delete
 * 2. Sessions revoked → User logged out
 * 3. 30-day grace period → User can cancel
 * 4. Hard delete → All PII permanently removed
 * 5. Emergency medical records retained for 7 years (legal requirement)
 *
 * Privacy Policy Reference: Sections 6, 7.3
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

export interface DeletionStatus {
  requestId: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  requestedAt: string;
  scheduledHardDeleteAt: string;
  daysUntilDeletion: number;
  canCancel: boolean;
}

export interface DeletionRequest {
  reason?: string;
  confirmText: string;
}

@Injectable({
  providedIn: "root",
})
export class AccountDeletionService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Reactive state
  private _deletionStatus = signal<DeletionStatus | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly deletionStatus = this._deletionStatus.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly hasPendingDeletion = computed(() => {
    const status = this._deletionStatus();
    return status?.status === "pending" || status?.status === "processing";
  });

  readonly daysRemaining = computed(() => {
    const status = this._deletionStatus();
    return status?.daysUntilDeletion ?? null;
  });

  // ============================================================================
  // CHECK DELETION STATUS
  // ============================================================================

  /**
   * Check if user has a pending deletion request
   */
  async checkDeletionStatus(): Promise<DeletionStatus | null> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      return null;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabase.client.rpc(
        "get_deletion_status",
        { p_user_id: userId },
      );

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const status: DeletionStatus = {
          requestId: data[0].request_id,
          status: data[0].status,
          requestedAt: data[0].requested_at,
          scheduledHardDeleteAt: data[0].scheduled_hard_delete_at,
          daysUntilDeletion: data[0].days_until_deletion,
          canCancel: data[0].can_cancel,
        };
        this._deletionStatus.set(status);
        return status;
      }

      this._deletionStatus.set(null);
      return null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to check deletion status";
      this._error.set(message);
      this.logger.error("Error checking deletion status:", err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  // ============================================================================
  // INITIATE DELETION
  // ============================================================================

  /**
   * Request account deletion
   * This initiates the soft-delete and starts the 30-day countdown
   */
  async requestDeletion(request: DeletionRequest): Promise<boolean> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
      return false;
    }

    // Verify confirmation text
    if (request.confirmText !== "DELETE") {
      this.toastService.error(TOAST.ERROR.TYPE_DELETE_TO_CONFIRM);
      return false;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      // Call the database function to initiate deletion
      const { data: requestId, error } = await this.supabase.client.rpc(
        "initiate_account_deletion",
        {
          p_user_id: userId,
          p_reason: request.reason || null,
        },
      );

      if (error) {
        throw error;
      }

      // Sign out the user
      await this.supabase.signOut();

      this.toastService.success(TOAST.SUCCESS.ACCOUNT_DELETION_REQUESTED);

      this.logger.info("Account deletion initiated", { requestId });

      // Redirect to login
      this.router.navigate(["/login"]);

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : TOAST.ERROR.DELETION_REQUEST_FAILED;
      this._error.set(message);
      this.toastService.error(message);
      this.logger.error("Error requesting deletion:", err);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  // ============================================================================
  // CANCEL DELETION
  // ============================================================================

  /**
   * Cancel a pending deletion request
   * Only possible within the 30-day grace period
   */
  async cancelDeletion(): Promise<boolean> {
    const userId = this.authService.getUser()?.id;
    const status = this._deletionStatus();

    if (!userId || !status?.requestId) {
      this.toastService.error(TOAST.ERROR.NO_PENDING_DELETION);
      return false;
    }

    if (!status.canCancel) {
      this.toastService.error(TOAST.ERROR.DELETION_CANNOT_CANCEL);
      return false;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const { data: success, error } = await this.supabase.client.rpc(
        "cancel_account_deletion",
        {
          p_request_id: status.requestId,
          p_user_id: userId,
        },
      );

      if (error) {
        throw error;
      }

      if (success) {
        this._deletionStatus.set(null);
        this.toastService.success(
          "Account deletion cancelled. Your account has been reactivated.",
        );
        this.logger.info("Account deletion cancelled", {
          requestId: status.requestId,
        });
        return true;
      } else {
        throw new Error("Failed to cancel deletion");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel deletion";
      this._error.set(message);
      this.toastService.error(message);
      this.logger.error("Error cancelling deletion:", err);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  /**
   * Get privacy audit log for the current user
   */
  async getAuditLog(limit = 50): Promise<
    Array<{
      id: string;
      action: string;
      affectedTable: string | null;
      affectedData: Record<string, unknown> | null;
      createdAt: string;
    }>
  > {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      return [];
    }

    try {
      const { data, error } = await this.supabase.client
        .from("privacy_audit_log")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []).map((row) => ({
        id: row.id,
        action: row.action,
        affectedTable: row.affected_table,
        affectedData: row.affected_data,
        createdAt: row.created_at,
      }));
    } catch (err) {
      this.logger.error("Error fetching audit log:", err);
      return [];
    }
  }

  // ============================================================================
  // EMERGENCY MEDICAL RECORDS
  // ============================================================================

  /**
   * Create an emergency medical record
   * These are retained for 7 years per legal requirements
   */
  async createEmergencyRecord(
    eventType: string,
    medicalData: Record<string, unknown>,
    locationData?: Record<string, unknown>,
  ): Promise<string | null> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
      return null;
    }

    try {
      const { data: recordId, error } = await this.supabase.client.rpc(
        "create_emergency_medical_record",
        {
          p_user_id: userId,
          p_event_type: eventType,
          p_medical_data: medicalData,
          p_location_data: locationData || null,
        },
      );

      if (error) {
        throw error;
      }

      this.logger.info("Emergency medical record created", {
        recordId,
        eventType,
      });
      return recordId;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create emergency record";
      this.toastService.error(message);
      this.logger.error("Error creating emergency record:", err);
      return null;
    }
  }

  /**
   * Get emergency medical records for the current user
   */
  async getEmergencyRecords(): Promise<
    Array<{
      id: string;
      eventType: string;
      eventDate: string;
      medicalData: Record<string, unknown>;
      locationData: Record<string, unknown> | null;
      retentionExpiresAt: string;
    }>
  > {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      return [];
    }

    try {
      const { data, error } = await this.supabase.client
        .from("emergency_medical_records")
        .select("*")
        .eq("user_id", userId)
        .order("event_date", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map((row) => ({
        id: row.id,
        eventType: row.event_type,
        eventDate: row.event_date,
        medicalData: row.medical_data,
        locationData: row.location_data,
        retentionExpiresAt: row.retention_expires_at,
      }));
    } catch (err) {
      this.logger.error("Error fetching emergency records:", err);
      return [];
    }
  }
}
