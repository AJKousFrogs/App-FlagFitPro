import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Card } from "primeng/card";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { TableModule } from "primeng/table";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { SuperadminService } from "../../core/services/superadmin.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { ToastService } from "../../core/services/toast.service";
import { DialogService } from "../../core/ui/dialog.service";

interface SuperadminUser {
  user_id: string;
  email: string;
  granted_at: string;
  notes: string;
}

@Component({
  selector: "app-superadmin-settings",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    Card,
    TableModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    AppLoadingComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-main-layout>
      <div class="settings-content">
        <app-page-header
          title="Superadmin Settings"
          subtitle="Platform configuration and access control"
        >
          <app-button
            iconLeft="pi-arrow-left"
            variant="outlined"
            routerLink="/superadmin"
            >Back to Dashboard</app-button
          >
        </app-page-header>

        <!-- Your Status Card -->
        <p-card class="status-card">
          <ng-template #header>
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
          <ng-template #header>
            <div class="card-header">
              <h3>
                <i class="pi pi-users"></i>
                Manage Superadmins
              </h3>
              <app-button iconLeft="pi-plus" (clicked)="showAddModal = true"
                >Add Superadmin</app-button
              >
            </div>
          </ng-template>

          @if (isLoading()) {
            <app-loading message="Loading superadmins..." variant="inline" />
          } @else if (superadmins().length === 0) {
            <app-empty-state
              icon="pi-shield"
              heading="No Superadmins"
              description="No additional superadmins configured."
            />
          } @else {
            <p-table [value]="superadmins()" tableStyleClass="superadmin-table">
              <ng-template #header>
                <tr>
                  <th>Email</th>
                  <th>Granted</th>
                  <th>Notes</th>
                  <th class="superadmin-actions-col">Actions</th>
                </tr>
              </ng-template>
              <ng-template #body let-admin>
                <tr>
                  <td>
                    <span class="admin-email">{{ admin.email }}</span>
                  </td>
                  <td>{{ admin.granted_at | date: "mediumDate" }}</td>
                  <td>{{ admin.notes || "-" }}</td>
                  <td>
                    @if (admin.email !== "aljosa@ljubljanafrogs.si") {
                      <app-button
                        variant="text"
                        size="sm"
                        (clicked)="removeSuperadmin(admin.user_id)"
                        >Remove</app-button
                      >
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
          <ng-template #header>
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
        <p-card class="olympic-card">
          <ng-template #header>
            <div class="card-header">
              <h3>
                <span class="olympic-icon"><i class="pi pi-trophy" aria-hidden="true"></i></span>
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
                  [value]="newAdminEmail"
                  (input)="onNewAdminEmailInput($event)"
                  placeholder="Enter user email..."
                />
              </div>
              <div class="form-group">
                <label for="adminNotes">Notes (Optional)</label>
                <textarea
                  id="adminNotes"
                  [value]="newAdminNotes"
                  (input)="onNewAdminNotesInput($event)"
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
              <app-button variant="text" (clicked)="showAddModal = false"
                >Cancel</app-button
              >
              <app-button
                iconLeft="pi-plus"
                [disabled]="!newAdminEmail.trim()"
                (clicked)="addNewSuperadmin()"
                >Add Superadmin</app-button
              >
            </div>
          </div>
        </div>
      }
    </app-main-layout>
  `,
  styleUrl: "./superadmin-settings.component.scss",
})
export class SuperadminSettingsComponent implements OnInit {
  private superadminService = inject(SuperadminService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);

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
    this.toastService.info(
      "To add a superadmin, you need to find their user ID first. This feature requires looking up the user by email in the database.",
      "Superadmin Access",
    );
    this.showAddModal = false;
    this.newAdminEmail = "";
    this.newAdminNotes = "";
  }

  onNewAdminEmailInput(event: Event): void {
    this.newAdminEmail = (event.target as HTMLInputElement | null)?.value ?? "";
  }

  onNewAdminNotesInput(event: Event): void {
    this.newAdminNotes =
      (event.target as HTMLTextAreaElement | null)?.value ?? "";
  }

  async removeSuperadmin(userId: string): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      "Are you sure you want to remove this superadmin?",
      "Remove Superadmin",
    );
    if (!confirmed) return;

    const success = await this.superadminService.removeSuperadmin(userId);
    if (success) {
      this.loadSuperadmins();
    }
  }
}
