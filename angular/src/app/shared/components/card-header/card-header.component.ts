import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

type CardHeaderLevel = 2 | 3 | 4 | 5;

@Component({
  selector: "app-card-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <header
      class="app-card-header"
      [class.app-card-header--compact]="compact()"
      [class.app-card-header--divider]="divider()"
    >
      <div class="app-card-header__content">
        @if (icon()) {
          <span class="app-card-header__icon" aria-hidden="true">
            <i [class]="'pi ' + icon()"></i>
          </span>
        }

        <div class="app-card-header__text">
          @switch (headingLevel()) {
            @case (2) {
              <h2 class="app-card-header__title" [attr.id]="titleId() || null">
                {{ title() }}
              </h2>
            }
            @case (4) {
              <h4 class="app-card-header__title" [attr.id]="titleId() || null">
                {{ title() }}
              </h4>
            }
            @case (5) {
              <h5 class="app-card-header__title" [attr.id]="titleId() || null">
                {{ title() }}
              </h5>
            }
            @default {
              <h3 class="app-card-header__title" [attr.id]="titleId() || null">
                {{ title() }}
              </h3>
            }
          }

          @if (subtitle()) {
            <p class="app-card-header__subtitle">{{ subtitle() }}</p>
          }
        </div>
      </div>

      <div class="app-card-header__actions">
        <ng-content select="[header-actions]"></ng-content>
      </div>
    </header>
  `,
  styleUrl: "./card-header.component.scss",
})
export class CardHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
  icon = input<string>();
  titleId = input<string>();
  headingLevel = input<CardHeaderLevel>(3);
  compact = input(false);
  divider = input(false);
}
