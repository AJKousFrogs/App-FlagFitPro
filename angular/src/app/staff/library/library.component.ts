import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import {
  TrainingVideoService,
  parseYouTubeId,
} from "../../core/services/training-video.service";
import { YtVideoComponent } from "../../shared/yt-video.component";

const CATEGORIES = [
  "warmup",
  "sprint",
  "agility",
  "strength",
  "mobility",
  "skills",
  "conditioning",
  "recovery",
];

/**
 * Coach video library manager — list the team's videos + add new ones (paste a
 * YouTube URL or ID, pick a category). Writes go through TrainingVideoService.add
 * (RLS enforces staff-of-team). Athletes see these in their Training → Library tab
 * and as the session video for the matching intent.
 */
@Component({
  selector: "app-staff-library",
  imports: [LucideAngularModule, YtVideoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./library.component.html",
})
export class StaffLibraryComponent {
  private readonly videoSvc = inject(TrainingVideoService);

  readonly categories = CATEGORIES;
  readonly videos = this.videoSvc.videos;
  readonly loaded = this.videoSvc.loaded;

  readonly url = signal("");
  readonly title = signal("");
  readonly category = signal(CATEGORIES[0]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly previewId = computed(() => parseYouTubeId(this.url()));
  readonly canSave = computed(
    () => !!this.previewId() && this.title().trim().length > 1,
  );

  constructor() {
    if (!this.videoSvc.loaded()) void this.videoSvc.load();
  }

  async save(): Promise<void> {
    if (!this.canSave() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const ok = await this.videoSvc.add({
      url: this.url().trim(),
      title: this.title().trim(),
      category: this.category(),
    });
    this.saving.set(false);
    if (ok) {
      this.url.set("");
      this.title.set("");
    } else {
      this.error.set(
        "Couldn't add — you must be team staff, and the link must be a valid YouTube video.",
      );
    }
  }
}
