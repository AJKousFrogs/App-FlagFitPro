import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { InputText } from "primeng/inputtext";
import { IconButtonComponent } from "../button/icon-button.component";

/**
 * Search Input Component
 *
 * Shared search input with icon + optional clear action.
 * Uses ControlValueAccessor for ngModel support.
 */
@Component({
  selector: "app-search-input",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, InputText, IconButtonComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true,
    },
  ],
  host: {
    class: "ds-search-bar",
  },
  template: `
    <span class="p-input-icon-left ds-search-input">
      <i class="pi pi-search ds-search-icon" aria-hidden="true"></i>
      <input
        #inputField
        pInputText
        [id]="inputId() || null"
        [name]="name() || null"
        [type]="type()"
        [placeholder]="placeholder() || ''"
        [readonly]="readonly()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onBlur()"
        class="ds-search-input-field search-input"
        [attr.aria-label]="ariaLabel() || placeholder() || 'Search'"
      />
    </span>
    @if (clearable() && value()) {
      <app-icon-button
        icon="pi-times"
        ariaLabel="Clear search"
        variant="text"
        size="sm"
        class="ds-search-clear"
        (clicked)="clear()"
      />
    }
  `,
  styleUrl: "./search-input.component.scss",
})
export class SearchInputComponent implements ControlValueAccessor {
  placeholder = input<string>("");
  ariaLabel = input<string>("");
  inputId = input<string>();
  name = input<string>();
  type = input<string>("text");
  readonly = input<boolean>(false);
  disabled = input<boolean>(false);
  clearable = input<boolean>(false);

  cleared = output<void>();

  // Angular 21: viewChild signal for DOM element reference
  private readonly inputField = viewChild<ElementRef<HTMLInputElement>>('inputField');

  value = signal<string>("");
  private onChangeFn = (_value: string) => {};
  private onTouchedFn = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const nextValue = target.value ?? "";
    this.value.set(nextValue);
    this.onChangeFn(nextValue);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  clear(): void {
    this.value.set("");
    this.onChangeFn("");
    this.cleared.emit();
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? "");
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // Disabled is managed via input() for explicit control.
  }

  /**
   * Focus the input field programmatically.
   * Used by parent components to set focus on the search input.
   */
  focus(): void {
    this.inputField()?.nativeElement?.focus();
  }
}
