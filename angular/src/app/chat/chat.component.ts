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
      .thread { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; padding-bottom: 8px; }
      .bubble { max-width: 85%; padding: 10px 14px; border-radius: var(--r-lg); white-space: pre-wrap; line-height: 1.5; }
      .me { background: var(--accent); color: var(--on-accent); align-self: flex-end; border-bottom-right-radius: 4px; }
      .ai { background: var(--surface-2); align-self: flex-start; border-bottom-left-radius: 4px; }
      .ai.blocked { border: 1px solid var(--danger); }
      .disc { font-size: var(--fs-sm); color: var(--text-faint); align-self: flex-start; max-width: 85%; margin: -4px 0 2px; }
      .acts { display: flex; flex-wrap: wrap; gap: 8px; align-self: flex-start; }
      .typing { align-self: flex-start; color: var(--text-faint); font-size: var(--fs-sm); }
      .composer { margin-top: auto; }
      .composer input { flex: 1; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-pill); padding: 12px 14px; color: var(--text-strong); font-family: var(--font-body); }
      .composer input:disabled { color: var(--text-faint); }
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
  readonly aiEnabled = this.privacy.aiProcessingEnabled;
  readonly canSend = computed(
    () => this.aiEnabled() && !this.busy() && this.draft().trim().length > 0,
  );

  private sessionId: string | null = null;
  private autoScroll = false;

  constructor() {
    // Refresh privacy settings so the consent gate reflects reality (the signal
    // defaults to enabled; loadSettings corrects it for opted-out athletes).
    void this.privacy.loadSettings().catch(() => null);
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
}
