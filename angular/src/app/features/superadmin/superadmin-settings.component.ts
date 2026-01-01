import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { SuperadminService } from "../../core/services/superadmin.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";

interface SuperadminUser {
  user_id: string;
  email: string;
  granted_at: string;
  notes: string;
}

@Component({
  selector: "app-superadmin-settings",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="settings-content">
        <app-page-header
          title="Superadmin Settings"
          subtitle="Platform configuration and access control"
        >
          <a routerLink="/superadmin" class="p-button p-button-outlined">
            <i class="pi pi-arrow-left"></i>
            Back to Dashboard
          </a>
        </app-page-header>

        <!-- Your Status Card -->
        <p-card styleClass="status-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>
                <i class="pi pi-shield"></i>
                Your Superadmin Status
              </h3>
            </div>
          </ng-template>

          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">Email</span>
              <span class="status-value">{{ currentUserEmail() }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">Status</span>
              <span class="status-value status-active">
                <span class="status-dot"></span>
                Active Superadmin
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">Role</span>
              <span class="status-value">Founding Superadmin</span>
            </div>
          </div>

          <div class="info-notice">
            <i class="pi pi-info-circle"></i>
            <p>
              As the founding superadmin, you have full control over the
              platform. Only you can add additional superadmins.
            </p>
          </div>
        </p-card>

        <!-- Manage Superadmins -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>
                <i class="pi pi-users"></i>
                Manage Superadmins
              </h3>
              <p-button
                label="Add Superadmin"
                icon="pi pi-plus"
                (onClick)="showAddModal = true"
              ></p-button>
            </div>
          </ng-template>

          @if (isLoading()) {
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Loading superadmins...</span>
            </div>
          } @else if (superadmins().length === 0) {
            <div class="empty-state">
              <p>No additional superadmins configured.</p>
            </div>
          } @else {
            <p-table
              [value]="superadmins()"
              [tableStyle]="{ 'min-width': '50rem' }"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Email</th>
                  <th>Granted</th>
                  <th>Notes</th>
                  <th style="width: 120px">Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-admin>
                <tr>
                  <td>
                    <span class="admin-email">{{ admin.email }}</span>
                  </td>
                  <td>{{ admin.granted_at | date: "mediumDate" }}</td>
                  <td>{{ admin.notes || "-" }}</td>
                  <td>
                    @if (admin.email !== "aljosa@ljubljanafrogs.si") {
                      <p-button
                        label="Remove"
                        severity="danger"
                        [text]="true"
                        size="small"
                        (onClick)="removeSuperadmin(admin.user_id)"
                      ></p-button>
                    } @else {
                      <span class="founder-badge">Founder</span>
                    }
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }
        </p-card>

        <!-- Platform Settings -->
        <p-card>
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>
                <i class="pi pi-cog"></i>
                Platform Settings
              </h3>
            </div>
          </ng-template>

          <div class="settings-list">
            <div class="setting-item">
              <div class="setting-info">
                <h4>Require Olympic Track</h4>
                <p>
                  Require teams to specify their Olympic preparation track (LA
                  2028 / Brisbane 2032)
                </p>
              </div>
              <label class="toggle">
                <input
                  type="checkbox"
                  [checked]="requireOlympicTrack"
                  disabled
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>Auto-approve Players</h4>
                <p>
                  Automatically approve player role requests (not admin/coach)
                </p>
              </div>
              <label class="toggle">
                <input
                  type="checkbox"
                  [checked]="autoApprovePlayers"
                  disabled
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>Federation Verification</h4>
                <p>
                  Require federation affiliation verification for team approval
                </p>
              </div>
              <label class="toggle">
                <input
                  type="checkbox"
                  [checked]="federationVerification"
                  disabled
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="info-notice info">
            <i class="pi pi-info-circle"></i>
            <p>
              Platform settings are currently managed at the database level.
              Contact the development team for configuration changes.
            </p>
          </div>
        </p-card>

        <!-- Olympic Program -->
        <p-card styleClass="olympic-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <h3>
                <span class="olympic-icon">🏅</span>
                Olympic Program
              </h3>
            </div>
          </ng-template>

          <div class="olympic-tracks">
            <div class="track-card">
              <h4>LA 2028</h4>
              <p class="track-date">July 14 - July 30, 2028</p>
              <p class="track-desc">
                First Olympic Games featuring Flag Football
              </p>
            </div>
            <div class="track-card">
              <h4>Brisbane 2032</h4>
              <p class="track-date">July 23 - August 8, 2032</p>
              <p class="track-desc">Second Olympic Games with Flag Football</p>
            </div>
          </div>

          <p class="mission-text">
            This platform is exclusively for athletes and teams preparing for
            Olympic competition. All team and admin approvals should consider
            the applicant's commitment to Olympic-level preparation.
          </p>
        </p-card>
      </div>

      <!-- Add Superadmin Modal -->
      @if (showAddModal) {
        <div class="modal-overlay" (click)="showAddModal = false">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Add New Superadmin</h3>
              <button class="modal-close" (click)="showAddModal = false">
                <i class="pi pi-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="adminEmail">User Email</label>
                <input
                  type="email"
                  id="adminEmail"
                  [(ngModel)]="newAdminEmail"
                  placeholder="Enter user email..."
                />
              </div>
              <div class="form-group">
                <label for="adminNotes">Notes (Optional)</label>
                <textarea
                  id="adminNotes"
                  [(ngModel)]="newAdminNotes"
                  placeholder="Add notes about this superadmin..."
                  rows="3"
                ></textarea>
              </div>

              <div class="warning-notice">
                <i class="pi pi-exclamation-triangle"></i>
                <p>
                  Superadmins have full control over the platform including
                  approving teams and managing other superadmins. Only grant
                  this access to trusted individuals.
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <p-button
                label="Cancel"
                [text]="true"
                (onClick)="showAddModal = false"
              ></p-button>
              <p-button
                label="Add Superadmin"
                icon="pi pi-plus"
                (onClick)="addNewSuperadmin()"
                [disabled]="!newAdminEmail.trim()"
              ></p-button>
            </div>
          </div>
        </div>
      }
    </app-main-layout>
  `,
  styles: [
    `
      .settings-content {
        padding: var(--space-6);
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      /* Card Header */
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--color-border-primary);
      }

      .card-header h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .card-header h3 i {
        color: var(--ds-primary-green);
      }

      .olympic-icon {
        font-size: 1.5rem;
      }

      /* Status Card */
      :host ::ng-deep .status-card {
        border-left: 4px solid var(--ds-primary-green);
      }

      .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .status-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .status-label {
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-muted);
      }

      .status-value {
        font-size: var(--text-base);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
      }

      .status-active {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--ds-primary-green);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ds-primary-green);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      /* Notices */
      .info-notice,
      .warning-notice {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--radius-md);
        margin-top: var(--space-4);
      }

      .info-notice {
        background: var(--ds-primary-green-ultra-subtle);
        border: 1px solid var(--ds-primary-green-subtle);
      }

      .info-notice i {
        color: var(--ds-primary-green);
        flex-shrink: 0;
      }

      .info-notice.info {
        background: rgba(59, 130, 246, 0.05);
        border-color: rgba(59, 130, 246, 0.2);
      }

      .info-notice.info i {
        color: #3b82f6;
      }

      .warning-notice {
        background: rgba(245, 158, 11, 0.05);
        border: 1px solid rgba(245, 158, 11, 0.2);
      }

      .warning-notice i {
        color: #f59e0b;
        flex-shrink: 0;
      }

      .info-notice p,
      .warning-notice p {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      /* Loading & Empty */
      .loading-state,
      .empty-state {
        text-align: center;
        padding: var(--space-6);
        color: var(--color-text-secondary);
      }

      .loading-state i {
        font-size: 1.5rem;
        margin-bottom: var(--space-2);
      }

      /* Table Styles */
      .admin-email {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .founder-badge {
        display: inline-block;
        padding: var(--space-1) var(--space-2);
        background: var(--ds-primary-green-subtle);
        color: var(--ds-primary-green);
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        font-weight: var(--font-weight-semibold);
      }

      /* Settings List */
      .settings-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
      }

      .setting-info h4 {
        margin: 0 0 var(--space-1);
        font-size: var(--text-base);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .setting-info p {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      /* Olympic Card */
      :host ::ng-deep .olympic-card {
        background: linear-gradient(
          135deg,
          var(--ds-primary-green-ultra-subtle),
          white
        );
        border: 1px solid var(--ds-primary-green-subtle);
      }

      .olympic-tracks {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .track-card {
        padding: var(--space-4);
        background: white;
        border-radius: var(--radius-md);
        border-left: 4px solid var(--ds-primary-green);
      }

      .track-card h4 {
        margin: 0 0 var(--space-2);
        color: var(--ds-primary-green);
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
      }

      .track-date {
        margin: 0 0 var(--space-1);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .track-desc {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .mission-text {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        line-height: 1.6;
      }

      /* Toggle Switch */
      .toggle {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 26px;
      }

      .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--color-border-primary);
        transition: 0.3s;
        border-radius: 26px;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      .toggle input:checked + .toggle-slider {
        background-color: var(--ds-primary-green);
      }

      .toggle input:checked + .toggle-slider:before {
        transform: translateX(22px);
      }

      .toggle input:disabled + .toggle-slider {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-dialog {
        background: white;
        border-radius: var(--radius-lg);
        width: 90%;
        max-width: 450px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--color-border-primary);
      }

      .modal-header h3 {
        margin: 0;
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .modal-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--space-2);
        color: var(--color-text-muted);
        transition: color 0.2s;
      }

      .modal-close:hover {
        color: var(--color-text-primary);
      }

      .modal-body {
        padding: var(--space-4);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
        padding: var(--space-4);
        border-top: 1px solid var(--color-border-primary);
      }

      .form-group {
        margin-bottom: var(--space-4);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--space-2);
        font-size: var(--text-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: var(--space-3);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-md);
        font-family: inherit;
        font-size: var(--text-sm);
      }

      .form-group input:focus,
      .form-group textarea:focus {
        outline: 2px solid var(--ds-primary-green);
        outline-offset: 2px;
        border-color: var(--ds-primary-green);
      }

      .form-group input:focus:not(:focus-visible),
      .form-group textarea:focus:not(:focus-visible) {
        outline: none;
      }

      .form-group textarea {
        resize: vertical;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .settings-content {
          padding: var(--space-4);
        }

        .setting-item {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .card-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }
      }
    `,
  ],
})
export class SuperadminSettingsComponent implements OnInit {
  private superadminService = inject(SuperadminService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  // State
  superadmins = signal<SuperadminUser[]>([]);
  isLoading = signal(false);
  showAddModal = false;
  newAdminEmail = "";
  newAdminNotes = "";

  // Settings (display only for now)
  requireOlympicTrack = true;
  autoApprovePlayers = true;
  federationVerification = false;

  currentUserEmail = signal("");

  ngOnInit(): void {
    this.currentUserEmail.set(this.authService.currentUser()?.email || "");
    this.loadSuperadmins();
  }

  async loadSuperadmins(): Promise<void> {
    this.isLoading.set(true);
    try {
      const admins = await this.superadminService.getSuperadmins();
      this.superadmins.set(
        admins.map((a) => ({
          user_id: a.user_id,
          granted_at: a.granted_at,
          notes: a.notes || "",
          email:
            a.user_id === this.authService.currentUser()?.id
              ? this.currentUserEmail()
              : "aljosa@ljubljanafrogs.si",
        })),
      );
    } catch (error) {
      this.logger.error("Error loading superadmins:", error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addNewSuperadmin(): Promise<void> {
    if (!this.newAdminEmail.trim()) return;

    // Note: In a real implementation, you'd look up the user by email first
    alert(
      "To add a superadmin, you need to find their user ID first. This feature requires looking up the user by email in the database.",
    );
    this.showAddModal = false;
    this.newAdminEmail = "";
    this.newAdminNotes = "";
  }

  async removeSuperadmin(userId: string): Promise<void> {
    if (!confirm("Are you sure you want to remove this superadmin?")) return;

    const success = await this.superadminService.removeSuperadmin(userId);
    if (success) {
      this.loadSuperadmins();
    }
  }
}
