import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "./avatar.component";

/**
 * App topbar — the eyebrow + title on the left, the notifications bell + profile
 * avatar on the right. The right side was copy-pasted into ~11 athlete screens;
 * this is the one implementation (2026-07-09 backlog "extract app-topbar").
 * The left side (eyebrow/title, which vary per screen and can carry icons) is
 * projected, so callers keep their own bindings:
 *
 *   <app-topbar>
 *     <div class="eyebrow">{{ eyebrow() }}</div>
 *     <h1>{{ title() }}</h1>
 *   </app-topbar>
 */
@Component({
  selector: "app-topbar",
  imports: [RouterLink, LucideAngularModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // display:contents so this wrapper generates no box — the <header> stays a
  // layout child of the screen root exactly as before extraction. Critical:
  // .topbar is position:sticky/top:0, and a wrapper box would become its sticky
  // containing block (header-height), un-pinning it. contents keeps the header
  // sticky relative to the real scroll container and renders pixel-identically.
  styles: [":host { display: contents; }"],
  template: `
    <header class="topbar">
      <div><ng-content /></div>
      <div class="inline">
        <a
          class="icon-btn"
          routerLink="/notifications"
          aria-label="Notifications"
          ><lucide-icon name="bell" /><span class="dot"></span
        ></a>
        <a class="avatar" routerLink="/profile" aria-label="Profile"
          ><app-avatar
        /></a>
      </div>
    </header>
  `,
})
export class TopbarComponent {}
