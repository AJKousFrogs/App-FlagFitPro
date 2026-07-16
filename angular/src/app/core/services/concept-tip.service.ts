import { Injectable, inject, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { extractApiPayload } from "../utils/api-response-mapper";

/** One knowledge-base entry, trimmed to what a tooltip needs. */
interface KbEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  evidenceGrade?: string;
  sourceUrl?: string | null;
}

/** A concept the app can explain, resolved to a real KB entry. */
export interface ConceptTip {
  label: string;
  title: string;
  excerpt: string;
  entryId: string;
  evidenceGrade: string | null;
  query: string;
}

export type ConceptKey =
  | "readiness"
  | "acwr"
  | "rest"
  | "sleep"
  | "fueling"
  | "cycle-basics";

/**
 * Concept → how to find its KB entry. The keywords rank candidate entries; the
 * query is what the "Read more" deep-link searches for in Knowledge. Content is
 * NEVER written here — only the pointer. The explanation the athlete reads is the
 * KB entry itself (authored once, V3-DESIGN §3.6).
 */
const CONCEPTS: Record<
  ConceptKey,
  { label: string; keywords: string[]; query: string }
> = {
  readiness: {
    label: "Readiness",
    keywords: ["readiness", "recovery status", "wellness score"],
    query: "readiness",
  },
  acwr: {
    label: "Training load (ACWR)",
    keywords: [
      "acwr",
      "acute:chronic",
      "acute-to-chronic",
      "workload ratio",
      "workload",
    ],
    query: "acwr workload",
  },
  rest: {
    label: "Rest & recovery days",
    keywords: ["rest day", "active recovery", "recovery day", "deload"],
    query: "rest recovery",
  },
  sleep: {
    label: "Sleep",
    keywords: ["sleep"],
    query: "sleep",
  },
  fueling: {
    label: "Fuelling",
    keywords: ["carbohydrate", "carb", "fuel", "glycogen", "nutrition"],
    query: "carbohydrate fuelling",
  },
  "cycle-basics": {
    label: "Menstrual cycle & training",
    keywords: ["menstrual", "cycle", "period"],
    query: "menstrual cycle",
  },
};

/**
 * Serves short, KB-sourced explanations for info-glyph tooltips across the app.
 * Fetches the Merlin-approved knowledge base ONCE (cached), then resolves a
 * concept key to the best-matching real entry. If nothing matches, `resolve`
 * returns null — the tooltip then shows only a "learn more" link, never an
 * invented definition (Law #7).
 */
@Injectable({ providedIn: "root" })
export class ConceptTipService {
  private readonly api = inject(ApiService);

  /** The KB, fetched once when the first tooltip injects this service. */
  private readonly entries = signal<KbEntry[]>([]);

  constructor() {
    this.api.get<{ entries?: KbEntry[] }>("/api/knowledge/search").subscribe({
      next: (res) => {
        const d = extractApiPayload<{ entries?: KbEntry[] }>(res);
        this.entries.set(Array.isArray(d?.entries) ? d!.entries : []);
      },
      error: () => {
        /* leave entries empty → tooltips degrade to the "learn more" link */
      },
    });
  }

  /**
   * Resolve a concept to its best-matching KB entry. Pure over the `entries`
   * signal, so a caller that reads it inside a `computed` re-runs when the KB
   * loads. null until loaded, or when no entry matches (→ tooltip shows only the
   * deep-link, never an invented definition, Law #7).
   */
  resolve(key: ConceptKey): ConceptTip | null {
    const cfg = CONCEPTS[key];
    const list = this.entries();
    if (!list.length) return null;
    const entry = bestMatch(list, cfg.keywords);
    if (!entry) return null;
    return {
      label: cfg.label,
      title: entry.title,
      excerpt: excerpt(entry.content),
      entryId: entry.id,
      evidenceGrade: entry.evidenceGrade ?? null,
      query: cfg.query,
    };
  }

  /** The Knowledge deep-link query for a concept (available before KB loads). */
  queryFor(key: ConceptKey): string {
    return CONCEPTS[key].query;
  }
  labelFor(key: ConceptKey): string {
    return CONCEPTS[key].label;
  }
}

/** Rank entries: a title keyword hit beats a body hit; first wins on ties. */
function bestMatch(entries: KbEntry[], keywords: string[]): KbEntry | null {
  let bodyHit: KbEntry | null = null;
  for (const e of entries) {
    const title = (e.title ?? "").toLowerCase();
    const body = (e.content ?? "").toLowerCase();
    for (const k of keywords) {
      const kw = k.toLowerCase();
      if (title.includes(kw)) return e; // strongest signal
      if (!bodyHit && body.includes(kw)) bodyHit = e;
    }
  }
  return bodyHit;
}

/** First ~2 sentences / 220 chars of the entry, cleanly trimmed. */
function excerpt(content: string): string {
  const text = (content ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= 220) return text;
  const cut = text.slice(0, 220);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return (lastStop > 120 ? cut.slice(0, lastStop + 1) : cut.trimEnd()) + "…";
}
