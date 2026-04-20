import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { TableModule } from "primeng/table";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { SuperadminService } from "../../core/services/superadmin.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { ConfirmDialogService } from "../../core/services/confirm-dialog.service";

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
    CardShellComponent,
    TableModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    AppLoadingComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    AlertComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./superadmin-settings.component.html",
  styleUrl: "./superadmin-settings.component.scss",
})
export class SuperadminSettingsComponent implements OnInit {
  private superadminService = inject(SuperadminService);
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  // State
  superadmins = signal<SuperadminUser[]>([]);
  isLoading = signal(false);
  loadError = signal<string | null>(null);
  showAddModal = false;
  newAdminEmail = "";
  newAdminNotes = "";

  // Settings (display only for now)
  requireOlympicTrack = true;
  autoApprovePlayers = true;
  federationVerification = false;

  currentUserEmail = signal("");

  ngOnInit(): void {
    this.currentUserEmail.set(this.supabase.currentUser()?.email || "");
    this.loadSuperadmins();
  }

  async loadSuperadmins(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);
    try {
      const admins = await this.superadminService.getSuperadmins();
      this.superadmins.set(
        admins.map((a) => ({
          user_id: a.user_id,
          granted_at: a.granted_at,
          notes: a.notes || "",
          email:
            a.user_id === this.supabase.userId()
              ? this.currentUserEmail()
              : "aljosa@ljubljanafrogs.si",
        })),
      );
    } catch (error) {
      this.logger.error("Error loading superadmins:", error);
      this.loadError.set(
        "Unable to load superadmin access data right now. Please try again.",
      );
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
    this.closeAddModal();
  }

  onNewAdminEmailInput(event: Event): void {
    this.newAdminEmail = (event.target as HTMLInputElement | null)?.value ?? "";
  }

  onNewAdminNotesInput(event: Event): void {
    this.newAdminNotes =
      (event.target as HTMLTextAreaElement | null)?.value ?? "";
  }

  openAddModal(): void {
    this.closeAddModal();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newAdminEmail = "";
    this.newAdminNotes = "";
  }

  onAddModalVisibleChange(visible: boolean): void {
    if (visible) {
      this.showAddModal = true;
      return;
    }
    this.closeAddModal();
  }

  private buildRemoveSuperadminConfirmation() {
    return {
      title: "Remove Superadmin",
      message: "Are you sure you want to remove this superadmin?",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Remove",
      rejectLabel: "Cancel",
      acceptSeverity: "danger" as const,
      defaultFocus: "reject" as const,
    };
  }

  async removeSuperadmin(userId: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm(
      this.buildRemoveSuperadminConfirmation(),
    );
    if (!confirmed) return;

    const success = await this.superadminService.removeSuperadmin(userId);
    if (success) {
      this.loadSuperadmins();
    }
  }
}
