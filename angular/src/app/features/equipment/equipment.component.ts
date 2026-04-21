import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";
import { BadgeComponent } from "../../shared/components/badge/badge.component";
import { InputNumber, type InputNumberInputEvent } from "primeng/inputnumber";
import { FormInputComponent } from "../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../shared/components/select/select.component";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";

import { TOAST } from "../../core/constants/toast-messages.constants";
import {
  EquipmentAssignment,
  EquipmentItem,
  EquipmentService,
  EquipmentSummary,
} from "../../core/services/equipment.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { TeamStatisticsService } from "../../core/services/team-statistics.service";
import { ToastService } from "../../core/services/toast.service";
import { DialogService } from "../../core/ui/dialog.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../shared/components/ui-components";

type ItemType =
  | "jersey"
  | "shorts"
  | "flags"
  | "belt"
  | "cleats"
  | "ball"
  | "cones"
  | "other";
type Condition = "new" | "good" | "fair" | "poor" | "needs_replacement";
interface EquipmentFormItem {
  name: string;
  item_type: ItemType;
  condition: Condition;
  size: string;
  color: string;
  quantity_total: number;
  description: string;
}
interface CheckoutData { player_id: string; quantity: number; notes: string }
interface ReturnData { condition: Condition; notes: string }

@Component({
  selector: "app-equipment",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TableModule,
    StatusTagComponent,
    FormInputComponent,
    InputNumber,
    SelectComponent,
    BadgeComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
    ButtonComponent,
    CardShellComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./equipment.component.html",
  styleUrl: "./equipment.component.scss",
})
export class EquipmentComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private teamStatsService = inject(TeamStatisticsService);
  private supabase = inject(SupabaseService);
  private teamMembershipService = inject(TeamMembershipService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  private dialogService = inject(DialogService);

  // State
  equipment = signal<EquipmentItem[]>([]);
  assignments = signal<EquipmentAssignment[]>([]);
  summary = signal<EquipmentSummary | null>(null);
  teamPlayers = signal<{ id: string; name: string }[]>([]);

  // UI State
  selectedType: ItemType | null = null;
  showAddDialog = false;
  showCheckoutDialog = false;
  showReturnDialog = false;
  editingItem: EquipmentItem | null = null;
  checkoutItem = signal<EquipmentItem | null>(null);
  returnAssignment = signal<EquipmentAssignment | null>(null);

  // Form data
  newItem: EquipmentFormItem = this.getEmptyItem();
  checkoutData: CheckoutData = { player_id: "", quantity: 1, notes: "" };
  returnData: ReturnData = { condition: "good", notes: "" };

  // Options
  typeOptions = this.equipmentService.EQUIPMENT_TYPES.map((t) => ({
    label: t.label,
    value: t.value,
  }));

  conditionOptions = this.equipmentService.CONDITIONS.map((c) => ({
    label: c.label,
    value: c.value,
  }));

  // Computed
  filteredEquipment = computed(() => {
    let items = this.equipment();
    if (this.selectedType) {
      items = items.filter((i) => i.item_type === this.selectedType);
    }
    return items;
  });

  activeAssignments = computed(() => {
    return this.assignments().filter((a) => !a.returned_at);
  });

  ngOnInit(): void {
    this.loadEquipment();
    this.loadAssignments();
    this.loadSummary();
    this.loadTeamPlayers();
  }

  loadTeamPlayers(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId) {
      this.teamPlayers.set([]);
      return;
    }

    this.teamStatsService
      .getTeamPlayersStats(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.teamPlayers.set(
            data.members.map((m) => ({ id: m.playerId, name: m.playerName })),
          );
        },
        error: (err) => this.logger.error("Failed to load team players", err),
      });
  }

  /**
   * Check if user is a coach - uses TeamMembershipService as single source of truth
   */
  isCoach(): boolean {
    return this.teamMembershipService.canManageRoster();
  }

  getEmptyItem(): EquipmentFormItem {
    return {
      name: "",
      item_type: "jersey" as ItemType,
      condition: "new" as Condition,
      size: "",
      color: "",
      quantity_total: 1,
      description: "",
    };
  }

  loadEquipment(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId) return;

    this.equipmentService
      .getTeamEquipment(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.equipment.set(items),
        error: () => this.toastService.error(TOAST.ERROR.LOAD_FAILED),
      });
  }

  loadAssignments(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId) return;

    this.equipmentService
      .getTeamAssignments(teamId, { activeOnly: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assignments) => this.assignments.set(assignments),
        error: () => this.logger.error("Failed to load assignments"),
      });
  }

  loadSummary(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId) return;

    this.equipmentService
      .getEquipmentSummary(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: () => this.logger.error("Failed to load summary"),
      });
  }

  filterEquipment(): void {
    // Computed handles filtering
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }

  onSelectedTypeChange(value: ItemType | null): void {
    this.selectedType = value;
    this.filterEquipment();
  }

  updateNewItemName(value: string | null | undefined): void {
    this.newItem = { ...this.newItem, name: value ?? "" };
  }

  onNewItemNameInput(event: Event): void {
    this.updateNewItemName(this.readInputValue(event));
  }

  updateNewItemType(value: ItemType | null | undefined): void {
    this.newItem = { ...this.newItem, item_type: value ?? "jersey" };
  }

  updateNewItemCondition(value: Condition | null | undefined): void {
    this.newItem = { ...this.newItem, condition: value ?? "good" };
  }

  updateNewItemSize(value: string | null | undefined): void {
    this.newItem = { ...this.newItem, size: value ?? "" };
  }

  onNewItemSizeInput(event: Event): void {
    this.updateNewItemSize(this.readInputValue(event));
  }

  updateNewItemColor(value: string | null | undefined): void {
    this.newItem = { ...this.newItem, color: value ?? "" };
  }

  onNewItemColorInput(event: Event): void {
    this.updateNewItemColor(this.readInputValue(event));
  }

  onNewItemQuantityInput(event: InputNumberInputEvent): void {
    this.updateNewItemQuantity(event.value ?? null);
  }

  updateNewItemQuantity(value: number | null | undefined): void {
    this.newItem = { ...this.newItem, quantity_total: value ?? 1 };
  }

  updateNewItemDescription(value: string | null | undefined): void {
    this.newItem = { ...this.newItem, description: value ?? "" };
  }

  onNewItemDescriptionInput(event: Event): void {
    this.updateNewItemDescription(this.readInputValue(event));
  }

  updateCheckoutPlayerId(value: string | null | undefined): void {
    this.checkoutData = { ...this.checkoutData, player_id: value ?? "" };
  }

  onCheckoutQuantityInput(event: InputNumberInputEvent): void {
    this.updateCheckoutQuantity(event.value ?? null);
  }

  updateCheckoutQuantity(value: number | null | undefined): void {
    this.checkoutData = { ...this.checkoutData, quantity: value ?? 1 };
  }

  updateCheckoutNotes(value: string | null | undefined): void {
    this.checkoutData = { ...this.checkoutData, notes: value ?? "" };
  }

  onCheckoutNotesInput(event: Event): void {
    this.updateCheckoutNotes(this.readInputValue(event));
  }

  updateReturnCondition(value: Condition | null | undefined): void {
    this.returnData = { ...this.returnData, condition: value ?? "good" };
  }

  updateReturnNotes(value: string | null | undefined): void {
    this.returnData = { ...this.returnData, notes: value ?? "" };
  }

  onReturnNotesInput(event: Event): void {
    this.updateReturnNotes(this.readInputValue(event));
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      jersey: "pi pi-user",
      shorts: "pi pi-user",
      flags: "pi pi-flag",
      belt: "pi pi-circle",
      cleats: "pi pi-compass",
      ball: "pi pi-circle-fill",
      cones: "pi pi-exclamation-triangle",
      other: "pi pi-box",
    };
    return icons[type] || "pi pi-box";
  }

  getTypeLabel(type: string): string {
    const found = this.equipmentService.EQUIPMENT_TYPES.find(
      (t) => t.value === type,
    );
    return found?.label || type;
  }

  getConditionLabel(condition: string): string {
    const found = this.equipmentService.CONDITIONS.find(
      (c) => c.value === condition,
    );
    return found?.label || condition;
  }

  getConditionSeverity(
    condition: string,
  ): "success" | "warning" | "danger" | "info" {
    const severities: Record<
      string,
      "success" | "warning" | "danger" | "info"
    > = {
      new: "success",
      good: "success",
      fair: "warning",
      poor: "danger",
      needs_replacement: "danger",
    };
    return severities[condition] || "info";
  }

  private refreshEquipmentOverview(includeAssignments = false): void {
    this.loadEquipment();
    this.loadSummary();
    if (includeAssignments) {
      this.loadAssignments();
    }
  }

  private handleEquipmentMutation(
    operation$: Observable<unknown>,
    options: {
      successMessage: string;
      errorMessage: string;
      closeDialog?: () => void;
      includeAssignments?: boolean;
    },
  ): void {
    operation$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(options.successMessage);
          options.closeDialog?.();
          this.refreshEquipmentOverview(options.includeAssignments ?? false);
        },
        error: () => this.toastService.error(options.errorMessage),
      });
  }

  closeAddDialog(): void {
    this.showAddDialog = false;
    this.editingItem = null;
    this.newItem = this.getEmptyItem();
  }

  closeCheckoutDialog(): void {
    this.showCheckoutDialog = false;
    this.checkoutItem.set(null);
    this.checkoutData = { player_id: "", quantity: 1, notes: "" };
  }

  closeReturnDialog(): void {
    this.showReturnDialog = false;
    this.returnAssignment.set(null);
    this.returnData = { condition: "good", notes: "" };
  }

  openAddDialog(): void {
    this.closeAddDialog();
    this.showAddDialog = true;
  }

  openEditDialog(item: EquipmentItem): void {
    this.closeAddDialog();
    this.editingItem = item;
    this.newItem = {
      name: item.name,
      item_type: item.item_type,
      condition: item.condition,
      size: item.size || "",
      color: item.color || "",
      quantity_total: item.quantity_total,
      description: item.description || "",
    };
    this.showAddDialog = true;
  }

  canSaveItem(): boolean {
    return !!(
      this.newItem.name &&
      this.newItem.item_type &&
      this.newItem.quantity_total > 0
    );
  }

  saveItem(): void {
    const teamId = this.teamMembershipService.teamId();
    if (!teamId || !this.canSaveItem()) return;

    if (this.editingItem) {
      this.handleEquipmentMutation(
        this.equipmentService.updateEquipmentItem(this.editingItem.id, this.newItem),
        {
          successMessage: TOAST.SUCCESS.UPDATED,
          errorMessage: TOAST.ERROR.UPDATE_FAILED,
          closeDialog: () => this.closeAddDialog(),
        },
      );
      return;
    }

    this.handleEquipmentMutation(
      this.equipmentService.createEquipmentItem({ ...this.newItem, team_id: teamId }),
      {
        successMessage: TOAST.SUCCESS.CREATED,
        errorMessage: TOAST.ERROR.CREATE_FAILED,
        closeDialog: () => this.closeAddDialog(),
      },
    );
  }

  async deleteItem(item: EquipmentItem): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      `Delete ${item.name}?`,
      "Delete Item",
    );
    if (!confirmed) return;

    this.handleEquipmentMutation(this.equipmentService.deleteEquipmentItem(item.id), {
      successMessage: TOAST.SUCCESS.DELETED,
      errorMessage: TOAST.ERROR.DELETE_FAILED,
    });
  }

  openCheckoutDialog(item: EquipmentItem): void {
    this.closeCheckoutDialog();
    this.checkoutItem.set(item);
    this.showCheckoutDialog = true;
  }

  checkout(): void {
    const item = this.checkoutItem();
    if (!item || !this.checkoutData.player_id) return;

    this.handleEquipmentMutation(
      this.equipmentService.checkoutEquipment({
        equipment_id: item.id,
        player_id: this.checkoutData.player_id,
        quantity: this.checkoutData.quantity,
        notes: this.checkoutData.notes || undefined,
      }),
      {
        successMessage: TOAST.SUCCESS.UPDATED,
        errorMessage: TOAST.ERROR.UPDATE_FAILED,
        closeDialog: () => this.closeCheckoutDialog(),
        includeAssignments: true,
      },
    );
  }

  openReturnDialog(assignment: EquipmentAssignment): void {
    this.closeReturnDialog();
    this.returnAssignment.set(assignment);
    this.showReturnDialog = true;
  }

  processReturn(): void {
    const assignment = this.returnAssignment();
    if (!assignment) return;

    this.handleEquipmentMutation(
      this.equipmentService.returnEquipment({
        assignment_id: assignment.id,
        condition_at_return: this.returnData.condition,
        notes: this.returnData.notes || undefined,
      }),
      {
        successMessage: TOAST.SUCCESS.UPDATED,
        errorMessage: TOAST.ERROR.UPDATE_FAILED,
        closeDialog: () => this.closeReturnDialog(),
        includeAssignments: true,
      },
    );
  }
}
