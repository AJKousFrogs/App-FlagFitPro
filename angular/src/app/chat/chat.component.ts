import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";
import { AIService, MerlinSuggestedAction } from "../core/services/ai.service";
import { PrivacySettingsService } from "../core/services/privacy-settings.service";

interface Turn {
  role: "me" | "ai";
  text: string;
  disclaimer?: string | null;
  actions?: MerlinSuggestedAction[];
  blocked?: boolean;
  /** ai_messages row id for an AI turn — enables thumbs-up/down feedback. */
  messageId?: string | null;
  /** The athlete's feedback on this AI turn, once given. */
  feedback?: "up" | "down";
}

/**
 * Merlin — the context-aware AI coach, wired to POST /api/ai/chat. The endpoint
 * builds the athlete's context server-side (injuries, ACWR, today's sessions,
 * wellness, schedule), applies the safety tiers + ACWR override, and returns the
 * answer plus suggested actions. AI-consent-gated (GDPR Art. 22): when AI
 * processing is off we keep the composer disabled and point to Settings → Privacy
 * rather than calling the model.
 */
@Component({
  selector: "app-chat",
  standalone: true,
  imports: [AvatarComponent, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./chat.component.html",
  styles: [
    `
      :host { display: flex; flex-direction: column; min-height: 100dvh; }
      main.screen { flex: 1; display: flex; flex-direction: column; }
      .thread { display: flex; flex-direction: column; gap: var(--s-3); overflow-y: auto; flex: 1; padding-bottom: var(--s-2); }
      .bubble { max-width: 85%; padding: var(--s-3) var(--s-4); border-radius: var(--r-lg); white-space: pre-wrap; line-height: var(--lh-body); }
      .me { background: var(--accent); color: var(--on-accent); align-self: flex-end; border-bottom-right-radius: 4px; }
      .ai { background: var(--surface-2); align-self: flex-start; border-bottom-left-radius: 4px; }
      .ai.blocked { border: 1px solid var(--danger); }
      .disc { font-size: var(--fs-sm); color: var(--text-faint); align-self: flex-start; max-width: 85%; margin: calc(-1 * var(--s-1)) 0 2px; }
      .acts { display: flex; flex-wrap: wrap; gap: var(--s-2); align-self: flex-start; }
      .typing { align-self: flex-start; color: var(--text-faint); font-size: var(--fs-sm); }
      .composer { margin-top: auto; }
      .composer input { flex: 1; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-pill); padding: var(--s-3) var(--s-4); color: var(--text-strong); font-family: var(--font-body); }
      .composer input:disabled { color: var(--text-faint); }
      .fb { display: flex; gap: var(--s-1); align-self: flex-start; margin-top: calc(-1 * var(--s-1)); }
      .fb-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px;
        border: 1px solid var(--border-soft); border-radius: var(--r-md); background: transparent;
        color: var(--text-faint); cursor: pointer; }
      .fb-btn:hover { color: var(--text-strong); border-color: var(--border-strong); }
      .fb-done { align-self: flex-start; font-size: var(--fs-sm); color: var(--text-faint); margin-top: calc(-1 * var(--s-1)); }
    `,
  ],
})
export class ChatComponent implements AfterViewChecked {
  private readonly ai = inject(AIService);
  private readonly privacy = inject(PrivacySettingsService);
  private readonly router = inject(Router);

  private readonly threadEl = viewChild<ElementRef<HTMLElement>>("thread");

  readonly turns = signal<Turn[]>([]);
  readonly draft = signal("");
  readonly busy = signal(false);
  readonly prefsLoaded = signal(false);
  readonly aiEnabled = this.privacy.aiProcessingEnabled;
  readonly canSend = computed(
    () => this.aiEnabled() && !this.busy() && this.draft().trim().length > 0,
  );

  private sessionId: string | null = null;
  private autoScroll = false;

  constructor() {
    // Refresh privacy settings so the consent gate reflects reality (the signal
    // defaults to enabled; loadSettings corrects it for opted-out athletes). Until
    // it resolves we hold the composer in a neutral disabled state — never flash an
    // enabled input that lets the user type before the consent check completes.
    void this.privacy
      .loadSettings()
      .catch(() => null)
      .finally(() => this.prefsLoaded.set(true));
  }

  ngAfterViewChecked(): void {
    if (!this.autoScroll) return;
    this.autoScroll = false;
    const el = this.threadEl()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.busy() || !this.aiEnabled()) return;

    this.turns.update((t) => [...t, { role: "me", text }]);
    this.draft.set("");
    this.busy.set(true);
    this.autoScroll = true;

    this.ai.sendMessage(text, this.sessionId).subscribe({
      next: (reply) => {
        this.sessionId = reply.chatSessionId ?? this.sessionId;
        this.turns.update((t) => [
          ...t,
          {
            role: "ai",
            text: reply.answer,
            disclaimer: reply.disclaimer,
            actions: reply.suggestedActions,
            blocked: reply.isBlocked,
            messageId: reply.messageId,
          },
        ]);
        this.busy.set(false);
        this.autoScroll = true;
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error && /consent|disabled/i.test(err.message)
            ? "AI processing is off. Enable it in Settings → Privacy to chat with Merlin."
            : "Merlin couldn't answer just now — try again in a moment.";
        this.turns.update((t) => [...t, { role: "ai", text: message }]);
        this.busy.set(false);
        this.autoScroll = true;
      },
    });
  }

  runAction(action: MerlinSuggestedAction): void {
    const route = action.route ?? action.action;
    if (route && typeof route === "string" && route.startsWith("/")) {
      void this.router.navigateByUrl(route);
    }
  }

  /**
   * Record thumbs-up/down on a Merlin answer. Optimistically marks the turn, reverts
   * if the POST fails. No-op if the turn has no messageId or was already rated.
   */
  rate(index: number, helpful: boolean): void {
    const turn = this.turns()[index];
    if (!turn || turn.role !== "ai" || !turn.messageId || turn.feedback) return;
    const vote: "up" | "down" = helpful ? "up" : "down";
    const messageId = turn.messageId;
    this.turns.update((t) =>
      t.map((x, i) => (i === index ? { ...x, feedback: vote } : x)),
    );
    this.ai.submitResponseFeedback(messageId, helpful).subscribe({
      error: () => {
        this.turns.update((t) =>
          t.map((x, i) => (i === index ? { ...x, feedback: undefined } : x)),
        );
      },
    });
  }
}
