import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { SupabaseService } from "../core/services/supabase.service";
import { ageYearsFromUserMetadata } from "../core/utils/age-years.util";
import { CycleService, type CycleApiProfile } from "./cycle.service";
import { estimateCycle, type CycleLog, type CycleProfile } from "./cycle.logic";

/** Consent copy is versioned in-repo; bump on any material change (DPIA record). */
export const CYCLE_CONSENT_VERSION = "2026-07-16.v1";

const SYMPTOMS: { id: string; label: string }[] = [
  { id: "cramps", label: "Cramps" },
  { id: "fatigue", label: "Fatigue" },
  { id: "headache", label: "Headache" },
  { id: "bloating", label: "Bloating" },
  { id: "low_mood", label: "Low mood" },
  { id: "cravings", label: "Cravings" },
  { id: "back_pain", label: "Back pain" },
  { id: "breast_tenderness", label: "Breast tenderness" },
];
const FLOWS = ["spotting", "light", "medium", "heavy"] as const;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Cycle module (v3 M3). Private to the athlete — no staff surface exists. Off by
 * default; enabling records explicit, versioned consent. U18 is force-disabled.
 * The phase advisory is INFORM-only (never a training instruction) and computed
 * on the client via the pure `estimateCycle` (the server never computes/stores a
 * phase). Cycle data never enters the training engine.
 */
@Component({
  selector: "app-cycle",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: "./cycle.component.html",
  styleUrl: "./cycle.component.scss",
})
export class CycleComponent {
  private readonly svc = inject(CycleService);
  private readonly supabase = inject(SupabaseService);

  readonly symptomOptions = SYMPTOMS;
  readonly flows = FLOWS;
  readonly consentVersion = CYCLE_CONSENT_VERSION;

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly profile = signal<CycleApiProfile | null>(null);
  readonly logs = signal<CycleLog[]>([]);
  readonly wipeConfirm = signal("");

  // today's log editor
  readonly todayFlow = signal<string | null>(null);
  readonly todaySymptoms = signal<Set<string>>(new Set());

  readonly isYouth = computed(() => {
    const a = ageYearsFromUserMetadata(
      this.supabase.currentUser()?.user_metadata,
    );
    return a != null && a < 18;
  });
  readonly enabled = computed(() => this.profile()?.enabled === true);

  private readonly logicProfile = computed<CycleProfile>(() => {
    const p = this.profile();
    return {
      enabled: p?.enabled ?? false,
      hormonalContraception: p?.hormonalContraception ?? false,
      adaptationLevel: p?.adaptationLevel ?? "inform",
      typicalCycleLength: p?.typicalCycleLength ?? null,
      typicalPeriodLength: p?.typicalPeriodLength ?? null,
    };
  });

  readonly estimate = computed(() =>
    estimateCycle(this.logs(), this.logicProfile(), todayIso()),
  );

  readonly recentLogs = computed(() =>
    [...this.logs()].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30),
  );

  constructor() {
    if (!this.isYouth()) this.refresh();
    else this.loading.set(false);
  }

  private refresh(): void {
    this.loading.set(true);
    this.svc.get().subscribe((d) => {
      this.profile.set(d.profile);
      this.logs.set(d.logs);
      // hydrate today's editor from an existing log
      const t = d.logs.find((l) => l.date === todayIso());
      this.todayFlow.set(t?.flow ?? null);
      this.todaySymptoms.set(new Set(t?.symptoms ?? []));
      this.loading.set(false);
    });
  }

  enable(): void {
    if (this.busy() || this.isYouth()) return;
    this.busy.set(true);
    this.svc
      .saveProfile({
        enabled: true,
        adaptationLevel: "inform",
        hormonalContraception: false,
        consentVersion: this.consentVersion,
      })
      .subscribe((p) => {
        this.busy.set(false);
        if (p) this.profile.set(p);
      });
  }

  toggleContraception(): void {
    const p = this.profile();
    if (!p || this.busy()) return;
    this.busy.set(true);
    this.svc
      .saveProfile({ ...p, hormonalContraception: !p.hormonalContraception })
      .subscribe((np) => {
        this.busy.set(false);
        if (np) this.profile.set(np);
      });
  }

  setTypical(field: "cycle" | "period", value: number | null): void {
    const p = this.profile();
    if (!p) return;
    const patch =
      field === "cycle"
        ? { typicalCycleLength: value }
        : { typicalPeriodLength: value };
    this.svc.saveProfile({ ...p, ...patch }).subscribe((np) => {
      if (np) this.profile.set(np);
    });
  }

  pickFlow(flow: string): void {
    this.todayFlow.set(this.todayFlow() === flow ? null : flow);
  }
  toggleSymptom(id: string): void {
    this.todaySymptoms.update((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  saveToday(): void {
    if (this.busy()) return;
    this.busy.set(true);
    const log: CycleLog = {
      date: todayIso(),
      flow: (this.todayFlow() as CycleLog["flow"]) ?? null,
      symptoms: [...this.todaySymptoms()],
    };
    this.svc.saveLog(log).subscribe((saved) => {
      this.busy.set(false);
      if (saved) {
        this.logs.update((ls) => [
          saved,
          ...ls.filter((l) => l.date !== saved.date),
        ]);
      }
    });
  }

  deleteLog(date: string): void {
    this.svc.deleteLog(date).subscribe((ok) => {
      if (ok) this.logs.update((ls) => ls.filter((l) => l.date !== date));
    });
  }

  wipe(): void {
    if (this.wipeConfirm().trim().toUpperCase() !== "DELETE" || this.busy())
      return;
    this.busy.set(true);
    this.svc.wipe().subscribe((ok) => {
      this.busy.set(false);
      if (ok) {
        this.profile.set(null);
        this.logs.set([]);
        this.wipeConfirm.set("");
      }
    });
  }
}
