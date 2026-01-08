import type { Meta, StoryObj } from "@storybook/angular";
import { applicationConfig } from "@storybook/angular";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { CommonModule } from "@angular/common";
import { expect, within, userEvent } from "@storybook/test";

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
      providers: [provideAnimations()],
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
      <div style="display: grid; gap: 24px; padding: 24px; max-width: 800px;">
        <h2 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Colors</h2>
        
        <!-- Primary Green -->
        <div>
          <h3 style="font-size: 1.125rem; margin-bottom: 12px;">Primary Green (#089949)</h3>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <div style="width: 120px; height: 80px; background: #089949; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
              Primary
            </div>
            <div style="width: 120px; height: 80px; background: #036d35; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
              Hover
            </div>
            <div style="width: 120px; height: 80px; background: #0ab85a; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
              Light
            </div>
          </div>
        </div>
        
        <!-- Text Colors -->
        <div>
          <h3 style="font-size: 1.125rem; margin-bottom: 12px;">Text Colors</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <div style="color: #1a1a1a; font-weight: 600;">Primary Text (#1a1a1a)</div>
              <div style="color: #4a4a4a;">Secondary Text (#4a4a4a)</div>
              <div style="color: #525252;">Muted Text (#525252)</div>
            </div>
            <div style="background: #089949; padding: 12px; border-radius: 8px;">
              <div style="color: #ffffff; font-weight: 600;">Text on Primary (#ffffff)</div>
            </div>
          </div>
        </div>
        
        <!-- Status Colors -->
        <div>
          <h3 style="font-size: 1.125rem; margin-bottom: 12px;">Status Colors</h3>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <div style="width: 120px; height: 60px; background: #63ad0e; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
              Success
            </div>
            <div style="width: 120px; height: 60px; background: #ffc000; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #92400e; font-weight: 600;">
              Warning
            </div>
            <div style="width: 120px; height: 60px; background: #ff003c; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
              Error
            </div>
            <div style="width: 120px; height: 60px; background: #0ea5e9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
              Info
            </div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify color showcase renders
    await expect(canvas.getByText("Colors")).toBeInTheDocument();
    await expect(canvas.getByText("Primary Green (#089949)")).toBeInTheDocument();
    await expect(canvas.getByText("Status Colors")).toBeInTheDocument();

    // Verify color swatches render
    await expect(canvas.getByText("Primary")).toBeInTheDocument();
    await expect(canvas.getByText("Success")).toBeInTheDocument();
    await expect(canvas.getByText("Warning")).toBeInTheDocument();
    await expect(canvas.getByText("Error")).toBeInTheDocument();
  },
};

/**
 * Buttons Showcase
 */
export const Buttons: Story = {
  render: () => ({
    imports: [ButtonModule, CommonModule],
    template: `
      <div style="display: grid; gap: 24px; padding: 24px; max-width: 800px;">
        <h2 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Buttons</h2>
        
        <!-- Primary Buttons -->
        <div>
          <h3 style="font-size: 1.125rem; margin-bottom: 12px;">Primary Buttons</h3>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <p-button label="Start Training" icon="pi pi-play"></p-button>
            <p-button label="Save Changes" icon="pi pi-check"></p-button>
            <p-button label="Primary" [iconOnly]="false"></p-button>
          </div>
        </div>
        
        <!-- Outlined Buttons -->
        <div>
          <h3 style="font-size: 1.125rem; margin-bottom: 12px;">Outlined Buttons</h3>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <p-button label="Ask Merlin" styleClass="p-button-outlined" icon="pi pi-question"></p-button>
            <p-button label="Cancel" styleClass="p-button-outlined"></p-button>
          </div>
        </div>
        
        <!-- Text Buttons -->
        <div>
          <h3 style="font-size: 1.125rem; margin-bottom: 12px;">Text Buttons</h3>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <p-button label="Learn More" styleClass="p-button-text"></p-button>
            <p-button label="Skip" styleClass="p-button-text"></p-button>
          </div>
        </div>
        
        <!-- Icon Only -->
        <div>
          <h3 style="font-size: 1.125rem; margin-bottom: 12px;">Icon Only (44x44px)</h3>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <p-button icon="pi pi-plus" [iconOnly]="true"></p-button>
            <p-button icon="pi pi-pencil" [iconOnly]="true"></p-button>
            <p-button icon="pi pi-trash" [iconOnly]="true" styleClass="p-button-danger"></p-button>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify button showcase renders
    await expect(canvas.getByText("Buttons")).toBeInTheDocument();

    // Verify all button types render
    const startTrainingBtn = canvas.getByRole("button", {
      name: /start training/i,
    });
    const saveChangesBtn = canvas.getByRole("button", { name: /save changes/i });
    const cancelBtn = canvas.getByRole("button", { name: /cancel/i });

    await expect(startTrainingBtn).toBeInTheDocument();
    await expect(saveChangesBtn).toBeInTheDocument();
    await expect(cancelBtn).toBeInTheDocument();

    // Test button interactions
    await userEvent.click(startTrainingBtn);
    await userEvent.hover(saveChangesBtn);
    await userEvent.unhover(saveChangesBtn);
  },
};

/**
 * Cards Showcase
 */
export const Cards: Story = {
  render: () => ({
    imports: [CardModule, CommonModule],
    template: `
      <div style="display: grid; gap: 24px; padding: 24px; max-width: 800px;">
        <h2 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Cards</h2>
        
        <!-- Standard Card -->
        <p-card header="Card Title" styleClass="w-full">
          <p>Card content with 16px padding and 12px gap between elements.</p>
          <p>Border radius: 12px</p>
        </p-card>
        
        <!-- Card with Footer -->
        <p-card header="Card with Actions" styleClass="w-full">
          <p>This card has a footer with action buttons.</p>
          <ng-template pTemplate="footer">
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <p-button label="Cancel" styleClass="p-button-outlined"></p-button>
              <p-button label="Save" icon="pi pi-check"></p-button>
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
      <div style="display: grid; gap: 24px; padding: 24px; max-width: 800px;">
        <h2 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Spacing (8px Grid)</h2>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 4px; height: 20px; background: #089949; border-radius: 2px;"></div>
            <span>--space-1: 4px</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 8px; height: 20px; background: #089949; border-radius: 2px;"></div>
            <span>--space-2: 8px</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 12px; height: 20px; background: #089949; border-radius: 2px;"></div>
            <span>--space-3: 12px</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 16px; height: 20px; background: #089949; border-radius: 2px;"></div>
            <span>--space-4: 16px</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 24px; height: 20px; background: #089949; border-radius: 2px;"></div>
            <span>--space-6: 24px</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 32px; height: 20px; background: #089949; border-radius: 2px;"></div>
            <span>--space-8: 32px</span>
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
      <div style="display: grid; gap: 24px; padding: 24px; max-width: 800px;">
        <h2 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Typography</h2>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <h1 style="font-size: 1.5rem; font-weight: 600; margin: 0 0 8px 0;">Heading Large (1.5rem / 24px)</h1>
            <p style="font-size: 0.875rem; color: #525252; margin: 0;">--font-heading-lg</p>
          </div>
          
          <div>
            <h2 style="font-size: 1.125rem; font-weight: 600; margin: 0 0 8px 0;">Heading Small (1.125rem / 18px)</h2>
            <p style="font-size: 0.875rem; color: #525252; margin: 0;">--font-heading-sm</p>
          </div>
          
          <div>
            <p style="font-size: 1rem; margin: 0 0 8px 0;">Body Medium (1rem / 16px)</p>
            <p style="font-size: 0.875rem; color: #525252; margin: 0;">--font-body-md</p>
          </div>
          
          <div>
            <p style="font-size: 0.875rem; margin: 0 0 8px 0;">Body Small (0.875rem / 14px)</p>
            <p style="font-size: 0.875rem; color: #525252; margin: 0;">--font-body-sm</p>
          </div>
          
          <div>
            <p style="font-size: 0.75rem; margin: 0 0 8px 0;">Body Extra Small (0.75rem / 12px)</p>
            <p style="font-size: 0.875rem; color: #525252; margin: 0;">--font-body-xs</p>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify typography showcase renders
    await expect(canvas.getByText("Typography")).toBeInTheDocument();

    // Verify all typography examples render
    await expect(
      canvas.getByText("Heading Large (1.5rem / 24px)")
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Heading Small (1.125rem / 18px)")
    ).toBeInTheDocument();
    await expect(canvas.getByText("Body Medium (1rem / 16px)")).toBeInTheDocument();
    await expect(
      canvas.getByText("Body Small (0.875rem / 14px)")
    ).toBeInTheDocument();
  },
};
