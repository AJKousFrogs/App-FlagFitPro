import type { Meta, StoryObj } from "@storybook/angular";
import { applicationConfig } from "@storybook/angular";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { Card } from "primeng/card";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../app/shared/components/button/button.component";
// Note: play functions temporarily disabled due to Storybook 10 + @storybook/test incompatibility

/**
 * Design System Showcase
 *
 * This story demonstrates the complete design system without legacy CSS interference.
 * Use this as a reference when refactoring components.
 *
 * Styles: design-system-showcase.scss (no inline styles per audit)
 */

const meta: Meta = {
  title: "Design System/Showcase",
  decorators: [
    applicationConfig({
      providers: [provideAnimationsAsync()],
    }),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Complete design system showcase - colors, spacing, typography, components",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Colors Showcase
 */
export const Colors: Story = {
  render: () => ({
    template: `
      <div class="ds-showcase">
        <h2 class="ds-showcase__title">Colors</h2>
        
        <div>
          <h3 class="ds-showcase__section-title">Primary Green (var(--p-highlight-text-color))</h3>
          <div class="ds-showcase__flex-row">
            <div class="ds-showcase__swatch ds-showcase__swatch--primary">Primary</div>
            <div class="ds-showcase__swatch ds-showcase__swatch--hover">Hover</div>
            <div class="ds-showcase__swatch ds-showcase__swatch--light">Light</div>
          </div>
        </div>
        
        <div>
          <h3 class="ds-showcase__section-title">Text Colors</h3>
          <div class="ds-showcase__flex-col">
            <div class="ds-showcase__card">
              <div class="ds-showcase__text-primary">Primary Text (var(--color-text-primary))</div>
              <div class="ds-showcase__text-secondary">Secondary Text (var(--color-medal-silver-text))</div>
              <div class="ds-showcase__text-muted">Muted Text (var(--p-surface-400))</div>
            </div>
            <div class="ds-showcase__card ds-showcase__card--primary">
              <div class="ds-showcase__text-on-primary">Text on Primary (var(--color-text-on-primary))</div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="ds-showcase__section-title">Status Colors</h3>
          <div class="ds-showcase__flex-row">
            <div class="ds-showcase__swatch ds-showcase__swatch--status ds-showcase__swatch--success">Success</div>
            <div class="ds-showcase__swatch ds-showcase__swatch--status ds-showcase__swatch--warning">Warning</div>
            <div class="ds-showcase__swatch ds-showcase__swatch--status ds-showcase__swatch--error">Error</div>
            <div class="ds-showcase__swatch ds-showcase__swatch--status ds-showcase__swatch--info">Info</div>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * Buttons Showcase
 */
export const Buttons: Story = {
  render: () => ({
    imports: [ButtonComponent, CommonModule],
    template: `
      <div class="ds-showcase">
        <h2 class="ds-showcase__title">Buttons</h2>
        
        <div>
          <h3 class="ds-showcase__section-title">Primary Buttons</h3>
          <div class="ds-showcase__flex-row">
            <app-button variant="primary" iconLeft="pi-play">Start Training</app-button>
            <app-button variant="primary" iconLeft="pi-check">Save Changes</app-button>
            <app-button variant="primary">Primary</app-button>
          </div>
        </div>
        
        <div>
          <h3 class="ds-showcase__section-title">Outlined Buttons</h3>
          <div class="ds-showcase__flex-row">
            <app-button variant="outlined" iconLeft="pi-question">Ask Merlin</app-button>
            <app-button variant="outlined">Cancel</app-button>
          </div>
        </div>
        
        <div>
          <h3 class="ds-showcase__section-title">Text Buttons</h3>
          <div class="ds-showcase__flex-row">
            <app-button variant="text">Learn More</app-button>
            <app-button variant="text">Skip</app-button>
          </div>
        </div>
        
        <div>
          <h3 class="ds-showcase__section-title">Icon Only (var(--button-height-md))</h3>
          <div class="ds-showcase__flex-row">
            <app-button iconOnly ariaLabel="Add" iconLeft="pi-plus"></app-button>
            <app-button iconOnly ariaLabel="Edit" iconLeft="pi-pencil"></app-button>
            <app-button iconOnly ariaLabel="Delete" variant="danger" iconLeft="pi-trash"></app-button>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * Cards Showcase
 */
export const Cards: Story = {
  render: () => ({
    imports: [Card, ButtonComponent, CommonModule],
    template: `
      <div class="ds-showcase">
        <h2 class="ds-showcase__title">Cards</h2>
        
        <p-card header="Card Title" class="w-full">
          <p>Card content with var(--space-4) padding and var(--space-3) gap between elements.</p>
          <p>Border radius: var(--radius-xl)</p>
        </p-card>
        
        <p-card header="Card with Actions" class="w-full">
          <p>This card has a footer with action buttons.</p>
          <ng-template #footer>
            <div class="ds-showcase__footer-actions">
              <app-button variant="outlined">Cancel</app-button>
              <app-button variant="primary" iconLeft="pi-check">Save</app-button>
            </div>
          </ng-template>
        </p-card>
      </div>
    `,
  }),
};

/**
 * Spacing Showcase
 */
export const Spacing: Story = {
  render: () => ({
    template: `
      <div class="ds-showcase">
        <h2 class="ds-showcase__title">Spacing (var(--space-2) Grid)</h2>
        
        <div class="ds-showcase__flex-col--spaced">
          <div class="ds-showcase__spacing-row">
            <div class="ds-showcase__spacing-bar ds-showcase__spacing-bar--1"></div>
            <span>--space-1: var(--space-1)</span>
          </div>
          <div class="ds-showcase__spacing-row">
            <div class="ds-showcase__spacing-bar ds-showcase__spacing-bar--2"></div>
            <span>--space-2: var(--space-2)</span>
          </div>
          <div class="ds-showcase__spacing-row">
            <div class="ds-showcase__spacing-bar ds-showcase__spacing-bar--3"></div>
            <span>--space-3: var(--space-3)</span>
          </div>
          <div class="ds-showcase__spacing-row">
            <div class="ds-showcase__spacing-bar ds-showcase__spacing-bar--4"></div>
            <span>--space-4: var(--space-4)</span>
          </div>
          <div class="ds-showcase__spacing-row">
            <div class="ds-showcase__spacing-bar ds-showcase__spacing-bar--6"></div>
            <span>--space-6: var(--space-6)</span>
          </div>
          <div class="ds-showcase__spacing-row">
            <div class="ds-showcase__spacing-bar ds-showcase__spacing-bar--8"></div>
            <span>--space-8: var(--space-8)</span>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * Typography Showcase
 */
export const Typography: Story = {
  render: () => ({
    template: `
      <div class="ds-showcase">
        <h2 class="ds-showcase__title">Typography</h2>
        
        <div class="ds-showcase__flex-col--spaced">
          <div>
            <h1 class="ds-showcase__typography-block ds-showcase__heading-xl">Heading Large (var(--ds-font-size-2xl))</h1>
            <p class="ds-showcase__typography-caption">--font-h2-size</p>
          </div>
          
          <div>
            <h2 class="ds-showcase__typography-block ds-showcase__heading-lg">Heading Small (var(--ds-font-size-lg))</h2>
            <p class="ds-showcase__typography-caption">--font-h4-size</p>
          </div>
          
          <div>
            <p class="ds-showcase__typography-block ds-showcase__body-md">Body Medium (var(--ds-font-size-md))</p>
            <p class="ds-showcase__typography-caption">--font-body-size</p>
          </div>
          
          <div>
            <p class="ds-showcase__typography-block ds-showcase__body-sm">Body Small (var(--ds-font-size-sm))</p>
            <p class="ds-showcase__typography-caption">--font-body-sm-size</p>
          </div>
          
          <div>
            <p class="ds-showcase__typography-block ds-showcase__body-xs">Body Extra Small (var(--ds-font-size-xs))</p>
            <p class="ds-showcase__typography-caption">--font-caption-size</p>
          </div>
        </div>
      </div>
    `,
  }),
};
