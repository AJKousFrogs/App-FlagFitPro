import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from "@angular/core";

let nextFormInputId = 0;

/**
 * Minimal labelled text input used by the auth pages
 * (the smoke suite selects `app-form-input input`).
 */
@Component({
  selector: "app-form-input",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <label class="form-label" [for]="id">{{ label() }}</label>
    }
    <input
      [id]="id"
      [type]="type()"
      [placeholder]="placeholder()"
      [attr.aria-label]="label() || placeholder()"
      [value]="value()"
      (input)="value.set($any($event.target).value)"
      autocomplete="off"
    />
  `,
  styles: [
    `
      :host {
        display: block;
        margin: var(--s-2) 0;
      }
      .form-label {
        display: block;
        font-size: var(--fs-sm);
        color: var(--text-muted);
        margin-bottom: var(--s-1);
      }
      input {
        width: 100%;
        background: var(--surface-2);
        border: 1px solid var(--border-soft);
        border-radius: var(--r-sm);
        padding: var(--s-3);
        color: var(--text-strong);
        font-family: var(--font-body);
      }
    `,
  ],
})
export class FormInputComponent {
  readonly id = `form-input-${nextFormInputId++}`;
  readonly label = input("");
  readonly type = input("text");
  readonly placeholder = input("");
  readonly value = model("");
}
