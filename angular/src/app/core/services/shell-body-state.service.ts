import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import {
  Injectable,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
  inject,
} from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ShellBodyStateService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer: Renderer2 = inject(RendererFactory2)
    .createRenderer(null, null);

  private readonly shellTokens = new Set<symbol>();
  private readonly sidebarTokens = new Set<symbol>();

  acquireShell(): () => void {
    return this.acquireToken(this.shellTokens, "app-shell-active");
  }

  acquireSidebarLock(): () => void {
    return this.acquireToken(this.sidebarTokens, "sidebar-open");
  }

  private acquireToken(
    bucket: Set<symbol>,
    className: string,
  ): () => void {
    const token = Symbol(className);
    let released = false;

    bucket.add(token);
    this.syncClass(className, true);

    return () => {
      if (released) {
        return;
      }

      released = true;
      bucket.delete(token);
      this.syncClass(className, bucket.size > 0);
    };
  }

  private syncClass(className: string, enabled: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const body = this.document.body;
    if (!body) {
      return;
    }

    if (enabled) {
      this.renderer.addClass(body, className);
    } else {
      this.renderer.removeClass(body, className);
    }
  }
}
