import { ChangeDetectionStrategy, Component } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

/**
 * Merlin — the context-aware AI coach. Ported 1:1 from
 * redesign/ground-zero/02-hifi/chat.html. The conversation input is intentionally
 * disabled: the real path is POST /api/ai/process-command, gated on AI consent
 * (ai_processing_enabled) with context = injuries, ACWR, today's sessions,
 * wellness, schedule — wired in a later AI step. We show an honest welcome, not a
 * faked exchange.
 */
@Component({
  selector: "app-chat",
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./chat.component.html",
  styles: [
    `
      .thread { display: flex; flex-direction: column; gap: 10px; }
      .bubble { max-width: 80%; padding: 10px 14px; border-radius: var(--r-lg); }
      .me { background: var(--accent); color: var(--on-accent); align-self: flex-end; border-bottom-right-radius: 4px; }
      .ai { background: var(--surface-2); align-self: flex-start; border-bottom-left-radius: 4px; }
      .composer { margin-top: auto; }
      .composer input { flex: 1; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-pill); padding: 12px 14px; color: var(--text-faint); font-family: var(--font-body); }
    `,
  ],
})
export class ChatComponent {}
