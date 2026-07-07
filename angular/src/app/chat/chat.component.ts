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
import { InjuryService, InjurySeverity } from "../core/services/injury.service";

// Lightweight tightness detector: "my achilles is tight" → {region, severity}.
// Deterministic; fires the self-report loop alongside Merlin's normal reply.
const TIGHT_REGIONS: { re: RegExp; region: string }[] = [
  { re: /achill/i, region: "achilles" },
  { re: /calf|calves|gastroc/i, region: "calf" },
  { re: /hamstring/i, region: "hamstring" },
  { re: /quad/i, region: "quad" },
  { re: /groin|adductor/i, region: "groin" },
  { re: /\bhip/i, region: "hip" },
  { re: /\bknee/i, region: "knee" },
  { re: /ankle/i, region: "ankle" },
  { re: /shin/i, region: "shin" },
  { re: /glute/i, region: "glute" },
  { re: /lower back|low back|\bback\b/i, region: "lower back" },
  { re: /shoulder/i, region: "shoulder" },
];
const TIGHT_KEYWORDS =
  /\b(tight|tightness|sore|soreness|stiff|niggl|strain|cramp|hurts?|hurting|painful|pain)\b/i;

export function parseTightness(
  text: string,
): { region: string; severity: InjurySeverity } | null {
  if (!TIGHT_KEYWORDS.test(text)) return null;
  for (const { re, region } of TIGHT_REGIONS) {
    if (re.test(text)) {
      let severity: InjurySeverity = "minor";
      if (
        /\b(severe|really bad|very bad|killing|can'?t walk|can'?t run|sharp)\b/i.test(
          text,
        )
      ) {
        severity = "severe";
      } else if (/\b(quite|pretty|very|bad|really)\b/i.test(text)) {
        severity = "moderate";
      }
      return { region, severity };
    }
  }
  return null;
}

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
  imports: [AvatarComponent, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./chat.component.html",
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100dvh;
      }
      main.screen {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .thread {
        display: flex;
        flex-direction: column;
        gap: var(--s-3);
        overflow-y: auto;
        flex: 1;
        padding-bottom: var(--s-2);
      }
      .bubble {
        max-width: 85%;
        padding: var(--s-3) var(--s-4);
        border-radius: var(--r-lg);
        white-space: pre-wrap;
        line-height: var(--lh-body);
      }
      .me {
        background: var(--accent);
        color: var(--on-accent);
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .ai {
        background: var(--surface-2);
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .ai.blocked {
        border: 1px solid var(--danger);
      }
      .disc {
        font-size: var(--fs-sm);
        color: var(--text-faint);
        align-self: flex-start;
        max-width: 85%;
        margin: calc(-1 * var(--s-1)) 0 2px;
      }
      .acts {
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-2);
        align-self: flex-start;
      }
      .typing {
        align-self: flex-start;
        color: var(--text-faint);
        font-size: var(--fs-sm);
      }
      .composer {
        margin-top: auto;
      }
      .composer input {
        flex: 1;
        background: var(--surface-2);
        border: 1px solid var(--border-soft);
        border-radius: var(--r-pill);
        padding: var(--s-3) var(--s-4);
        color: var(--text-strong);
        font-family: var(--font-body);
      }
      .composer input:disabled {
        color: var(--text-faint);
      }
      .fb {
        display: flex;
        gap: var(--s-1);
        align-self: flex-start;
        margin-top: calc(-1 * var(--s-1));
      }
      .fb-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 1px solid var(--border-soft);
        border-radius: var(--r-md);
        background: transparent;
        color: var(--text-faint);
        cursor: pointer;
      }
      .fb-btn:hover {
        color: var(--text-strong);
        border-color: var(--border-strong);
      }
      .fb-done {
        align-self: flex-start;
        font-size: var(--fs-sm);
        color: var(--text-faint);
        margin-top: calc(-1 * var(--s-1));
      }
    `,
  ],
})
export class ChatComponent implements AfterViewChecked {
  private readonly ai = inject(AIService);
  private readonly privacy = inject(PrivacySettingsService);
  private readonly router = inject(Router);
  private readonly injury = inject(InjuryService);

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

    // Self-report loop: if the athlete reports tightness, log it (which makes the
    // engine pull sprint/high-intensity work off that region) and confirm — in
    // addition to Merlin's normal coaching reply.
    const tight = parseTightness(text);
    if (tight) {
      this.injury
        .report(tight.region, tight.severity)
        .then(() => {
          const grade =
            tight.severity === "minor"
              ? "tightness"
              : `${tight.severity} tightness`;
          this.turns.update((t) => [
            ...t,
            {
              role: "ai",
              text: `Logged your ${tight.region} ${grade} — I've pulled sprint/high-intensity work off it in today's plan. You'll see it adjusted on Today.`,
            },
          ]);
          this.autoScroll = true;
        })
        .catch(() => {
          this.turns.update((t) => [
            ...t,
            {
              role: "ai",
              text: "I couldn't log that tightness just now — try the Wellness → Niggles & tightness form so your plan adjusts.",
            },
          ]);
          this.autoScroll = true;
        });
    }

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
