import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import { YtVideoComponent } from "../shared/yt-video.component";

/**
 * Component gallery — the locked visual language rendered once, in Angular.
 *
 * Phase E verification surface: proves every primitive from scss/system renders
 * identically to the static Phase C gallery, assembled ONLY from the vocabulary
 * classes + tokens. Screens are built from these and nothing bespoke.
 */
@Component({
  selector: "app-gallery",
  standalone: true,
  imports: [LucideAngularModule, YtVideoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div>
        <div class="eyebrow">Phase E · design system</div>
        <h1 style="font-size:21px">Component gallery</h1>
      </div>
      <div class="inline">
        <span class="icon-btn"><lucide-icon name="bell" /><span class="dot"></span></span>
        <span class="avatar">JM</span>
      </div>
    </header>

    <main class="screen">
      <div class="strip">
        <span class="inline"><lucide-icon name="flag" /> 2d → Big Bowl · <lucide-icon name="cloud-rain" /> 12°C rain</span>
        <lucide-icon name="chevron-down" />
      </div>

      <div class="section-h"><h2>Buttons</h2></div>
      <div class="card stack">
        <div class="inline" style="flex-wrap:wrap;gap:8px">
          <button class="btn primary">Primary</button>
          <button class="btn secondary">Secondary</button>
          <button class="btn ghost">Ghost</button>
          <button class="btn danger">Danger</button>
        </div>
        <button class="btn primary block"><lucide-icon name="plus" /> Block button</button>
        <button class="btn ghost sm"><lucide-icon name="plus" /> Small ghost</button>
      </div>

      <div class="section-h"><h2>Bands</h2></div>
      <div class="card">
        <div class="inline" style="flex-wrap:wrap;gap:8px">
          <span class="band good">Sweet spot</span>
          <span class="band caution">Elevated</span>
          <span class="band danger">Danger</span>
          <span class="band info">pre-session</span>
          <span class="band neutral">optional</span>
        </div>
      </div>

      <div class="section-h"><h2>Hero + tiles + gauge</h2></div>
      <div class="hero">
        <div class="row">
          <div>
            <div class="eyebrow muted">Today</div>
            <h2>Mobility &amp; technique</h2>
            <p class="muted" style="margin:6px 0 0">Physio block — right hamstring. RPE 5, no sprints.</p>
          </div>
          <div class="gauge grad" style="--p:72"><div class="inner"><b>72</b><small>ready</small></div></div>
        </div>
        <div class="tiles">
          <div><b>1.08</b><small>ACWR</small></div>
          <div><b>5</b><small>RPE</small></div>
          <div><b>0</b><small>sprints</small></div>
        </div>
      </div>

      <div class="section-h"><h2>List rows + switch</h2></div>
      <div class="card">
        <div class="lrow">
          <span><lucide-icon name="pill" class="suppi-i" /> Creatine <small>5 g</small></span>
          <button class="sw" role="switch" [attr.aria-checked]="creatine()" (click)="creatine.set(!creatine())"></button>
        </div>
        <div class="lrow">
          <span><lucide-icon name="coffee" class="suppi-i" /> Caffeine <small>200 mg · pre-session</small></span>
          <button class="sw" role="switch" [attr.aria-checked]="caffeine()" (click)="caffeine.set(!caffeine())"></button>
        </div>
        <div class="lrow">
          <span><lucide-icon name="shield-half" class="suppi-i" /> Beta-alanine <small>4 g</small></span>
          <button class="sw" role="switch" [attr.aria-checked]="beta()" (click)="beta.set(!beta())"></button>
        </div>
      </div>

      <div class="section-h"><h2>Slider</h2></div>
      <div class="card">
        <div class="slider">
          <label for="sleep">Sleep</label>
          <input id="sleep" class="rng" type="range" min="1" max="10" [value]="sleep()"
                 (input)="sleep.set(+$any($event.target).value)" />
          <span class="val">{{ sleep() }}</span>
        </div>
      </div>

      <div class="section-h"><h2>Session video (YouTube IFrame player)</h2></div>
      <app-yt-video videoId="M7lc1UVf-VE" poster="assets/images/rebuild/video-session.jpg"
                    title="Tap to play" duration="0:15" />

      <div class="section-h"><h2>Link card + empty state</h2></div>
      <a class="card linkcard" href="https://www.laprimafit.eu" target="_blank" rel="noopener">
        <span class="lc-ic"><lucide-icon name="pill" /></span>
        <div style="flex:1"><b>Running low?</b><div class="muted" style="font-size:var(--fs-sm)">Restock at La Prima Fit</div></div>
        <lucide-icon name="arrow-up-right" class="lc-go" />
      </a>
      <div class="empty">No wellness log yet — check in to calculate readiness.</div>
    </main>
  `,
  styles: [
    `
      :host { display: block; }
      .suppi-i { color: var(--text-muted); margin-right: 6px; vertical-align: -3px; }
    `,
  ],
})
export class GalleryComponent {
  readonly creatine = signal(true);
  readonly caffeine = signal(true);
  readonly beta = signal(false);
  readonly sleep = signal(7);
}
