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
      <div style="display: grid; gap: var(--space-6); padding: var(--space-6); max-width: var(--content-max-width-md);">
        <h2 style="font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-semibold); margin: 0;">Colors</h2>
        
        <!-- Primary Green -->
        <div>
          <h3 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--space-3);">Primary Green (var(--p-highlight-text-color))</h3>
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
            <div style="width: var(--size-120); height: var(--size-80); background: var(--p-highlight-text-color); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; color: var(--color-text-on-primary); font-weight: var(--ds-font-weight-semibold);">
              Primary
            </div>
            <div style="width: var(--size-120); height: var(--size-80); background: var(--hover-text-primary); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; color: var(--color-text-on-primary); font-weight: var(--ds-font-weight-semibold);">
              Hover
            </div>
            <div style="width: var(--size-120); height: var(--size-80); background: var(--color-brand-secondary-hover); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; color: var(--color-text-on-primary); font-weight: var(--ds-font-weight-semibold);">
              Light
            </div>
          </div>
        </div>
        
        <!-- Text Colors -->
        <div>
          <h3 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--space-3);">Text Colors</h3>
          <div style="display: flex; flex-direction: column; gap: var(--space-2);">
            <div style="background: var(--surface-primary); padding: var(--space-3); border-radius: var(--radius-lg); border: var(--border-1) solid var(--color-border-secondary);">
              <div style="color: var(--color-text-primary); font-weight: var(--ds-font-weight-semibold);">Primary Text (var(--color-text-primary))</div>
              <div style="color: var(--color-medal-silver-text);">Secondary Text (var(--color-medal-silver-text))</div>
              <div style="color: var(--p-surface-400);">Muted Text (var(--p-surface-400))</div>
            </div>
            <div style="background: var(--p-highlight-text-color); padding: var(--space-3); border-radius: var(--radius-lg);">
              <div style="color: var(--color-text-on-primary); font-weight: var(--ds-font-weight-semibold);">Text on Primary (var(--color-text-on-primary))</div>
            </div>
          </div>
        </div>
        
        <!-- Status Colors -->
        <div>
          <h3 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--space-3);">Status Colors</h3>
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
            <div style="width: var(--size-120); height: calc(var(--size-120) * 0.5); background: var(--color-status-success); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: var(--color-text-on-primary); font-weight: var(--ds-font-weight-semibold);">
              Success
            </div>
            <div style="width: var(--size-120); height: calc(var(--size-120) * 0.5); background: var(--color-status-warning); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: var(--color-warning-text-accessible); font-weight: var(--ds-font-weight-semibold);">
              Warning
            </div>
            <div style="width: var(--size-120); height: calc(var(--size-120) * 0.5); background: var(--color-status-error); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: var(--color-text-on-primary); font-weight: var(--ds-font-weight-semibold);">
              Error
            </div>
            <div style="width: var(--size-120); height: calc(var(--size-120) * 0.5); background: var(--color-status-info); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: var(--color-text-on-primary); font-weight: var(--ds-font-weight-semibold);">
              Info
            </div>
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
      <div style="display: grid; gap: var(--space-6); padding: var(--space-6); max-width: var(--content-max-width-md);">
        <h2 style="font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-semibold); margin: 0;">Buttons</h2>
        
        <!-- Primary Buttons -->
        <div>
          <h3 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--space-3);">Primary Buttons</h3>
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
            <app-button variant="primary" iconLeft="pi-play">Start Training</app-button>
            <app-button variant="primary" iconLeft="pi-check">Save Changes</app-button>
            <app-button variant="primary">Primary</app-button>
          </div>
        </div>
        
        <!-- Outlined Buttons -->
        <div>
          <h3 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--space-3);">Outlined Buttons</h3>
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
            <app-button variant="outlined" iconLeft="pi-question">Ask Merlin</app-button>
            <app-button variant="outlined">Cancel</app-button>
          </div>
        </div>
        
        <!-- Text Buttons -->
        <div>
          <h3 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--space-3);">Text Buttons</h3>
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
            <app-button variant="text">Learn More</app-button>
            <app-button variant="text">Skip</app-button>
          </div>
        </div>
        
        <!-- Icon Only -->
        <div>
          <h3 style="font-size: var(--ds-font-size-lg); margin-bottom: var(--space-3);">Icon Only (var(--button-height-md))</h3>
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
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
      <div style="display: grid; gap: var(--space-6); padding: var(--space-6); max-width: var(--content-max-width-md);">
        <h2 style="font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-semibold); margin: 0;">Cards</h2>
        
        <!-- Standard Card -->
        <p-card header="Card Title" class="w-full">
          <p>Card content with var(--space-4) padding and var(--space-3) gap between elements.</p>
          <p>Border radius: var(--radius-xl)</p>
        </p-card>
        
        <!-- Card with Footer -->
        <p-card header="Card with Actions" class="w-full">
          <p>This card has a footer with action buttons.</p>
          <ng-template #footer>
            <div style="display: flex; gap: var(--space-3); justify-content: flex-end;">
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
      <div style="display: grid; gap: var(--space-6); padding: var(--space-6); max-width: var(--content-max-width-md);">
        <h2 style="font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-semibold); margin: 0;">Spacing (var(--space-2) Grid)</h2>
        
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          <div style="display: flex; align-items: center; gap: var(--space-4);">
            <div style="width: var(--space-1); height: var(--space-5); background: var(--p-highlight-text-color); border-radius: var(--radius-sm);"></div>
            <span>--space-1: var(--space-1)</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-4);">
            <div style="width: var(--space-2); height: var(--space-5); background: var(--p-highlight-text-color); border-radius: var(--radius-sm);"></div>
            <span>--space-2: var(--space-2)</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-4);">
            <div style="width: var(--space-3); height: var(--space-5); background: var(--p-highlight-text-color); border-radius: var(--radius-sm);"></div>
            <span>--space-3: var(--space-3)</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-4);">
            <div style="width: var(--space-4); height: var(--space-5); background: var(--p-highlight-text-color); border-radius: var(--radius-sm);"></div>
            <span>--space-4: var(--space-4)</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-4);">
            <div style="width: var(--space-6); height: var(--space-5); background: var(--p-highlight-text-color); border-radius: var(--radius-sm);"></div>
            <span>--space-6: var(--space-6)</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-4);">
            <div style="width: var(--space-8); height: var(--space-5); background: var(--p-highlight-text-color); border-radius: var(--radius-sm);"></div>
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
      <div style="display: grid; gap: var(--space-6); padding: var(--space-6); max-width: var(--content-max-width-md);">
        <h2 style="font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-semibold); margin: 0;">Typography</h2>
        
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          <div>
            <h1 style="font-size: var(--ds-font-size-2xl); font-weight: var(--ds-font-weight-semibold); margin: 0 0 var(--space-2) 0;">Heading Large (var(--ds-font-size-2xl))</h1>
            <p style="font-size: var(--ds-font-size-sm); color: var(--p-surface-400); margin: 0;">--font-h2-size</p>
          </div>
          
          <div>
            <h2 style="font-size: var(--ds-font-size-lg); font-weight: var(--ds-font-weight-semibold); margin: 0 0 var(--space-2) 0;">Heading Small (var(--ds-font-size-lg))</h2>
            <p style="font-size: var(--ds-font-size-sm); color: var(--p-surface-400); margin: 0;">--font-h4-size</p>
          </div>
          
          <div>
            <p style="font-size: var(--ds-font-size-md); margin: 0 0 var(--space-2) 0;">Body Medium (var(--ds-font-size-md))</p>
            <p style="font-size: var(--ds-font-size-sm); color: var(--p-surface-400); margin: 0;">--font-body-size</p>
          </div>
          
          <div>
            <p style="font-size: var(--ds-font-size-sm); margin: 0 0 var(--space-2) 0;">Body Small (var(--ds-font-size-sm))</p>
            <p style="font-size: var(--ds-font-size-sm); color: var(--p-surface-400); margin: 0;">--font-body-sm-size</p>
          </div>
          
          <div>
            <p style="font-size: var(--ds-font-size-xs); margin: 0 0 var(--space-2) 0;">Body Extra Small (var(--ds-font-size-xs))</p>
            <p style="font-size: var(--ds-font-size-sm); color: var(--p-surface-400); margin: 0;">--font-caption-size</p>
          </div>
        </div>
      </div>
    `,
  }),
};
