import {
  Component,
  computed,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { ButtonComponent } from "../button/button.component";
import {
  AI_PROCESSING_MESSAGES,
  PrivacyMessage,
} from "../../utils/privacy-ux-copy";
import { AlertComponent, type AlertVariant } from "../alert/alert.component";

/**
 * AI Consent Required Component
 *
 * Displays a message when AI features are disabled due to missing consent.
 * Provides a link to privacy settings to enable AI processing.
 *
 * Now uses centralized privacy-ux-copy.ts for all messages.
 *
 * Usage:
 * <app-ai-consent-required
 *   featureName="Training Recommendations"
 *   [showSettingsLink]="true"
 * ></app-ai-consent-required>
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

@Component({
  selector: "app-ai-consent-required",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, AlertComponent],
  template: `
    <div [class]="wrapperClasses()">
      <app-alert
        [variant]="alertVariant()"
        [icon]="iconClass()"
        [title]="titleText()"
        [message]="messageText()"
        [density]="variant() === 'banner' ? 'compact' : 'default'"
      >
        @if (showSettingsLink() || showDismiss()) {
          <div class="consent-actions">
            @if (showSettingsLink()) {
              <app-button
                variant="secondary"
                size="sm"
                iconLeft="pi-cog"
                [routerLink]="settingsRoute()"
                [fragment]="settingsFragment()"
              >
                {{ actionLabel() }}
              </app-button>
            }
            @if (showDismiss()) {
              <app-button variant="text" size="sm" (clicked)="onDismiss.emit()">
                Continue Without AI
              </app-button>
            }
          </div>
        }
      </app-alert>
    </div>
  `,
  styleUrl: "./ai-consent-required.component.scss",
})
export class AiConsentRequiredComponent {
  readonly featureName = input<string>();
  readonly showSettingsLink = input<boolean>(true);
  readonly showDismiss = input<boolean>(false);
  readonly variant = input<"default" | "banner" | "card">("default");
  readonly status = input<"disabled" | "not_consented" | "consent_required">(
    "consent_required",
  );

  readonly onDismiss = output<void>();

  private getPrivacyMessage(): PrivacyMessage {
    // Map snake_case status to camelCase keys in AI_PROCESSING_MESSAGES
    const statusMap: Record<string, keyof typeof AI_PROCESSING_MESSAGES> = {
      disabled: "disabled",
      not_consented: "notConsented",
      consent_required: "consentRequired",
    };
    const key = statusMap[this.status()] || "consentRequired";
    return AI_PROCESSING_MESSAGES[key];
  }

  readonly privacyMessage = computed(() => this.getPrivacyMessage());
  readonly titleText = computed(() => this.privacyMessage().title);
  readonly reasonText = computed(() => this.privacyMessage().reason);
  readonly actionLabel = computed(
    () => this.privacyMessage().actionLabel || "Privacy Settings",
  );
  readonly helpLink = computed(
    () => this.privacyMessage().helpLink || "/settings/privacy#ai",
  );
  readonly iconClass = computed(
    () => this.privacyMessage().icon || "pi-sparkles",
  );
  readonly messageText = computed(() => {
    const prefix = this.featureName()
      ? `${this.featureName()} requires AI processing to work.`
      : "This feature requires AI processing to work.";

    return `${prefix} ${this.reasonText()}`;
  });
  readonly alertVariant = computed<AlertVariant>(() => {
    const severity = this.privacyMessage().severity;

    switch (severity) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  });
  readonly settingsRoute = computed(() => this.helpLink().split("#")[0]);
  readonly settingsFragment = computed(() => this.helpLink().split("#")[1] ?? "");
  readonly wrapperClasses = computed(() =>
    [
      "ai-consent-required-shell",
      `ai-consent-required-shell--${this.variant()}`,
    ]
      .filter(Boolean)
      .join(" "),
  );
}
