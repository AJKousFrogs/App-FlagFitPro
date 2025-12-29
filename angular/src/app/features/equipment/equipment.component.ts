import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule, DatePipe, CurrencyPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from "primeng/inputnumber";
import { Select } from "primeng/select";
import { DatePicker } from "primeng/datepicker";
import { TooltipModule } from "primeng/tooltip";
import { BadgeModule } from "primeng/badge";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  EquipmentService,
  EquipmentItem,
  EquipmentAssignment,
  EquipmentSummary,
} from "../../core/services/equipment.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";

type ItemType = "jersey" | "shorts" | "flags" | "belt" | "cleats" | "ball" | "cones" | "other";
type Condition = "new" | "good" | "fair" | "poor" | "needs_replacement";

@Component({
  selector: "app-equipment",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    Select,
    TooltipModule,
    BadgeModule,
    MainLayoutComponent,
    PageHeaderComponent,
    DatePipe,
  ],
  template: `
    <app-main-layout>
      <div class="equipment-page">
        <app-page-header
          title="Equipment Management"
          subtitle="Track and manage team gear"
        >
          <div class="header-actions">
            @if (isCoach()) {
              <p-button
                label="Add Equipment"
                icon="pi pi-plus"
                (onClick)="openAddDialog()"
              ></p-button>
            }
          </div>
        </app-page-header>

        <div class="equipment-content">
          <!-- Summary Cards -->
          @if (summary()) {
            <div class="summary-grid">
              <p-card styleClass="summary-card">
                <div class="summary-content">
                  <i class="pi pi-box summary-icon"></i>
                  <div class="summary-info">
                    <span class="summary-value">{{ summary()!.total_items }}</span>
                    <span class="summary-label">Total Items</span>
                  </div>
                </div>
              </p-card>

              <p-card styleClass="summary-card">
                <div class="summary-content">
                  <i class="pi pi-check-circle summary-icon success"></i>
                  <div class="summary-info">
                    <span class="summary-value">{{ summary()!.available_quantity }}</span>
                    <span class="summary-label">Available</span>
                  </div>
                </div>
              </p-card>

              <p-card styleClass="summary-card">
                <div class="summary-content">
                  <i class="pi pi-users summary-icon info"></i>
                  <div class="summary-info">
                    <span class="summary-value">{{ summary()!.assigned_quantity }}</span>
                    <span class="summary-label">Assigned</span>
                  </div>
                </div>
              </p-card>

              <p-card styleClass="summary-card" [class.alert]="summary()!.items_needing_replacement > 0">
                <div class="summary-content">
                  <i class="pi pi-exclamation-triangle summary-icon warning"></i>
                  <div class="summary-info">
                    <span class="summary-value">{{ summary()!.items_needing_replacement }}</span>
                    <span class="summary-label">Need Replacement</span>
                  </div>
                </div>
              </p-card>
            </div>
          }

          <!-- Equipment Inventory -->
          <p-card styleClass="inventory-card">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>Equipment Inventory</h3>
                <div class="filter-actions">
                  <p-select
                    [options]="typeOptions"
                    [(ngModel)]="selectedType"
                    placeholder="All Types"
                    [showClear]="true"
                    (onChange)="filterEquipment()"
                  ></p-select>
                </div>
              </div>
            </ng-template>

            <p-table
              [value]="filteredEquipment()"
              [paginator]="true"
              [rows]="10"
              styleClass="p-datatable-sm"
              [rowHover]="true"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Size/Color</th>
                  <th>Quantity</th>
                  <th>Condition</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item>
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
                    <p-tag [value]="getTypeLabel(item.item_type)" [severity]="'info'"></p-tag>
                  </td>
                  <td>
                    <span>{{ item.size || '-' }}</span>
                    @if (item.color) {
                      <span class="color-dot" [style.background-color]="item.color"></span>
                    }
                  </td>
                  <td>
                    <div class="quantity-cell">
                      <span class="available">{{ item.quantity_available }}</span>
                      <span class="separator">/</span>
                      <span class="total">{{ item.quantity_total }}</span>
                    </div>
                  </td>
                  <td>
                    <p-tag
                      [value]="getConditionLabel(item.condition)"
                      [severity]="getConditionSeverity(item.condition)"
                    ></p-tag>
                  </td>
                  <td>
                    <div class="action-buttons">
                      @if (isCoach()) {
                        <p-button
                          icon="pi pi-arrow-right"
                          [text]="true"
                          pTooltip="Checkout"
                          (onClick)="openCheckoutDialog(item)"
                          [disabled]="item.quantity_available === 0"
                        ></p-button>
                        <p-button
                          icon="pi pi-pencil"
                          [text]="true"
                          pTooltip="Edit"
                          (onClick)="openEditDialog(item)"
                        ></p-button>
                        <p-button
                          icon="pi pi-trash"
                          [text]="true"
                          severity="danger"
                          pTooltip="Delete"
                          (onClick)="deleteItem(item)"
                        ></p-button>
                      }
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
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
          </p-card>

          <!-- Active Assignments -->
          @if (isCoach()) {
            <p-card styleClass="assignments-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <h3>Active Assignments</h3>
                  <p-badge [value]="activeAssignments().length.toString()"></p-badge>
                </div>
              </ng-template>

              @if (activeAssignments().length === 0) {
                <div class="empty-state">
                  <i class="pi pi-users"></i>
                  <p>No active equipment assignments</p>
                </div>
              } @else {
                <p-table
                  [value]="activeAssignments()"
                  [paginator]="true"
                  [rows]="5"
                  styleClass="p-datatable-sm"
                >
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Player</th>
                      <th>Equipment</th>
                      <th>Qty</th>
                      <th>Assigned</th>
                      <th>Actions</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-assignment>
                    <tr>
                      <td>{{ assignment.player_name }}</td>
                      <td>{{ assignment.equipment_name }}</td>
                      <td>{{ assignment.quantity_assigned }}</td>
                      <td>{{ assignment.assigned_at | date: 'shortDate' }}</td>
                      <td>
                        <p-button
                          icon="pi pi-arrow-left"
                          label="Return"
                          [text]="true"
                          size="small"
                          (onClick)="openReturnDialog(assignment)"
                        ></p-button>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              }
            </p-card>
          }
        </div>

        <!-- Add/Edit Equipment Dialog -->
        <p-dialog
          [header]="editingItem ? 'Edit Equipment' : 'Add Equipment'"
          [(visible)]="showAddDialog"
          [modal]="true"
          [style]="{ width: '500px' }"
        >
          <div class="dialog-form">
            <div class="form-field">
              <label>Name *</label>
              <input pInputText [(ngModel)]="newItem.name" placeholder="e.g., Home Jersey" />
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Type *</label>
                <p-select
                  [options]="typeOptions"
                  [(ngModel)]="newItem.item_type"
                  placeholder="Select type"
                  [style]="{ width: '100%' }"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Condition</label>
                <p-select
                  [options]="conditionOptions"
                  [(ngModel)]="newItem.condition"
                  [style]="{ width: '100%' }"
                ></p-select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Size</label>
                <input pInputText [(ngModel)]="newItem.size" placeholder="e.g., Large, 42" />
              </div>

              <div class="form-field">
                <label>Color</label>
                <input pInputText [(ngModel)]="newItem.color" placeholder="e.g., Red" />
              </div>
            </div>

            <div class="form-field">
              <label>Total Quantity *</label>
              <p-inputNumber [(ngModel)]="newItem.quantity_total" [min]="1"></p-inputNumber>
            </div>

            <div class="form-field">
              <label>Description</label>
              <input pInputText [(ngModel)]="newItem.description" placeholder="Optional notes..." />
            </div>
          </div>

          <ng-template pTemplate="footer">
            <p-button label="Cancel" [text]="true" (onClick)="showAddDialog = false"></p-button>
            <p-button
              [label]="editingItem ? 'Save Changes' : 'Add Equipment'"
              icon="pi pi-check"
              (onClick)="saveItem()"
              [disabled]="!canSaveItem()"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Checkout Dialog -->
        <p-dialog
          header="Checkout Equipment"
          [(visible)]="showCheckoutDialog"
          [modal]="true"
          [style]="{ width: '400px' }"
        >
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
                  [(ngModel)]="checkoutData.player_id"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select player"
                  [filter]="true"
                  [style]="{ width: '100%' }"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Quantity</label>
                <p-inputNumber
                  [(ngModel)]="checkoutData.quantity"
                  [min]="1"
                  [max]="checkoutItem()!.quantity_available"
                ></p-inputNumber>
              </div>

              <div class="form-field">
                <label>Notes</label>
                <input pInputText [(ngModel)]="checkoutData.notes" placeholder="Optional..." />
              </div>
            </div>
          }

          <ng-template pTemplate="footer">
            <p-button label="Cancel" [text]="true" (onClick)="showCheckoutDialog = false"></p-button>
            <p-button
              label="Checkout"
              icon="pi pi-check"
              (onClick)="checkout()"
              [disabled]="!checkoutData.player_id"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Return Dialog -->
        <p-dialog
          header="Return Equipment"
          [(visible)]="showReturnDialog"
          [modal]="true"
          [style]="{ width: '400px' }"
        >
          @if (returnAssignment()) {
            <div class="dialog-form">
              <p class="return-info">
                Returning: <strong>{{ returnAssignment()!.equipment_name }}</strong>
                from {{ returnAssignment()!.player_name }}
              </p>

              <div class="form-field">
                <label>Condition at Return *</label>
                <p-select
                  [options]="conditionOptions"
                  [(ngModel)]="returnData.condition"
                  [style]="{ width: '100%' }"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Notes</label>
                <input pInputText [(ngModel)]="returnData.notes" placeholder="Any damage or issues..." />
              </div>
            </div>
          }

          <ng-template pTemplate="footer">
            <p-button label="Cancel" [text]="true" (onClick)="showReturnDialog = false"></p-button>
            <p-button
              label="Process Return"
              icon="pi pi-check"
              (onClick)="processReturn()"
            ></p-button>
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .equipment-page {
        padding: var(--space-6);
      }

      .header-actions {
        display: flex;
        gap: var(--space-3);
      }

      .equipment-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-4);
      }

      .summary-content {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .summary-icon {
        font-size: 2rem;
        color: var(--primary-color);

        &.success { color: var(--green-500); }
        &.info { color: var(--blue-500); }
        &.warning { color: var(--orange-500); }
      }

      .summary-info {
        display: flex;
        flex-direction: column;
      }

      .summary-value {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .summary-label {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
      }

      .summary-card.alert {
        border-left: 4px solid var(--orange-500);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--surface-border);

        h3 { margin: 0; }
      }

      .item-cell {
        display: flex;
        align-items: center;
        gap: var(--space-3);

        i {
          font-size: 1.25rem;
          color: var(--primary-color);
        }
      }

      .item-info {
        display: flex;
        flex-direction: column;
      }

      .item-name {
        font-weight: 500;
      }

      .item-desc {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
      }

      .color-dot {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-left: var(--space-2);
        border: 1px solid var(--surface-border);
      }

      .quantity-cell {
        display: flex;
        align-items: center;
        gap: var(--space-1);

        .available {
          font-weight: 600;
          color: var(--green-600);
        }

        .separator {
          color: var(--text-color-secondary);
        }

        .total {
          color: var(--text-color-secondary);
        }
      }

      .action-buttons {
        display: flex;
        gap: var(--space-1);
      }

      .empty-state, .empty-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-6);
        color: var(--text-color-secondary);

        i {
          font-size: 2rem;
          margin-bottom: var(--space-2);
        }

        p { margin: 0; }
      }

      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);

        label {
          font-weight: 500;
          font-size: 0.875rem;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }

      .checkout-info, .return-info {
        padding: var(--space-3);
        background: var(--surface-100);
        border-radius: var(--border-radius);
        margin: 0;
      }
    `,
  ],
})
export class EquipmentComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

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
  newItem = this.getEmptyItem();
  checkoutData = { player_id: "", quantity: 1, notes: "" };
  returnData = { condition: "good" as Condition, notes: "" };

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
    // TODO: Load team players for checkout dropdown
  }

  isCoach(): boolean {
    const user = this.authService.getUser();
    return user?.user_metadata?.role === "coach" || user?.user_metadata?.role === "admin";
  }

  getEmptyItem() {
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
        error: () => this.toastService.error("Failed to load equipment"),
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
    const found = this.equipmentService.EQUIPMENT_TYPES.find((t) => t.value === type);
    return found?.label || type;
  }

  getConditionLabel(condition: string): string {
    const found = this.equipmentService.CONDITIONS.find((c) => c.value === condition);
    return found?.label || condition;
  }

  getConditionSeverity(condition: string): "success" | "warn" | "danger" | "info" {
    const severities: Record<string, "success" | "warn" | "danger" | "info"> = {
      new: "success",
      good: "success",
      fair: "warn",
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
    return !!(this.newItem.name && this.newItem.item_type && this.newItem.quantity_total > 0);
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
            this.toastService.success("Equipment updated");
            this.showAddDialog = false;
            this.loadEquipment();
            this.loadSummary();
          },
          error: () => this.toastService.error("Failed to update equipment"),
        });
    } else {
      this.equipmentService
        .createEquipmentItem({ ...this.newItem, team_id: teamId })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success("Equipment added");
            this.showAddDialog = false;
            this.loadEquipment();
            this.loadSummary();
          },
          error: () => this.toastService.error("Failed to add equipment"),
        });
    }
  }

  deleteItem(item: EquipmentItem): void {
    if (!confirm(`Delete ${item.name}?`)) return;

    this.equipmentService
      .deleteEquipmentItem(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success("Equipment deleted");
          this.loadEquipment();
          this.loadSummary();
        },
        error: () => this.toastService.error("Failed to delete equipment"),
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
          this.toastService.success("Equipment checked out");
          this.showCheckoutDialog = false;
          this.loadEquipment();
          this.loadAssignments();
          this.loadSummary();
        },
        error: () => this.toastService.error("Failed to checkout equipment"),
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
          this.toastService.success("Equipment returned");
          this.showReturnDialog = false;
          this.loadEquipment();
          this.loadAssignments();
          this.loadSummary();
        },
        error: () => this.toastService.error("Failed to process return"),
      });
  }
}
