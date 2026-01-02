import {
  Component,
  input,
  output,
  forwardRef,
  signal,
  computed,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  inject,
} from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

/**
 * Rich Text Editor Component - Angular 21
 *
 * A rich text editor component using contenteditable
 * Uses Angular 21 signals and ControlValueAccessor for form integration
 */
@Component({
  selector: "app-rich-text",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextComponent),
      multi: true,
    },
  ],
  template: `
    <div class="rich-text-group">
      @if (label()) {
        <label class="form-label">{{ label() }}</label>
      }
      <div class="rich-text-editor">
        <div
          class="rich-text-toolbar"
          role="toolbar"
          [attr.aria-label]="label() || 'Text formatting'"
        >
          <button
            type="button"
            class="toolbar-btn"
            [class.active]="isCommandActive('bold')"
            (click)="executeCommand('bold')"
            aria-label="Bold"
          >
            <i class="pi pi-bold" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="toolbar-btn"
            [class.active]="isCommandActive('italic')"
            (click)="executeCommand('italic')"
            aria-label="Italic"
          >
            <i class="pi pi-italic" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="toolbar-btn"
            [class.active]="isCommandActive('underline')"
            (click)="executeCommand('underline')"
            aria-label="Underline"
          >
            <i class="pi pi-underline" aria-hidden="true"></i>
          </button>
          <div class="toolbar-separator"></div>
          <button
            type="button"
            class="toolbar-btn"
            [class.active]="isCommandActive('insertUnorderedList')"
            (click)="executeCommand('insertUnorderedList')"
            aria-label="Bullet list"
          >
            <i class="pi pi-list" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="toolbar-btn"
            [class.active]="isCommandActive('insertOrderedList')"
            (click)="executeCommand('insertOrderedList')"
            aria-label="Numbered list"
          >
            <i class="pi pi-list-ordered" aria-hidden="true"></i>
          </button>
          <div class="toolbar-separator"></div>
          <button
            type="button"
            class="toolbar-btn"
            (click)="createLink()"
            aria-label="Insert link"
          >
            <i class="pi pi-link" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="toolbar-btn"
            (click)="executeCommand('formatBlock', 'h2')"
            aria-label="Heading"
          >
            <i class="pi pi-heading" aria-hidden="true"></i>
          </button>
        </div>
        <div
          #contentEditable
          class="rich-text-content"
          contenteditable="true"
          [attr.aria-label]="label() || 'Rich text editor'"
          [attr.aria-multiline]="true"
          [attr.spellcheck]="spellcheck()"
          (input)="onInput()"
          (blur)="onBlur()"
          [innerHTML]="sanitizedValue()"
        ></div>
      </div>
      @if (helpText() && !errorMessage()) {
        <div class="form-help">{{ helpText() }}</div>
      }
      @if (errorMessage()) {
        <div class="form-error" role="alert">{{ errorMessage() }}</div>
      }
    </div>
  `,
  styleUrl: './rich-text.component.scss',
})
export class RichTextComponent implements ControlValueAccessor {
  private sanitizer = inject(DomSanitizer);

  contentEditable = viewChild<ElementRef<HTMLDivElement>>("contentEditable");

  // Configuration
  id = input<string>(`rich-text-${Math.random().toString(36).substr(2, 9)}`);
  label = input<string>();
  helpText = input<string>();
  errorMessage = input<string>();
  disabled = input<boolean>(false);
  spellcheck = input<boolean>(true);

  // Value signal
  value = signal<string>("");
  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  // Sanitized HTML for safe rendering
  sanitizedValue = computed<SafeHtml>(() => {
    const rawValue = this.value();
    // Sanitize HTML to prevent XSS attacks
    return this.sanitizer.bypassSecurityTrustHtml(this.sanitizeHtml(rawValue));
  });

  // Events
  changed = output<string>();

  /**
   * Basic HTML sanitization - allows only safe formatting tags
   * Strips potentially dangerous elements like script, iframe, etc.
   */
  private sanitizeHtml(html: string): string {
    if (!html) return "";

    // Create a temporary element to parse HTML
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Remove potentially dangerous elements
    const dangerousTags = [
      "script",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
    ];
    dangerousTags.forEach((tag) => {
      const elements = temp.getElementsByTagName(tag);
      while (elements.length > 0) {
        elements[0].parentNode?.removeChild(elements[0]);
      }
    });

    // Remove event handlers from all elements
    const allElements = temp.getElementsByTagName("*");
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        if (
          attr.name.startsWith("on") ||
          (attr.name === "href" && attr.value.startsWith("javascript:"))
        ) {
          el.removeAttribute(attr.name);
        }
      });
    }

    return temp.innerHTML;
  }

  onInput(): void {
    const element = this.contentEditable()?.nativeElement;
    if (element) {
      const html = element.innerHTML;
      this.value.set(html);
      this.onChangeFn(html);
      this.changed.emit(html);
    }
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  executeCommand(command: string, value?: string): void {
    document.execCommand(command, false, value || undefined);
    this.onInput();
  }

  isCommandActive(command: string): boolean {
    return document.queryCommandState(command);
  }

  createLink(): void {
    const url = prompt("Enter URL:");
    if (url) {
      this.executeCommand("createLink", url);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value.set(value || "");
    const element = this.contentEditable()?.nativeElement;
    if (element && value) {
      element.innerHTML = value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    const element = this.contentEditable()?.nativeElement;
    if (element) {
      element.contentEditable = isDisabled ? "false" : "true";
    }
  }
}
