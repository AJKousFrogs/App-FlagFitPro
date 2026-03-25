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
import { Badge } from "primeng/badge";
import { InputNumber, type InputNumberInputEvent } from "primeng/inputnumber";
import { InputText } from "primeng/inputtext";
import { Select, type SelectChangeEvent } from "primeng/select";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";

import { TOAST } from "../../core/constants/toast-messages.constants";
import { AuthService } from "../../core/services/auth.service";
import {
  EquipmentAssignment,
  EquipmentItem,
  EquipmentService,
  EquipmentSummary,
} from "../../core/services/equipment.service";
import { LoggerService } from "../../core/services/logger.service";
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
type EquipmentFormItem = {
  name: string;
  item_type: ItemType;
  condition: Condition;
  size: string;
  color: string;
  quantity_total: number;
  description: string;
};
type CheckoutData = { player_id: string; quantity: number; notes: string };
type ReturnData = { condition: Condition; notes: string };

@Component({
  selector: "app-equipment",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TableModule,
    StatusTagComponent,
    InputText,
    InputNumber,
    Select,
    Badge,
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
  template: `
    <app-main-layout>
      <div class="equipment-page ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Equipment Management"
          subtitle="Track and manage team gear"
        >
          <div class="header-actions">
            @if (isCoach()) {
              <app-button iconLeft="pi-plus" (clicked)="openAddDialog()"
                >Add Equipment</app-button
              >
            }
          </div>
        </app-page-header>

        <div class="equipment-content ui-page-stack">
          <!-- Summary Cards -->
          @if (summary()) {
            <div class="summary-grid">
              <app-card-shell class="summary-card">
                <div class="summary-content">
                  <i class="pi pi-box summary-icon"></i>
                  <div class="summary-info">
                    <span class="summary-value">{{
                      summary()!.total_items
                    }}</span>
                    <span class="summary-label">Total Items</span>
                  </div>
                </div>
              </app-card-shell>

              <app-card-shell class="summary-card">
                <div class="summary-content">
                  <i class="pi pi-check-circle summary-icon success"></i>
                  <div class="summary-info">
                    <span class="summary-value">{{
                      summary()!.available_quantity
                    }}</span>
                    <span class="summary-label">Available</span>
                  </div>
                </div>
              </app-card-shell>

              <app-card-shell class="summary-card">
                <div class="summary-content">
                  <i class="pi pi-users summary-icon info"></i>
                  <div class="summary-info">
                    <span class="summary-value">{{
                      summary()!.assigned_quantity
                    }}</span>
                    <span class="summary-label">Assigned</span>
                  </div>
                </div>
              </app-card-shell>

              <app-card-shell
                class="summary-card"
                [class.alert]="summary()!.items_needing_replacement > 0"
              >
                <div class="summary-content">
                  <i
                    class="pi pi-exclamation-triangle summary-icon warning"
                  ></i>
                  <div class="summary-info">
                    <span class="summary-value">{{
                      summary()!.items_needing_replacement
                    }}</span>
                    <span class="summary-label">Need Replacement</span>
                  </div>
                </div>
              </app-card-shell>
            </div>
          }

          <!-- Equipment Inventory -->
          <app-card-shell class="inventory-card" title="Equipment Inventory">
            <div header-actions class="filter-actions">
              <p-select
                [options]="typeOptions"
                (onChange)="onSelectedTypeSelect($event)"
                placeholder="All Types"
                [showClear]="true"
                class="equipment-filter-select"
              ></p-select>
            </div>

            <p-table
              [value]="filteredEquipment()"
              [paginator]="true"
              [rows]="10"
              class="p-datatable-sm"
              [rowHover]="true"
              [scrollable]="true"
            >
              <ng-template #header>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Size/Color</th>
                  <th>Quantity</th>
                  <th>Condition</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template #body let-item>
                <tr>
                  <td>
                    <div class="item-cell">
                      <i [class]="getTypeIcon(item.item_type)"></i>
                      <div class="item-info">
                        <span class="item-name">{{ item.name }}</span>
                        @if (item.description) {
                          <span class="item-desc">{{ item.description }}</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td>
                    <app-status-tag
                      [value]="getTypeLabel(item.item_type)"
                      severity="info"
                      size="sm"
                    />
                  </td>
                  <td>
                    <span>{{ item.size || "-" }}</span>
                    @if (item.color) {
                      <span
                        class="color-dot"
                        [style.background-color]="item.color"
                      ></span>
                    }
                  </td>
                  <td>
                    <div class="quantity-cell">
                      <span class="available">{{
                        item.quantity_available
                      }}</span>
                      <span class="separator">/</span>
                      <span class="total">{{ item.quantity_total }}</span>
                    </div>
                  </td>
                  <td>
                    <app-status-tag
                      [value]="getConditionLabel(item.condition)"
                      [severity]="getConditionSeverity(item.condition)"
                      size="sm"
                    />
                  </td>
                  <td>
                    <div class="action-buttons">
                      @if (isCoach()) {
                        <app-icon-button
                          icon="pi-arrow-right"
                          variant="text"
                          [disabled]="item.quantity_available === 0"
                          (clicked)="openCheckoutDialog(item)"
                          ariaLabel="Check out equipment"
                          tooltip="Checkout"
                        />
                        <app-icon-button
                          icon="pi-pencil"
                          variant="text"
                          (clicked)="openEditDialog(item)"
                          ariaLabel="Edit equipment"
                          tooltip="Edit"
                        />
                        <app-icon-button
                          icon="pi-trash"
                          variant="text"
                          (clicked)="deleteItem(item)"
                          ariaLabel="Delete equipment"
                          tooltip="Delete"
                        />
                      }
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template #emptymessage>
                <tr>
                  <td colspan="6">
                    <div class="empty-message">
                      <i class="pi pi-inbox"></i>
                      <p>No equipment found</p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </app-card-shell>

          <!-- Active Assignments -->
          @if (isCoach()) {
            <app-card-shell class="assignments-card" title="Active Assignments">
              <p-badge
                header-actions
                [value]="activeAssignments().length.toString()"
              ></p-badge>

              @if (activeAssignments().length === 0) {
                <app-empty-state
                  icon="pi-users"
                  heading="No active equipment assignments"
                  description="Equipment assignments will appear here when players are assigned gear."
                />
              } @else {
                <p-table
                  [value]="activeAssignments()"
                  [paginator]="true"
                  [rows]="5"
                  class="p-datatable-sm"
                  [scrollable]="true"
                >
                  <ng-template #header>
                    <tr>
                      <th>Player</th>
                      <th>Equipment</th>
                      <th>Qty</th>
                      <th>Assigned</th>
                      <th>Actions</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-assignment>
                    <tr>
                      <td>{{ assignment.player_name }}</td>
                      <td>{{ assignment.equipment_name }}</td>
                      <td>{{ assignment.quantity_assigned }}</td>
                      <td>{{ assignment.assigned_at | date: "shortDate" }}</td>
                      <td>
                        <app-button
                          variant="text"
                          size="sm"
                          iconLeft="pi-arrow-left"
                          (clicked)="openReturnDialog(assignment)"
                          >Return</app-button
                        >
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              }
            </app-card-shell>
          }
        </div>

        <!-- Add/Edit Equipment Dialog -->
        <app-dialog
          [(visible)]="showAddDialog"
          [modal]="true"
          styleClass="equipment-add-dialog"
          [blockScroll]="true"
          [draggable]="false"
          [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
          [ariaLabel]="editingItem ? 'Edit equipment' : 'Add equipment'"
        >
          <app-dialog-header
            icon="box"
            [title]="editingItem ? 'Edit Equipment' : 'Add Equipment'"
            subtitle="Track inventory, condition, and available quantities."
            (close)="showAddDialog = false"
          />
          <div class="dialog-form">
            <div class="form-field">
              <label>Name *</label>
              <input
                pInputText
                [value]="newItem.name"
                (input)="onNewItemNameInput($event)"
                placeholder="e.g., Home Jersey"
              />
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label>Type *</label>
                <p-select
                  [options]="typeOptions"
                  (onChange)="onNewItemTypeSelect($event)"
                  placeholder="Select type"
                  class="w-full"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Condition</label>
                <p-select
                  [options]="conditionOptions"
                  (onChange)="onNewItemConditionSelect($event)"
                  class="w-full"
                ></p-select>
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-field">
                <label>Size</label>
                <input
                  pInputText
                  [value]="newItem.size"
                  (input)="onNewItemSizeInput($event)"
                  placeholder="e.g., Large, 42"
                />
              </div>

              <div class="form-field">
                <label>Color</label>
                <input
                  pInputText
                  [value]="newItem.color"
                  (input)="onNewItemColorInput($event)"
                  placeholder="e.g., Red"
                />
              </div>
            </div>

            <div class="form-field">
              <label>Total Quantity *</label>
              <p-inputNumber
                (onInput)="onNewItemQuantityInput($event)"
                [min]="1"
              ></p-inputNumber>
            </div>

            <div class="form-field">
              <label>Description</label>
              <input
                pInputText
                [value]="newItem.description"
                (input)="onNewItemDescriptionInput($event)"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <app-dialog-footer
            dialogFooter
            cancelLabel="Cancel"
            primaryLabel="Save Equipment"
            primaryIcon="check"
            [disabled]="!canSaveItem()"
            (cancel)="showAddDialog = false"
            (primary)="saveItem()"
          />
        </app-dialog>

        <!-- Checkout Dialog -->
        <app-dialog
          [(visible)]="showCheckoutDialog"
          [modal]="true"
          styleClass="equipment-checkout-dialog"
          [blockScroll]="true"
          [draggable]="false"
          [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
          ariaLabel="Checkout equipment"
        >
          <app-dialog-header
            icon="arrow-right-arrow-left"
            title="Checkout Equipment"
            subtitle="Assign team gear to a player and track quantity."
            (close)="showCheckoutDialog = false"
          />
          @if (checkoutItem()) {
            <div class="dialog-form">
              <p class="checkout-info">
                Checking out: <strong>{{ checkoutItem()!.name }}</strong>
                <br />
                Available: {{ checkoutItem()!.quantity_available }}
              </p>

              <div class="form-field">
                <label>Player *</label>
                <p-select
                  [options]="teamPlayers()"
                  (onChange)="onCheckoutPlayerSelect($event)"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select player"
                  [filter]="true"
                  class="w-full"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Quantity</label>
                <p-inputNumber
                  (onInput)="onCheckoutQuantityInput($event)"
                  [min]="1"
                  [max]="checkoutItem()!.quantity_available"
                ></p-inputNumber>
              </div>

              <div class="form-field">
                <label>Notes</label>
                <input
                  pInputText
                  [value]="checkoutData.notes"
                  (input)="onCheckoutNotesInput($event)"
                  placeholder="Optional..."
                />
              </div>
            </div>
          }

          <app-dialog-footer
            dialogFooter
            cancelLabel="Cancel"
            primaryLabel="Checkout"
            primaryIcon="check"
            [disabled]="!checkoutData.player_id"
            (cancel)="showCheckoutDialog = false"
            (primary)="checkout()"
          />
        </app-dialog>

        <!-- Return Dialog -->
        <app-dialog
          [(visible)]="showReturnDialog"
          [modal]="true"
          styleClass="equipment-return-dialog"
          [blockScroll]="true"
          [draggable]="false"
          [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
          ariaLabel="Return equipment"
        >
          <app-dialog-header
            icon="undo"
            title="Return Equipment"
            subtitle="Record the condition of gear as it comes back in."
            (close)="showReturnDialog = false"
          />
          @if (returnAssignment()) {
            <div class="dialog-form">
              <p class="return-info">
                Returning:
                <strong>{{ returnAssignment()!.equipment_name }}</strong> from
                {{ returnAssignment()!.player_name }}
              </p>

              <div class="form-field">
                <label>Condition at Return *</label>
                <p-select
                  [options]="conditionOptions"
                  (onChange)="onReturnConditionSelect($event)"
                  class="w-full"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Notes</label>
                <input
                  pInputText
                  [value]="returnData.notes"
                  (input)="onReturnNotesInput($event)"
                  placeholder="Any damage or issues..."
                />
              </div>
            </div>
          }

          <app-dialog-footer
            dialogFooter
            cancelLabel="Cancel"
            primaryLabel="Process Return"
            primaryIcon="check"
            (cancel)="showReturnDialog = false"
            (primary)="processReturn()"
          />
        </app-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./equipment.component.scss",
})
export class EquipmentComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private teamStatsService = inject(TeamStatisticsService);
  private authService = inject(AuthService);
  private teamMembershipService = inject(TeamMembershipService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  private dialogService = inject(DialogService);

  // State
  equipment = signal<EquipmentItem[]>([]);
  assignments = signal<EquipmentAssignment[]>([]);
  summary = signal<EquipmentSummary | null>(null);
  teamPlayers = signal<Array<{ id: string; name: string }>>([]);

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
    const teamId =
      this.authService.getUser()?.user_metadata?.team_id || "default";
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
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
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
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
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
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
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

  onSelectedTypeSelect(event: SelectChangeEvent): void {
    this.onSelectedTypeChange((event.value as ItemType | null | undefined) ?? null);
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

  onNewItemTypeSelect(event: SelectChangeEvent): void {
    this.updateNewItemType(event.value as ItemType | null | undefined);
  }

  updateNewItemType(value: ItemType | null | undefined): void {
    this.newItem = { ...this.newItem, item_type: value ?? "jersey" };
  }

  onNewItemConditionSelect(event: SelectChangeEvent): void {
    this.updateNewItemCondition(event.value as Condition | null | undefined);
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

  onCheckoutPlayerSelect(event: SelectChangeEvent): void {
    this.updateCheckoutPlayerId(
      typeof event.value === "string" ? event.value : null,
    );
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

  onReturnConditionSelect(event: SelectChangeEvent): void {
    this.updateReturnCondition(event.value as Condition | null | undefined);
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

  openAddDialog(): void {
    this.editingItem = null;
    this.newItem = this.getEmptyItem();
    this.showAddDialog = true;
  }

  openEditDialog(item: EquipmentItem): void {
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
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
    if (!teamId || !this.canSaveItem()) return;

    if (this.editingItem) {
      this.equipmentService
        .updateEquipmentItem(this.editingItem.id, this.newItem)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success(TOAST.SUCCESS.UPDATED);
            this.showAddDialog = false;
            this.loadEquipment();
            this.loadSummary();
          },
          error: () => this.toastService.error(TOAST.ERROR.UPDATE_FAILED),
        });
    } else {
      this.equipmentService
        .createEquipmentItem({ ...this.newItem, team_id: teamId })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success(TOAST.SUCCESS.CREATED);
            this.showAddDialog = false;
            this.loadEquipment();
            this.loadSummary();
          },
          error: () => this.toastService.error(TOAST.ERROR.CREATE_FAILED),
        });
    }
  }

  async deleteItem(item: EquipmentItem): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      `Delete ${item.name}?`,
      "Delete Item",
    );
    if (!confirmed) return;

    this.equipmentService
      .deleteEquipmentItem(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.DELETED);
          this.loadEquipment();
          this.loadSummary();
        },
        error: () => this.toastService.error(TOAST.ERROR.DELETE_FAILED),
      });
  }

  openCheckoutDialog(item: EquipmentItem): void {
    this.checkoutItem.set(item);
    this.checkoutData = { player_id: "", quantity: 1, notes: "" };
    this.showCheckoutDialog = true;
  }

  checkout(): void {
    const item = this.checkoutItem();
    if (!item || !this.checkoutData.player_id) return;

    this.equipmentService
      .checkoutEquipment({
        equipment_id: item.id,
        player_id: this.checkoutData.player_id,
        quantity: this.checkoutData.quantity,
        notes: this.checkoutData.notes || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.UPDATED);
          this.showCheckoutDialog = false;
          this.loadEquipment();
          this.loadAssignments();
          this.loadSummary();
        },
        error: () => this.toastService.error(TOAST.ERROR.UPDATE_FAILED),
      });
  }

  openReturnDialog(assignment: EquipmentAssignment): void {
    this.returnAssignment.set(assignment);
    this.returnData = { condition: "good", notes: "" };
    this.showReturnDialog = true;
  }

  processReturn(): void {
    const assignment = this.returnAssignment();
    if (!assignment) return;

    this.equipmentService
      .returnEquipment({
        assignment_id: assignment.id,
        condition_at_return: this.returnData.condition,
        notes: this.returnData.notes || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.UPDATED);
          this.showReturnDialog = false;
          this.loadEquipment();
          this.loadAssignments();
          this.loadSummary();
        },
        error: () => this.toastService.error(TOAST.ERROR.UPDATE_FAILED),
      });
  }
}
