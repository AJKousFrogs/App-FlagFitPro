import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { firstValueFrom } from "rxjs";

import { AvatarComponent } from "../shared/avatar.component";
import { ApiService } from "../core/services/api.service";
import { SupabaseService } from "../core/services/supabase.service";
import { LoggerService } from "../core/services/logger.service";
import { IdentityService } from "../core/services/identity.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface ProfileRead {
  heightCm?: number | null;
  weightKg?: number | null;
  birthDate?: string | null;
  position?: string | null;
}

/**
 * Edit profile — identity & physicals. Reuses the canonical save endpoint that
 * onboarding uses (POST /api/player-settings), which writes position / jersey /
 * height / weight / birth date to athlete_training_config and the users table.
 * Those feed the readiness/ACWR/age-recovery calculations, so keeping them
 * editable matters. Photo upload reuses the Settings pattern (POST /api/upload
 * → avatar_url on the auth user).
 */
@Component({
  selector: "app-profile-edit",
  standalone: true,
  imports: [AvatarComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div>
        <div class="eyebrow">Your profile</div>
        <h1>Edit profile</h1>
      </div>
      <button
        class="icon-btn"
        type="button"
        aria-label="Back"
        (click)="cancel()"
      >
        <lucide-icon name="x" />
      </button>
    </header>

    <main class="screen">
      <!-- photo -->
      <div class="card row">
        <span class="avatar lg"><app-avatar /></span>
        <div class="stack" style="gap:var(--s-2);flex:1">
          <b>Profile photo</b>
          <div class="inline">
            <label class="btn secondary sm">
              <lucide-icon name="camera" />
              {{ photoBusy() ? "Uploading…" : "Change photo" }}
              <input
                type="file"
                accept="image/*"
                hidden
                (change)="onPhoto($event)"
              />
            </label>
            @if (photoMsg(); as m) {
              <small class="muted">{{ m }}</small>
            }
          </div>
        </div>
      </div>

      <div class="card stack">
        <p class="lbl" style="margin:0">Position</p>
        <div class="chiprow">
          @for (p of positions; track p) {
            <button
              type="button"
              class="chip"
              [class.sel]="position() === p"
              (click)="position.set(p)"
            >
              {{ p }}
            </button>
          }
        </div>

        <div class="grid2">
          <div>
            <label class="lbl" for="pe-jersey">Jersey number</label>
            <input
              id="pe-jersey"
              class="input"
              type="number"
              min="0"
              max="99"
              inputmode="numeric"
              [value]="jersey()"
              (input)="jersey.set(numOrEmpty($event))"
            />
          </div>
          <div>
            <label class="lbl" for="pe-birth-date">Birth date</label>
            <input
              id="pe-birth-date"
              class="input"
              type="date"
              [value]="birthDate()"
              (change)="birthDate.set(val($event))"
            />
          </div>
        </div>

        <div class="grid2">
          <div>
            <label class="lbl" for="pe-height-cm">Height (cm)</label>
            <input
              id="pe-height-cm"
              class="input"
              type="number"
              min="100"
              max="250"
              inputmode="numeric"
              [value]="heightCm()"
              (input)="heightCm.set(numOrEmpty($event))"
            />
          </div>
          <div>
            <label class="lbl" for="pe-weight-kg">Weight (kg)</label>
            <input
              id="pe-weight-kg"
              class="input"
              type="number"
              min="30"
              max="200"
              inputmode="numeric"
              [value]="weightKg()"
              (input)="weightKg.set(numOrEmpty($event))"
            />
          </div>
        </div>

        @if (error(); as e) {
          <p class="note" style="color:var(--danger)">{{ e }}</p>
        }

        <div class="row" style="justify-content:flex-end;gap:var(--s-2)">
          <button class="btn ghost" type="button" (click)="cancel()">
            Cancel
          </button>
          <button
            class="btn primary"
            type="button"
            [attr.aria-disabled]="saving()"
            (click)="save()"
          >
            {{ saving() ? "Saving…" : "Save profile" }}
          </button>
        </div>
      </div>
    </main>
  `,
  styles: [
    `
      .lbl {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        font-weight: var(--fw-semi);
      }
      .chiprow {
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-2);
      }
      .grid2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-3);
      }
      .input {
        width: 100%;
      }
    `,
  ],
})
export class ProfileEditComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly identity = inject(IdentityService);
  private readonly router = inject(Router);

  readonly positions = ["QB", "WR", "RB", "C", "Rusher", "Safety", "CB"];

  readonly position = signal("");
  readonly jersey = signal<string>("");
  readonly birthDate = signal("");
  readonly heightCm = signal<string>("");
  readonly weightKg = signal<string>("");

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly photoBusy = signal(false);
  readonly photoMsg = signal<string | null>(null);
  private static readonly MAX_PHOTO_BYTES = 5 * 1024 * 1024;
  private static readonly PHOTO_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  ngOnInit(): void {
    // prefill from the canonical profile read; jersey/position fall back to identity/meta
    const meta = (this.supabase.currentUser()?.user_metadata ?? {}) as Record<
      string,
      unknown
    >;
    const jerseyMeta = meta["jersey_number"] ?? this.identity.jersey();
    if (jerseyMeta != null) this.jersey.set(String(jerseyMeta));
    this.position.set(this.identity.position() ?? "");

    this.api.get<ProfileRead>("/api/user-profile").subscribe({
      next: (res) => {
        const p = res?.data;
        if (!p) return;
        if (p.position) this.position.set(p.position);
        if (p.heightCm != null) this.heightCm.set(String(p.heightCm));
        if (p.weightKg != null) this.weightKg.set(String(p.weightKg));
        if (p.birthDate) this.birthDate.set(p.birthDate.slice(0, 10));
      },
      error: () => {
        /* keep identity-derived defaults */
      },
    });
  }

  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
  numOrEmpty(e: Event): string {
    const v = (e.target as HTMLInputElement).value;
    return v === "" ? "" : v;
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.error.set(null);

    const payload: Record<string, unknown> = {};
    if (this.position()) payload["position"] = this.position();
    if (this.jersey() !== "") payload["jerseyNumber"] = Number(this.jersey());
    if (this.birthDate()) payload["birthDate"] = this.birthDate();
    if (this.heightCm() !== "") payload["heightCm"] = Number(this.heightCm());
    if (this.weightKg() !== "") payload["weightKg"] = Number(this.weightKg());

    if (Object.keys(payload).length === 0) {
      this.error.set("Nothing to save yet — fill in at least one field.");
      return;
    }

    this.saving.set(true);
    try {
      const res = await firstValueFrom(
        this.api.post("/api/player-settings", payload),
      );
      if (res.success) {
        await this.router.navigate(["/profile"]);
      } else {
        this.error.set(res.error ?? "Could not save your profile.");
      }
    } catch (err) {
      this.logger.error("profile_save_failed", err);
      this.error.set("Could not save your profile — try again.");
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(["/profile"]);
  }

  async onPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file || this.photoBusy()) return;

    if (!ProfileEditComponent.PHOTO_TYPES.includes(file.type)) {
      this.photoMsg.set("Use a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > ProfileEditComponent.MAX_PHOTO_BYTES) {
      this.photoMsg.set("Image too large — keep it under 5MB.");
      return;
    }

    this.photoBusy.set(true);
    this.photoMsg.set(null);
    try {
      const dataUrl = await this.readAsDataUrl(file);
      const res = await firstValueFrom(
        this.api.post<{ url?: string }>("/api/upload", {
          file: dataUrl,
          fileType: file.type,
          fileName: file.name,
        }),
      );
      const url = extractApiPayload<{ url?: string }>(res)?.url;
      if (!url) throw new Error("Upload returned no URL");
      const { error } = await this.supabase.updateUser({
        data: { avatar_url: url },
      });
      if (error) throw error;
      await this.supabase.refreshCurrentUser();
      this.photoMsg.set("Photo updated");
    } catch (err) {
      this.logger.error("avatar_upload_failed", err);
      this.photoMsg.set("Couldn't update photo — try again.");
    } finally {
      this.photoBusy.set(false);
    }
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("read failed"));
      reader.readAsDataURL(file);
    });
  }
}
