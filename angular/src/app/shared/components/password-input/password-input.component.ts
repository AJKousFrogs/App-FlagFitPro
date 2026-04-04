import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  input,
  output,
  signal,
  computed,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from "@angular/forms";
import { PasswordModule } from "primeng/password";

@Component({
  selector: "app-password-input",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PasswordModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="app-password-input-wrapper">
      @if (label()) {
        <label [for]="inputId()" class="block mb-2 font-medium text-surface-900 dark:text-surface-0">
          {{ label() }}
          @if (required()) {
             <span class="text-red-500">*</span>
          }
        </label>
      }
      <p-password
        [ngModel]="passwordValue"
        (ngModelChange)="onPasswordNgModelChange($event)"
        [toggleMask]="toggleMask()"
        [feedback]="feedback()"
        [placeholder]="placeholder()"
        [inputId]="inputId()"
        [styleClass]="'w-full ' + styleClass()"
        [inputStyleClass]="'w-full ' + inputStyleClass()"
        [autocomplete]="autocomplete()"
        [disabled]="isDisabled()"
        [weakLabel]="weakLabel()"
        [mediumLabel]="mediumLabel()"
        [strongLabel]="strongLabel()"
        [promptLabel]="promptLabel()"
      >
        <ng-template pTemplate="header">
            <ng-content select="[header]"></ng-content>
        </ng-template>
        <ng-template pTemplate="footer">
            <ng-content select="[footer]"></ng-content>
        </ng-template>
      </p-password>
      @if (hint()) {
        <small class="block mt-1 text-gray-500">{{ hint() }}</small>
      }
    </div>
  `,
  styles: [`
    .app-password-input-host {
      display: block;
      width: 100%;
    }
    .app-password-input-wrapper {
      width: 100%;
    }
    .app-password-input-host .p-password,
    .app-password-input-host .p-password-input {
      width: 100%;
    }
  `]
})
export class PasswordInputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  // Inputs
  label = input<string>("");
  placeholder = input<string>("");
  toggleMask = input(true);
  feedback = input(true);
  required = input(false);
  disabled = input(false);
  hint = input<string>("");
  inputId = input<string>(`password-${Math.random().toString(36).slice(2, 11)}`);
  styleClass = input<string>("");
  inputStyleClass = input<string>("");
  autocomplete = input<string>("off");

  // Labels
  weakLabel = input("Weak");
  mediumLabel = input("Medium");
  strongLabel = input("Strong");
  promptLabel = input("Enter a password");

  // Outputs
  change = output<string>();

  /** Plain string — NgModel + p-password does not work with WritableSignal two-way binding. */
  protected passwordValue = "";
  private _cvaDisabled = signal(false);

  protected isDisabled = computed(() => this.disabled() || this._cvaDisabled());

  // ControlValueAccessor
  private onModelChange: (value: string) => void = () => {};
  private onModelTouched: () => void = () => {};

  onPasswordNgModelChange(val: string): void {
    this.passwordValue = val ?? "";
    this.onModelChange(this.passwordValue);
    this.change.emit(this.passwordValue);
    this.onModelTouched();
    this.cdr.markForCheck();
  }

  writeValue(value: string): void {
    this.passwordValue = value || "";
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
}
