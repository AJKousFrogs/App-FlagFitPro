import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

interface CredentialRow {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string | null;
  credential_type: string;
  credential_name: string;
  issuing_body: string | null;
  credential_number: string | null;
  document_url: string | null;
  status: "pending" | "verified" | "rejected" | "expired";
  rejected_reason: string | null;
  created_at: string;
}

type StatusFilter = "pending" | "verified" | "rejected" | "all";

@Component({
  selector: "app-credential-review",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="review-container">
      <div class="header">
        <h1>Credential Review</h1>
        <p class="subtitle">
          Approve or reject self-reported staff credentials
        </p>
      </div>

      <div class="filter-tabs">
        @for (status of statuses; track status) {
          <button
            class="tab"
            [class.active]="statusFilter() === status"
            (click)="statusFilter.set(status)"
          >
            {{ formatStatus(status) }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading credentials...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else if (filteredCredentials().length === 0) {
        <div class="empty-state">
          <i-lucide name="inbox"></i-lucide>
          <p>No {{ statusFilter() === "all" ? "" : statusFilter() }} credentials</p>
        </div>
      } @else {
        <div class="credential-list">
          @for (cred of filteredCredentials(); track cred.id) {
            <div class="credential-card" [attr.data-status]="cred.status">
              <div class="card-header">
                <div>
                  <h3>{{ cred.user_name }}</h3>
                  <p class="role">{{ cred.user_role || "Unknown role" }}</p>
                </div>
                <span class="status-badge" [attr.data-status]="cred.status">
                  {{ cred.status }}
                </span>
              </div>

              <div class="card-body">
                <div class="info-row">
                  <span class="label">Credential</span>
                  <span class="value">{{ cred.credential_name }}</span>
                </div>
                @if (cred.issuing_body) {
                  <div class="info-row">
                    <span class="label">Issued by</span>
                    <span class="value">{{ cred.issuing_body }}</span>
                  </div>
                }
                @if (cred.credential_number) {
                  <div class="info-row">
                    <span class="label">Number</span>
                    <span class="value">{{ cred.credential_number }}</span>
                  </div>
                }
                <div class="info-row">
                  <span class="label">Submitted</span>
                  <span class="value">{{ cred.created_at | date: "MMM dd, yyyy" }}</span>
                </div>
                @if (cred.rejected_reason) {
                  <div class="info-row">
                    <span class="label">Rejected reason</span>
                    <span class="value">{{ cred.rejected_reason }}</span>
                  </div>
                }
              </div>

              @if (cred.document_url) {
                <button
                  class="btn-link"
                  type="button"
                  (click)="viewDocument(cred.id)"
                >
                  <i-lucide name="file-text" class="icon"></i-lucide>
                  View document
                </button>
              }

              @if (cred.status === "pending") {
                <div class="card-actions">
                  @if (rejectingId() === cred.id) {
                    <input
                      type="text"
                      class="reject-reason-input"
                      placeholder="Reason for rejection"
                      [(ngModel)]="rejectReason"
                    />
                    <button
                      class="btn-danger"
                      type="button"
                      [disabled]="actionPending()"
                      (click)="confirmReject(cred.id)"
                    >
                      Confirm reject
                    </button>
                    <button
                      class="btn-ghost"
                      type="button"
                      (click)="rejectingId.set(null)"
                    >
                      Cancel
                    </button>
                  } @else {
                    <button
                      class="btn-approve"
                      type="button"
                      [disabled]="actionPending()"
                      (click)="approve(cred.id)"
                    >
                      <i-lucide name="check" class="icon"></i-lucide>
                      Approve
                    </button>
                    <button
                      class="btn-reject"
                      type="button"
                      [disabled]="actionPending()"
                      (click)="startReject(cred.id)"
                    >
                      <i-lucide name="x" class="icon"></i-lucide>
                      Reject
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .review-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
      }

      .header {
        margin-bottom: 25px;
      }

      .header h1 {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 8px 0;
      }

      .subtitle {
        font-size: 14px;
        color: #666;
        margin: 0;
      }

      .filter-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 25px;
        border-bottom: 1px solid #e0e0e0;
      }

      .tab {
        padding: 10px 16px;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 500;
        color: #666;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }

      .tab.active {
        color: #667eea;
        border-bottom-color: #667eea;
      }

      .loading-state,
      .error-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #666;
      }

      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #e0e0e0;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .credential-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .credential-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 20px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .card-header h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }

      .role {
        font-size: 13px;
        color: #666;
        margin: 0;
        text-transform: capitalize;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-badge[data-status="pending"] {
        background: #fef0e0;
        color: #d97706;
      }

      .status-badge[data-status="verified"] {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .status-badge[data-status="rejected"] {
        background: #fee;
        color: #c33;
      }

      .card-body {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
      }

      .info-row .label {
        color: #999;
        font-weight: 500;
      }

      .info-row .value {
        color: #333;
        font-weight: 600;
        text-align: right;
      }

      .btn-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        color: #667eea;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
        margin-bottom: 12px;
      }

      .btn-link .icon {
        width: 16px;
        height: 16px;
      }

      .card-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .btn-approve,
      .btn-reject,
      .btn-danger,
      .btn-ghost {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        border: none;
        cursor: pointer;
      }

      .btn-approve {
        background: #2e7d32;
        color: white;
      }

      .btn-reject,
      .btn-danger {
        background: #fee;
        color: #c33;
      }

      .btn-ghost {
        background: #f5f5f5;
        color: #333;
      }

      .btn-approve:disabled,
      .btn-reject:disabled,
      .btn-danger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .icon {
        width: 14px;
        height: 14px;
      }

      .reject-reason-input {
        flex: 1;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 13px;
      }
    `,
  ],
})
export class CredentialReviewComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);

  loading = signal(false);
  error = signal<string | null>(null);
  credentials = signal<CredentialRow[]>([]);
  statusFilter = signal<StatusFilter>("pending");
  statuses: StatusFilter[] = ["pending", "verified", "rejected", "all"];
  actionPending = signal(false);
  rejectingId = signal<string | null>(null);
  rejectReason = "";

  filteredCredentials = computed(() => {
    const all = this.credentials();
    if (this.statusFilter() === "all") return all;
    return all.filter((c) => c.status === this.statusFilter());
  });

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<{ credentials: CredentialRow[] }>("/api/admin/credentials").subscribe({
      next: (response: any) => {
        const payload = response?.data || response;
        this.credentials.set(payload?.credentials || []);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.logger.error("Failed to load credentials", err);
        this.error.set("Failed to load credentials");
        this.loading.set(false);
      },
    });
  }

  formatStatus(status: StatusFilter): string {
    const map: Record<StatusFilter, string> = {
      pending: "Pending",
      verified: "Verified",
      rejected: "Rejected",
      all: "All",
    };
    return map[status];
  }

  viewDocument(credentialId: string) {
    this.api
      .get<{ signedUrl: string | null }>("/api/admin/credentials", {
        documentUrlFor: credentialId,
      })
      .subscribe({
        next: (response: any) => {
          const url = (response?.data || response)?.signedUrl;
          if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
          } else {
            this.error.set("No document available for this credential");
          }
        },
        error: (err: any) => {
          this.logger.error("Failed to get document URL", err);
          this.error.set("Failed to open document");
        },
      });
  }

  approve(id: string) {
    this.actionPending.set(true);
    this.api.post("/api/admin/credentials", { id, action: "verify" }).subscribe({
      next: () => {
        this.logger.info("Credential verified", { id });
        this.actionPending.set(false);
        this.load();
      },
      error: (err: any) => {
        this.logger.error("Failed to verify credential", err);
        this.error.set("Failed to verify credential");
        this.actionPending.set(false);
      },
    });
  }

  startReject(id: string) {
    this.rejectReason = "";
    this.rejectingId.set(id);
  }

  confirmReject(id: string) {
    this.actionPending.set(true);
    this.api
      .post("/api/admin/credentials", {
        id,
        action: "reject",
        reason: this.rejectReason.trim(),
      })
      .subscribe({
        next: () => {
          this.logger.info("Credential rejected", { id });
          this.actionPending.set(false);
          this.rejectingId.set(null);
          this.load();
        },
        error: (err: any) => {
          this.logger.error("Failed to reject credential", err);
          this.error.set("Failed to reject credential");
          this.actionPending.set(false);
        },
      });
  }
}
