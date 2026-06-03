import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import {
  Channel,
  ChannelService,
  ChatMessage,
} from "../core/services/channel.service";
import { SupabaseService } from "../core/services/supabase.service";
import { LoggerService } from "../core/services/logger.service";

/**
 * Team chat — a real team channel (the read/write side of ChannelService:
 * channels, messages, realtime, send). Built but intentionally NOT promoted in
 * the nav: the squad lives on WhatsApp, so this is available, not pushed. Picks
 * the team's default channel, streams messages live, and posts via
 * ChannelService.sendMessage. Honest empty state when there's no team/channel.
 */
@Component({
  selector: "app-team-chat",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./team-chat.component.html",
  styles: [
    `
      :host { display: flex; flex-direction: column; min-height: 100dvh; }
      main.screen { flex: 1; display: flex; flex-direction: column; }
      .chans { display: flex; gap: var(--s-2); overflow-x: auto; padding-bottom: var(--s-1); }
      .thread { display: flex; flex-direction: column; gap: var(--s-3); overflow-y: auto; flex: 1; padding: var(--s-1) 0 var(--s-2); }
      .msg { display: flex; gap: var(--s-3); max-width: 92%; }
      .msg.me { align-self: flex-end; flex-direction: row-reverse; }
      .ava { width: 30px; height: 30px; border-radius: var(--r-pill); flex: 0 0 auto; object-fit: cover;
        display: grid; place-items: center; background: var(--surface-2); color: var(--text-faint);
        font-size: var(--fs-xs); font-weight: var(--fw-bold); }
      .body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .meta { font-size: var(--fs-xs); color: var(--text-faint); display: flex; gap: var(--s-2); }
      .msg.me .meta { justify-content: flex-end; }
      .bubble { padding: var(--s-2) var(--s-3); border-radius: var(--r-lg); white-space: pre-wrap; word-break: break-word; line-height: var(--lh-body); }
      .msg:not(.me) .bubble { background: var(--surface-2); border-bottom-left-radius: 4px; }
      .msg.me .bubble { background: var(--accent); color: var(--on-accent); border-bottom-right-radius: 4px; }
      .composer { margin-top: auto; }
      .composer input { flex: 1; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-pill); padding: var(--s-3) var(--s-4); color: var(--text-strong); font-family: var(--font-body); }
    `,
  ],
})
export class TeamChatComponent implements AfterViewChecked, OnDestroy {
  private readonly channels = inject(ChannelService);
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  private readonly threadEl = viewChild<ElementRef<HTMLElement>>("thread");
  private unsubscribe: (() => void) | null = null;
  private autoScroll = false;

  readonly loaded = signal(false);
  readonly channelList = signal<Channel[]>([]);
  readonly current = signal<Channel | null>(null);
  readonly draft = signal("");
  readonly busy = signal(false);

  readonly messages = this.channels.messages;
  private readonly myId = computed(() => this.supabase.currentUser()?.id ?? null);
  readonly canSend = computed(
    () => !!this.current() && !this.busy() && this.draft().trim().length > 0,
  );

  constructor() {
    void this.boot();
  }

  private async boot(): Promise<void> {
    try {
      const channels = await this.channels.loadChannels();
      const postable = channels.filter((c) => !c.is_archived);
      this.channelList.set(postable);
      const def =
        postable.find((c) => c.is_default) ??
        postable.find((c) => c.channel_type === "team_general") ??
        postable[0] ??
        null;
      if (def) await this.open(def);
    } catch (err) {
      this.logger.error("team_chat_boot_failed", err);
    } finally {
      this.loaded.set(true);
    }
  }

  async open(channel: Channel): Promise<void> {
    if (this.current()?.id === channel.id) return;
    this.unsubscribe?.();
    this.current.set(channel);
    this.autoScroll = true;
    try {
      await this.channels.selectChannel(channel);
      this.unsubscribe = this.channels.subscribeToChannelMessages(channel.id, () => {
        this.autoScroll = true;
      });
    } catch (err) {
      this.logger.error("team_chat_open_failed", err);
    }
  }

  mine(m: ChatMessage): boolean {
    return !!this.myId() && m.sender_id === this.myId();
  }
  initials(name: string | undefined): string {
    return (name ?? "?")
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  time(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  send(): void {
    const text = this.draft().trim();
    const channel = this.current();
    if (!text || !channel || this.busy()) return;
    this.busy.set(true);
    this.channels
      .sendMessage({ channel_id: channel.id, message: text, team_id: channel.team_id ?? undefined })
      .then(() => {
        this.draft.set("");
        this.autoScroll = true;
      })
      .catch((err) => this.logger.error("team_chat_send_failed", err))
      .finally(() => this.busy.set(false));
  }

  ngAfterViewChecked(): void {
    if (!this.autoScroll) return;
    this.autoScroll = false;
    const el = this.threadEl()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.channels.clearState();
  }
}
