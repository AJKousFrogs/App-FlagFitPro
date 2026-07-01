/**
 * Defers an auto-scroll-to-bottom until the next `ngAfterViewChecked`, once
 * the DOM has actually laid out the newly-added content. Shared by chat
 * threads (1:1 Merlin chat, team chat) that append messages and want the
 * thread pinned to the latest one.
 */
export class ScrollToBottomController {
  private pending = false;

  /** Call when new content is appended; scrolls on the next view-checked pass. */
  request(): void {
    this.pending = true;
  }

  /** Call from `ngAfterViewChecked()` with the scrollable element. */
  flush(el: HTMLElement | undefined): void {
    if (!this.pending) return;
    this.pending = false;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
