/**
 * Platform Host Directive
 *
 * Automatically adds platform-specific classes to component hosts.
 * Use this directive on components that need platform-specific styling.
 *
 * Usage:
 * @Component({
 *   selector: 'app-my-component',
 *   hostDirectives: [PlatformHostDirective],
 *   // ...
 * })
 *
 * Or use in template:
 * <div appPlatformHost>Content</div>
 *
 * Or manually in component:
 * host: {
 *   '[class.platform-ios]': 'platformService.isIOS()',
 *   '[class.platform-android]': 'platformService.isAndroid()',
 * }
 */

import { Directive, HostBinding, inject } from "@angular/core";
import { PlatformDetectionService } from "../../core/services/platform-detection.service";

@Directive({
  selector: "[appPlatformHost]",
  standalone: true,
})
export class PlatformHostDirective {
  private platformService = inject(PlatformDetectionService);

  @HostBinding("class.platform-ios")
  get isIOS(): boolean {
    return this.platformService.isIOS();
  }

  @HostBinding("class.platform-android")
  get isAndroid(): boolean {
    return this.platformService.isAndroid();
  }

  @HostBinding("class.platform-mobile")
  get isMobile(): boolean {
    return this.platformService.isMobile();
  }

  @HostBinding("class.platform-tablet")
  get isTablet(): boolean {
    return this.platformService.isTablet();
  }

  @HostBinding("class.browser-safari")
  get isSafari(): boolean {
    return this.platformService.isSafari();
  }

  @HostBinding("class.browser-chrome")
  get isChrome(): boolean {
    return this.platformService.isChrome();
  }
}
