import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { InputText } from "primeng/inputtext";
import { IconButtonComponent } from "../button/icon-button.component";

/**
 * Search Input Component
 *
 * Shared search input with icon + optional clear action.
 * Uses ControlValueAccessor for template-driven and reactive forms support.
 */
@Component({
  selector: "app-search-input",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, InputText, IconButtonComponent],
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
      [value]="textValue()"
      (input)="onInput($event)"
      (blur)="onBlur()"
      class="ds-search-input-field search-input"
      [attr.aria-label]="ariaLabel() || placeholder() || 'Search'"
    />
    @if (clearable() && textValue()) {
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
  value = input<string | undefined>(undefined, { alias: "value" });

  placeholder = input<string>("");
  ariaLabel = input<string>("");
  inputId = input<string>();
  name = input<string>();
  type = input<string>("text");
  readonly = input<boolean>(false);
  disabled = input<boolean>(false);
  clearable = input<boolean>(false);

  cleared = output<void>();
  valueChange = output<string>();

  // Angular 21: viewChild signal for DOM element reference
  private readonly inputField =
    viewChild<ElementRef<HTMLInputElement>>("inputField");

  textValue = signal<string>("");
  private onChangeFn = (_value: string) => {};
  private onTouchedFn = () => {};

  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== undefined) {
        this.textValue.set(v);
      }
    });
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const nextValue = target.value ?? "";
    this.textValue.set(nextValue);
    this.valueChange.emit(nextValue);
    this.onChangeFn(nextValue);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  clear(): void {
    this.textValue.set("");
    this.valueChange.emit("");
    this.onChangeFn("");
    this.cleared.emit();
  }

  writeValue(value: string | null | undefined): void {
    this.textValue.set(value ?? "");
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
