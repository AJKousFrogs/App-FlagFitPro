import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface Entry {
  id: string;
  title: string;
  content: string;
  category: string;
  evidenceGrade?: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  speed: "Speed",
  power: "Power",
  strength: "Strength",
  agility: "Agility",
  skills: "Skills",
  protocols: "Protocols",
  "warm-up": "Warm-up",
  sleep: "Sleep",
  active_recovery: "Recovery",
  research: "Research",
  hamstring: "Hamstring",
  prevention: "Prevention",
  mental_preparation: "Mental",
  confidence: "Confidence",
  focus: "Focus",
  general: "General",
};

/**
 * Knowledge (athlete) — the evidence-based knowledge base behind Merlin, browsable
 * directly. GET /api/knowledge/search lists Merlin-approved entries; POST with a
 * query searches them. Each entry shows its evidence grade and a source link when
 * one exists. Category chips are derived from what's actually loaded (no guessing).
 */
@Component({
  selector: "app-knowledge",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./knowledge.component.html",
  styles: [
    `
      .search { display: flex; gap: var(--s-2); }
      .search input { flex: 1; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-pill); padding: var(--s-3) var(--s-4); color: var(--text-strong); font-family: var(--font-body); }
      .chips { display: flex; gap: var(--s-2); overflow-x: auto; padding-bottom: var(--s-1); }
      .entry { display: flex; flex-direction: column; gap: var(--s-2); }
      .entry h3 { margin: 0; font-size: var(--fs-h3); }
      .entry p { margin: 0; color: var(--text-muted); font-size: var(--fs-body); line-height: var(--lh-body); }
      .ev { font-size: var(--fs-xs); font-weight: var(--fw-bold); padding: 2px var(--s-2); border-radius: var(--r-pill);
        background: var(--surface-2); color: var(--text-faint); }
    `,
  ],
})
export class KnowledgeComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loaded = signal(false);
  readonly busy = signal(false);
  readonly query = signal("");
  readonly all = signal<Entry[]>([]);
  readonly activeCat = signal<string | null>(null);
  readonly searchMode = signal(false);

  readonly categories = computed(() => {
    const set = new Set(this.all().map((e) => e.category).filter(Boolean));
    return Array.from(set).sort();
  });
  readonly entries = computed(() => {
    const cat = this.activeCat();
    return cat ? this.all().filter((e) => e.category === cat) : this.all();
  });

  constructor() {
    this.browse();
  }

  private browse(): void {
    this.api.get<{ entries?: Entry[] }>("/api/knowledge/search").subscribe({
      next: (res) => {
        const d = extractApiPayload<{ entries?: Entry[] }>(res);
        this.all.set(Array.isArray(d?.entries) ? d!.entries : []);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  search(): void {
    const q = this.query().trim();
    if (this.busy()) return;
    if (!q) {
      this.searchMode.set(false);
      this.activeCat.set(null);
      this.browse();
      return;
    }
    this.busy.set(true);
    this.activeCat.set(null);
    this.api.post<{ results?: Entry[] }>("/api/knowledge/search", { query: q, limit: 20 }).subscribe({
      next: (res) => {
        const d = extractApiPayload<{ results?: Entry[] }>(res);
        this.all.set(Array.isArray(d?.results) ? d!.results : []);
        this.searchMode.set(true);
        this.busy.set(false);
        this.loaded.set(true);
      },
      error: (e) => {
        this.logger.error("knowledge_search_failed", e);
        this.busy.set(false);
      },
    });
  }

  toggleCat(cat: string): void {
    this.activeCat.set(this.activeCat() === cat ? null : cat);
  }
  label(cat: string): string {
    return CATEGORY_LABELS[cat] ?? cat.replace(/[_-]/g, " ");
  }
}
