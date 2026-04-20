/**
 * Payment Management Component (Coach View)
 *
 * Manage team fees, track player payments, send reminders, and
 * maintain financial records for tournaments, dues, and equipment.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { toSignal } from "@angular/core/rxjs-interop";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { InputNumber } from "primeng/inputnumber";
import { ProgressBar } from "primeng/progressbar";
import { RadioButton } from "primeng/radiobutton";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  paymentStatusSeverityMap,
} from "../../../shared/utils/status.utils";
import { CheckboxComponent } from "../../../shared/components/checkbox/checkbox.component";
import { DatePickerComponent } from "../../../shared/components/date-picker/date-picker.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { startWith } from "rxjs";

import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../shared/components/ui-components";
import {
  type BalanceFilter,
  type FeeForm,
  type FeeType,
  type PaymentForm,
  type PlayerBalance,
  type TeamFee,
  PaymentDataService,
} from "./payment-data.service";

type FeeFormGroup = FormGroup<{
  name: FormControl<string>;
  type: FormControl<FeeType>;
  amount: FormControl<number>;
  guestFee: FormControl<number>;
  dueDate: FormControl<Date | null>;
  description: FormControl<string>;
  applyTo: FormControl<"all" | "select">;
  notifyOnCreate: FormControl<boolean>;
  remind3Days: FormControl<boolean>;
  remindOverdue: FormControl<boolean>;
}>;

type PaymentFormGroup = FormGroup<{
  playerId: FormControl<string>;
  amount: FormControl<number>;
  method: FormControl<string>;
  date: FormControl<Date>;
  reference: FormControl<string>;
  sendConfirmation: FormControl<boolean>;
}>;


// ===== Constants =====
const FEE_TYPES = [
  { label: "Monthly Dues", value: "dues" },
  { label: "Tournament Entry", value: "tournament" },
  { label: "Equipment", value: "equipment" },
  { label: "One-time / Other", value: "other" },
];

const PAYMENT_METHODS = [
  { label: "Venmo", value: "venmo" },
  { label: "Zelle", value: "zelle" },
  { label: "Cash", value: "cash" },
  { label: "PayPal", value: "paypal" },
  { label: "Other", value: "other" },
];

const BALANCE_FILTERS = [
  { label: "Show All", value: "all" },
  { label: "Outstanding Only", value: "outstanding" },
  { label: "Overdue Only", value: "overdue" },
  { label: "Paid Up", value: "paid" },
];

@Component({
  selector: "app-payment-management",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CardShellComponent,
    CheckboxComponent,
    DatePickerComponent,
    FormInputComponent,
    SearchInputComponent,
    InputNumber,
    ProgressBar,
    RadioButton,
    SelectComponent,
    TableModule,
    StatusTagComponent,
    TextareaComponent,

    MainLayoutComponent,
    PageHeaderComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    ButtonComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./payment-management.component.html",
  styleUrl: "./payment-management.component.scss",
})
export class PaymentManagementComponent implements OnInit {
  readonly data = inject(PaymentDataService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // UI-only state
  readonly activeTab = signal<"overview" | "fees" | "balances" | "history">(
    "overview",
  );

  // Filter controls (UI concern — drive filteredBalances below)
  readonly balanceSearchControl = new FormControl("", { nonNullable: true });
  readonly balanceFilterControl = new FormControl<BalanceFilter>("all", {
    nonNullable: true,
  });
  readonly balanceSearch = toSignal(
    this.balanceSearchControl.valueChanges.pipe(
      startWith(this.balanceSearchControl.value),
    ),
    { initialValue: this.balanceSearchControl.value },
  );
  readonly balanceFilter = toSignal(
    this.balanceFilterControl.valueChanges.pipe(
      startWith(this.balanceFilterControl.value),
    ),
    { initialValue: this.balanceFilterControl.value },
  );

  // Dialog state
  showFeeDialog = false;
  showPaymentDialog = false;
  showFeeDetailsDialog = false;

  // Forms
  readonly feeFormGroup: FeeFormGroup = this.createFeeForm();
  readonly paymentFormGroup: PaymentFormGroup = this.createPaymentForm();

  // Options
  readonly feeTypes = FEE_TYPES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly balanceFilters = BALANCE_FILTERS;

  // filteredBalances depends on UI filter controls so it stays here
  readonly filteredBalances = computed(() => {
    let result = this.data.balances();
    const searchValue = this.balanceSearch();
    const filterValue = this.balanceFilter();

    if (searchValue) {
      const search = searchValue.toLowerCase();
      result = result.filter((b) =>
        b.playerName.toLowerCase().includes(search),
      );
    }

    if (filterValue === "outstanding") {
      result = result.filter((b) => b.balance > 0);
    } else if (filterValue === "overdue") {
      result = result.filter((b) => b.status === "overdue");
    } else if (filterValue === "paid") {
      result = result.filter((b) => b.balance === 0);
    }

    return result;
  });

  readonly selectedPaymentPlayerId = computed(
    () => this.paymentFormGroup.controls.playerId.value,
  );

  ngOnInit(): void {
    void this.data.loadData();
  }

  retryLoadData(): void {
    void this.data.loadData();
  }

  private getEmptyFeeForm(): FeeForm {
    return {
      name: "",
      type: "dues" as "dues" | "tournament" | "equipment" | "other",
      amount: 0,
      guestFee: 0,
      dueDate: null as Date | null,
      description: "",
      applyTo: "all",
      notifyOnCreate: true,
      remind3Days: true,
      remindOverdue: false,
    };
  }

  private getEmptyPaymentForm(): PaymentForm {
    return {
      playerId: "",
      amount: 0,
      method: "venmo",
      date: new Date(),
      reference: "",
      sendConfirmation: true,
    };
  }

  private createFeeForm(): FeeFormGroup {
    const defaults = this.getEmptyFeeForm();
    return new FormGroup({
      name: new FormControl(defaults.name, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      type: new FormControl(defaults.type, { nonNullable: true }),
      amount: new FormControl(defaults.amount, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      guestFee: new FormControl(defaults.guestFee, { nonNullable: true }),
      dueDate: new FormControl(defaults.dueDate),
      description: new FormControl(defaults.description, { nonNullable: true }),
      applyTo: new FormControl(defaults.applyTo, { nonNullable: true }),
      notifyOnCreate: new FormControl(defaults.notifyOnCreate, {
        nonNullable: true,
      }),
      remind3Days: new FormControl(defaults.remind3Days, { nonNullable: true }),
      remindOverdue: new FormControl(defaults.remindOverdue, {
        nonNullable: true,
      }),
    });
  }

  private createPaymentForm(): PaymentFormGroup {
    const defaults = this.getEmptyPaymentForm();
    return new FormGroup({
      playerId: new FormControl(defaults.playerId, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      amount: new FormControl(defaults.amount, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
      }),
      method: new FormControl(defaults.method, { nonNullable: true }),
      date: new FormControl(defaults.date, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      reference: new FormControl(defaults.reference, { nonNullable: true }),
      sendConfirmation: new FormControl(defaults.sendConfirmation, {
        nonNullable: true,
      }),
    });
  }

  // Dialog methods
  openCreateFeeDialog(): void {
    this.feeFormGroup.reset(this.getEmptyFeeForm());
    this.showFeeDialog = true;
  }

  openRecordPaymentDialog(_fee?: TeamFee): void {
    this.paymentFormGroup.reset(this.getEmptyPaymentForm());
    this.showPaymentDialog = true;
  }

  async createFee(): Promise<void> {
    if (this.feeFormGroup.invalid) {
      this.feeFormGroup.markAllAsTouched();
      this.toastService.error("Please complete required fee fields.");
      return;
    }
    const success = await this.data.createFee(
      this.feeFormGroup.getRawValue() as FeeForm,
    );
    if (success) {
      this.showFeeDialog = false;
    }
  }

  async recordPayment(): Promise<void> {
    if (this.paymentFormGroup.invalid) {
      this.paymentFormGroup.markAllAsTouched();
      this.toastService.error("Please complete required payment fields.");
      return;
    }
    const success = await this.data.recordPayment(
      this.paymentFormGroup.getRawValue() as PaymentForm,
    );
    if (success) {
      this.showPaymentDialog = false;
    }
  }

  // Action methods
  viewFeeDetails(fee: TeamFee): void {
    this.data.selectedFee.set(fee);
    this.showFeeDetailsDialog = true;
  }

  sendFeeReminders(fee: TeamFee): void {
    const draft = `Reminder: ${fee.name} is due on ${fee.dueDate}. Please review your payment status and settle any outstanding balance.`;
    void this.openReminderComposer(draft, "Fee Reminder Draft");
  }

  sendPlayerReminder(balance: PlayerBalance): void {
    const draft = `Hi ${balance.playerName}, this is a reminder that your current outstanding balance is $${balance.balance}. Please check the latest team fee details.`;
    void this.openReminderComposer(draft, "Player Reminder Draft");
  }

  markPlayerPaid(balance: PlayerBalance): void {
    this.paymentFormGroup.reset({
      ...this.getEmptyPaymentForm(),
      playerId: balance.id,
      amount: balance.balance,
    });
    this.showPaymentDialog = true;
  }

  viewPlayerHistory(_balance: PlayerBalance): void {
    this.activeTab.set("history");
  }

  sendAllReminders(): void {
    const count = this.data.playersOwing();
    if (count === 0) {
      this.toastService.info("No outstanding balances need reminders.");
      return;
    }

    const draft = `Team reminder: ${count} players still have outstanding balances. Please review payment details and update your status as soon as possible.`;
    void this.openReminderComposer(draft, "Team Reminder Draft");
  }

  exportCSV(): void {
    const rows = [
      ["Player", "Fee", "Amount", "Method", "Date", "Reference"],
      ...this.data.payments().map((payment) => [
        payment.playerName,
        payment.feeName,
        payment.amount.toString(),
        payment.method,
        payment.date,
        payment.reference || "",
      ]),
    ];
    this.downloadCsv("payment-history.csv", rows);
    this.toastService.success("Payment CSV downloaded.", "Export Ready");
  }

  private async openReminderComposer(
    draft: string,
    toastTitle: string,
  ): Promise<void> {
    await this.router.navigate(["/team-chat"], {
      queryParams: {
        source: "payments",
        draft,
      },
    });
    this.toastService.success(
      "Reminder draft opened in team chat.",
      toastTitle,
    );
  }

  private downloadCsv(filename: string, rows: string[][]): void {
    const content = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // Helpers
  getFeeIcon(type: string): string {
    const icons: Record<string, string> = {
      tournament: "pi-trophy",
      dues: "pi-clipboard",
      equipment: "pi-tag",
      other: "pi-wallet",
    };
    return icons[type] || "pi-wallet";
  }

  getCollectionPercent(fee: TeamFee): number {
    if (fee.total === 0) return 100;
    return Math.round((fee.collected / fee.total) * 100);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      paid: "Paid",
      due: "Due",
      overdue: "Overdue",
    };
    return labels[status] || status;
  }

  getStatusSeverity(
    status: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    return getMappedStatusSeverity(
      status,
      paymentStatusSeverityMap,
      "secondary",
    );
  }

  getPlayerBalance(playerId: string): number {
    return this.data.balances().find((b) => b.id === playerId)?.balance || 0;
  }

  getFeeTypeLabel(type: TeamFee["type"]): string {
    return this.feeTypes.find((option) => option.value === type)?.label || type;
  }

  openPaymentDialogFromDetails(): void {
    this.showFeeDetailsDialog = false;
    this.openRecordPaymentDialog(this.data.selectedFee() || undefined);
  }
}
