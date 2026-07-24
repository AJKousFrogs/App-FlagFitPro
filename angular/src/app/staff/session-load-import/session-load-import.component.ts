import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../../core/services/api.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";

type Provider = "catapult" | "statsports" | "manual";

// Mirrors session-load-import-csv.js's MAX_CSV_BYTES — reject oversized files
// client-side instead of waiting for a 422 round trip.
const MAX_CSV_BYTES = 2 * 1024 * 1024;

interface ImportFailure {
  index: number | null;
  reason: string;
  externalAthleteId?: string | null;
  sessionId?: string;
}

interface ImportResult {
  provider: string;
  received: number;
  imported: number;
  failedCount: number;
  failed: ImportFailure[];
  partial: boolean;
  idempotentKey: string;
}

/**
 * Session-load CSV import (coach-facing) — closes the "session-load-import.js
 * + session-load-import-csv.js have no Angular caller" gap
 * (docs/SOURCE_OF_TRUTH.md §4a/§4b, 2026-07-24/25). Distinct from
 * external-load.js (the athlete's own /device-data self-logger) and the Apple
 * Health XML path — this is the vendor-CSV / manual-spreadsheet bulk import.
 *
 * All the real logic — provider dispatch, device<->athlete pairing, the
 * callerWritableAthletes() authority gate, the idempotent upsert — lives once
 * in utils/session-load-import-core.js (CLAUDE.md §4). This component is a
 * thin file-read + POST + honest failure display: every row the backend
 * couldn't import is listed, never silently dropped (matches the endpoint's
 * own "the import never silently advances" contract).
 */
@Component({
  selector: "app-session-load-import",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: "./session-load-import.component.html",
  styleUrl: "./session-load-import.component.scss",
})
export class SessionLoadImportComponent {
  private readonly api = inject(ApiService);

  readonly provider = signal<Provider>("manual");
  readonly fileName = signal<string | null>(null);
  readonly csvText = signal<string | null>(null);

  readonly importing = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<ImportResult | null>(null);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    this.error.set(null);
    this.result.set(null);

    if (file.size > MAX_CSV_BYTES) {
      this.error.set(
        `That file is too large (${Math.round(file.size / 1024)}KB) — the import caps at ${MAX_CSV_BYTES / 1024 / 1024}MB.`,
      );
      this.fileName.set(null);
      this.csvText.set(null);
      return;
    }

    this.fileName.set(file.name);
    this.csvText.set(await file.text());
  }

  async import(): Promise<void> {
    const csv = this.csvText();
    if (!csv) {
      this.error.set("Choose a CSV file first.");
      return;
    }
    this.importing.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.post<ImportResult>("/api/session-load-import/csv", {
          provider: this.provider(),
          csv,
        }),
      );
      const data = extractApiPayload<ImportResult>(res);
      if (!data) {
        throw new Error("Import failed");
      }
      this.result.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : "Import failed");
      this.result.set(null);
    } finally {
      this.importing.set(false);
    }
  }

  reset(): void {
    this.fileName.set(null);
    this.csvText.set(null);
    this.result.set(null);
    this.error.set(null);
  }

  failureLabel(f: ImportFailure): string {
    const where =
      f.index != null ? `Row ${f.index + 1}` : f.sessionId ? `Session ${f.sessionId}` : "Row";
    return `${where}: ${f.reason}`;
  }
}
