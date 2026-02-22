import { Directive, ElementRef, OnInit, DestroyRef, inject, output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent, map } from "rxjs";
import { TIMEOUTS } from "../../../core/constants";

@Directive({
  selector: "[appBirthdayInputSuggestion]",
})
export class BirthdayInputSuggestionDirective implements OnInit {
  inputTyped = output<string>();
  inputBlurred = output<void>();

  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);
  private retryCount = 0;
  private readonly maxRetries = 10;
  private listenersAttached = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.attachListeners();
    }, TIMEOUTS.UI_MICRO_DELAY);
  }

  private attachListeners(): void {
    if (this.listenersAttached) {
      return;
    }

    const hostElement = this.host.nativeElement;
    const datepickerWrapper = hostElement.querySelector(".p-datepicker, .p-calendar");
    const inputElement = datepickerWrapper
      ? (datepickerWrapper.querySelector("input") as HTMLInputElement | null)
      : (hostElement.querySelector("input") as HTMLInputElement | null);

    if (!inputElement) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount += 1;
        setTimeout(() => {
          this.attachListeners();
        }, TIMEOUTS.UI_MICRO_DELAY);
      }
      return;
    }

    this.listenersAttached = true;
    this.retryCount = 0;

    fromEvent(inputElement, "input")
      .pipe(
        map((event) => (event.target as HTMLInputElement).value.trim()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.inputTyped.emit(value);
      });

    fromEvent(inputElement, "blur")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.inputBlurred.emit();
      });
  }
}
