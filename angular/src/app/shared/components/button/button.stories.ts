import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "./button.component";
import { IconButtonComponent } from "./icon-button.component";
// Note: play functions temporarily disabled due to Storybook 10 + @storybook/test incompatibility
// import { expect, within, userEvent } from "storybook/test";

/**
 * # Button Component - Unified Design System
 *
 * THE SINGLE STANDARD BUTTON FOR THE ENTIRE APP.
 * All buttons should use `<app-button>` or `<app-icon-button>`.
 *
 * ## Features
 * - **Variants**: primary, secondary, outlined, text, danger, success
 * - **Sizes**: sm, md, lg
 * - **States**: loading, disabled
 * - **Icons**: Left icon, right icon, or icon-only
 * - **Routing**: Built-in routerLink support
 * - **Accessibility**: Full ARIA support, keyboard navigation
 *
 * ## Migration from PrimeNG
 *
 * | PrimeNG | App Button |
 * |---------|------------|
 * | `<p-button>` | `<app-button>` |
 * | `severity="secondary"` | `variant="secondary"` |
 * | `severity="danger"` | `variant="danger"` |
 * | `severity="success"` | `variant="success"` |
 * | `[outlined]="true"` | `variant="outlined"` |
 * | `[text]="true"` | `variant="text"` |
 * | `icon="pi pi-check"` | `iconLeft="pi-check"` |
 * | `iconPos="right"` | `iconRight="pi-check"` |
 * | `styleClass="w-full"` | `[fullWidth]="true"` |
 * | `(onClick)="fn()"` | `(clicked)="fn()"` |
 *
 * ## Usage
 *
 * ```html
 * <app-button variant="primary" (clicked)="handleClick()">
 *   Click Me
 * </app-button>
 *
 * <app-button variant="secondary" iconLeft="pi-check" [loading]="isSaving">
 *   Save Changes
 * </app-button>
 *
 * <app-button variant="text" routerLink="/dashboard">
 *   Go to Dashboard
 * </app-button>
 *
 * <app-icon-button
 *   icon="pi-plus"
 *   ariaLabel="Add item"
 *   (clicked)="addItem()"
 * />
 * ```
 */
const meta: Meta<ButtonComponent> = {
  title: "Design System/Button",
  component: ButtonComponent,
  tags: ["autodocs"],
  decorators: [
    moduleMetadata({
      imports: [
        ButtonComponent,
        IconButtonComponent
      ],
    }),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "outlined",
        "text",
        "danger",
        "success",
      ],
      description: "Visual style variant of the button",
      table: {
        type: { summary: "ButtonVariant" },
        defaultValue: { summary: "primary" },
      },
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the button",
      table: {
        type: { summary: "ButtonSize" },
        defaultValue: { summary: "md" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Disables the button",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    loading: {
      control: "boolean",
      description: "Shows loading spinner and disables interaction",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    fullWidth: {
      control: "boolean",
      description: "Makes the button full width",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    iconLeft: {
      control: "text",
      description: "PrimeIcons icon on the left (e.g., pi-check)",
    },
    iconRight: {
      control: "text",
      description: "PrimeIcons icon on the right (e.g., pi-arrow-right)",
    },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
      description: "HTML button type",
      table: {
        type: { summary: "button | submit | reset" },
        defaultValue: { summary: "button" },
      },
    },
    ariaLabel: {
      control: "text",
      description: "ARIA label (required for icon-only buttons)",
    },
  },
  args: {
    variant: "primary",
    size: "md",
    disabled: false,
    loading: false,
    fullWidth: false,
    type: "button",
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

// ================================
// BASIC VARIANTS
// ================================

export const Primary: Story = {
  args: {
    variant: "primary",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size">Primary Button</app-button>`,
  }),
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size">Secondary Button</app-button>`,
  }),
};

export const Outlined: Story = {
  args: {
    variant: "outlined",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size">Outlined Button</app-button>`,
  }),
};

export const Text: Story = {
  args: {
    variant: "text",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size">Text Button</app-button>`,
  }),
};

export const Danger: Story = {
  args: {
    variant: "danger",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size">Delete</app-button>`,
  }),
};

export const Success: Story = {
  args: {
    variant: "success",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size">Complete</app-button>`,
  }),
};

// ================================
// SIZES
// ================================

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: var(--ds-space-4); align-items: center;">
        <app-button size="sm">Small</app-button>
        <app-button size="md">Medium</app-button>
        <app-button size="lg">Large</app-button>
      </div>
    `,
  }),
};

// ================================
// STATES
// ================================

export const Loading: Story = {
  args: {
    loading: true,
  },
  render: (args) => ({
    props: args,
    template: `<app-button [loading]="loading">Saving...</app-button>`,
  }),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => ({
    props: args,
    template: `<app-button [disabled]="disabled">Disabled</app-button>`,
  }),
};

// ================================
// ICONS
// ================================

export const WithLeftIcon: Story = {
  render: () => ({
    template: `<app-button iconLeft="pi-check">Save Changes</app-button>`,
  }),
};

export const WithRightIcon: Story = {
  render: () => ({
    template: `<app-button iconRight="pi-arrow-right">Continue</app-button>`,
  }),
};

export const WithBothIcons: Story = {
  render: () => ({
    template: `<app-button iconLeft="pi-file" iconRight="pi-download">Download Report</app-button>`,
  }),
};

export const IconOnly: Story = {
  render: () => ({
    template: `<app-button iconLeft="pi-plus" [iconOnly]="true" ariaLabel="Add item"></app-button>`,
  }),
};

// ================================
// FULL WIDTH
// ================================

export const FullWidth: Story = {
  render: () => ({
    template: `
      <div style="width: 300px;">
        <app-button [fullWidth]="true">Full Width Button</app-button>
      </div>
    `,
  }),
};

// ================================
// FORM SUBMIT
// ================================

export const FormSubmit: Story = {
  render: () => ({
    template: `
      <form (ngSubmit)="alert('Form submitted!')" style="display: flex; gap: var(--ds-space-3);">
        <app-button type="submit" variant="primary">Submit Form</app-button>
        <app-button type="reset" variant="secondary">Reset</app-button>
      </form>
    `,
  }),
};

// ================================
// ALL VARIANTS SHOWCASE
// ================================

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--ds-space-6);">
        <div>
          <h4 style="margin-bottom: var(--space-3); color: var(--color-text-secondary);">Primary</h4>
          <div style="display: flex; gap: var(--ds-space-3); align-items: center; flex-wrap: wrap;">
            <app-button variant="primary">Default</app-button>
            <app-button variant="primary" iconLeft="pi-check">With Icon</app-button>
            <app-button variant="primary" [loading]="true">Loading</app-button>
            <app-button variant="primary" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: var(--space-3); color: var(--color-text-secondary);">Secondary</h4>
          <div style="display: flex; gap: var(--ds-space-3); align-items: center; flex-wrap: wrap;">
            <app-button variant="secondary">Default</app-button>
            <app-button variant="secondary" iconLeft="pi-check">With Icon</app-button>
            <app-button variant="secondary" [loading]="true">Loading</app-button>
            <app-button variant="secondary" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: var(--space-3); color: var(--color-text-secondary);">Outlined</h4>
          <div style="display: flex; gap: var(--ds-space-3); align-items: center; flex-wrap: wrap;">
            <app-button variant="outlined">Default</app-button>
            <app-button variant="outlined" iconLeft="pi-check">With Icon</app-button>
            <app-button variant="outlined" [loading]="true">Loading</app-button>
            <app-button variant="outlined" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: var(--space-3); color: var(--color-text-secondary);">Text</h4>
          <div style="display: flex; gap: var(--ds-space-3); align-items: center; flex-wrap: wrap;">
            <app-button variant="text">Default</app-button>
            <app-button variant="text" iconLeft="pi-check">With Icon</app-button>
            <app-button variant="text" [loading]="true">Loading</app-button>
            <app-button variant="text" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: var(--space-3); color: var(--color-text-secondary);">Danger</h4>
          <div style="display: flex; gap: var(--ds-space-3); align-items: center; flex-wrap: wrap;">
            <app-button variant="danger">Delete</app-button>
            <app-button variant="danger" iconLeft="pi-trash">With Icon</app-button>
            <app-button variant="danger" [loading]="true">Deleting</app-button>
            <app-button variant="danger" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: var(--space-3); color: var(--color-text-secondary);">Success</h4>
          <div style="display: flex; gap: var(--ds-space-3); align-items: center; flex-wrap: wrap;">
            <app-button variant="success">Complete</app-button>
            <app-button variant="success" iconLeft="pi-check-circle">With Icon</app-button>
            <app-button variant="success" [loading]="true">Processing</app-button>
            <app-button variant="success" [disabled]="true">Disabled</app-button>
          </div>
        </div>
      </div>
    `,
  }),
};

// ================================
// ICON BUTTON COMPONENT
// ================================

const iconButtonMeta: Meta<IconButtonComponent> = {
  title: "Design System/Icon Button",
  component: IconButtonComponent,
  tags: ["autodocs"],
  decorators: [
    moduleMetadata({
      imports: [
        IconButtonComponent
      ],
    }),
  ],
  argTypes: {
    icon: {
      control: "text",
      description: "PrimeIcons icon class (e.g., pi-plus)",
    },
    ariaLabel: {
      control: "text",
      description: "ARIA label (REQUIRED)",
    },
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "outlined",
        "text",
        "danger",
        "success",
      ],
      description: "Visual style variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size of the button",
    },
  },
};

export const IconButtonBasic: StoryObj<IconButtonComponent> = {
  tags: ["!test"], // Skip test - uses different component meta
  render: () => ({
    template: `
      <div style="display: flex; gap: var(--ds-space-4); align-items: center;">
        <app-icon-button icon="pi-plus" ariaLabel="Add item"></app-icon-button>
        <app-icon-button icon="pi-pencil" ariaLabel="Edit" variant="secondary"></app-icon-button>
        <app-icon-button icon="pi-trash" ariaLabel="Delete" variant="danger"></app-icon-button>
        <app-icon-button icon="pi-check" ariaLabel="Approve" variant="success"></app-icon-button>
      </div>
    `,
  }),
};

export const IconButtonSizes: StoryObj<IconButtonComponent> = {
  tags: ["!test"], // Skip test - uses different component meta
  render: () => ({
    template: `
      <div style="display: flex; gap: var(--ds-space-4); align-items: center;">
        <app-icon-button icon="pi-cog" ariaLabel="Settings" size="sm"></app-icon-button>
        <app-icon-button icon="pi-cog" ariaLabel="Settings" size="md"></app-icon-button>
        <app-icon-button icon="pi-cog" ariaLabel="Settings" size="lg"></app-icon-button>
      </div>
    `,
  }),
};

export const IconButtonVariants: StoryObj<IconButtonComponent> = {
  tags: ["!test"], // Skip test - uses different component meta
  render: () => ({
    template: `
      <div style="display: flex; gap: var(--ds-space-4); align-items: center;">
        <app-icon-button icon="pi-heart" ariaLabel="Like" variant="primary"></app-icon-button>
        <app-icon-button icon="pi-heart" ariaLabel="Like" variant="secondary"></app-icon-button>
        <app-icon-button icon="pi-heart" ariaLabel="Like" variant="outlined"></app-icon-button>
        <app-icon-button icon="pi-heart" ariaLabel="Like" variant="text"></app-icon-button>
        <app-icon-button icon="pi-heart" ariaLabel="Like" variant="danger"></app-icon-button>
        <app-icon-button icon="pi-heart" ariaLabel="Like" variant="success"></app-icon-button>
      </div>
    `,
  }),
};

export const IconButtonStates: StoryObj<IconButtonComponent> = {
  tags: ["!test"], // Skip test - uses different component meta
  render: () => ({
    template: `
      <div style="display: flex; gap: var(--ds-space-4); align-items: center;">
        <app-icon-button icon="pi-refresh" ariaLabel="Refresh" [loading]="true"></app-icon-button>
        <app-icon-button icon="pi-trash" ariaLabel="Delete" [disabled]="true"></app-icon-button>
      </div>
    `,
  }),
};

// ================================
// MIGRATION EXAMPLES
// ================================

export const MigrationExamples: Story = {
  tags: ["!test"], // Skip test - contains icon-button component
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--ds-space-8);">
        <div>
          <h3 style="margin-bottom: var(--space-4); color: var(--color-text-primary);">Migration from PrimeNG</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-6);">
            <div>
              <h4 style="margin-bottom: var(--space-2); color: var(--color-text-secondary);">Before (PrimeNG)</h4>
              <pre style="background: var(--surface-secondary); padding: var(--ds-space-3); border-radius: var(--radius-lg); font-size: var(--ds-font-size-xs); overflow-x: auto;">
&lt;p-button label="Save" (onClick)="save()"&gt;&lt;/p-button&gt;
&lt;p-button label="Delete" severity="danger"&gt;&lt;/p-button&gt;
&lt;p-button label="Cancel" [outlined]="true"&gt;&lt;/p-button&gt;
&lt;p-button label="More" [text]="true"&gt;&lt;/p-button&gt;
&lt;p-button icon="pi pi-check"&gt;&lt;/p-button&gt;</pre>
            </div>
            
            <div>
              <h4 style="margin-bottom: var(--space-2); color: var(--color-text-secondary);">After (App Button)</h4>
              <pre style="background: var(--surface-secondary); padding: var(--ds-space-3); border-radius: var(--radius-lg); font-size: var(--ds-font-size-xs); overflow-x: auto;">
&lt;app-button (clicked)="save()"&gt;Save&lt;/app-button&gt;
&lt;app-button variant="danger"&gt;Delete&lt;/app-button&gt;
&lt;app-button variant="outlined"&gt;Cancel&lt;/app-button&gt;
&lt;app-button variant="text"&gt;More&lt;/app-button&gt;
&lt;app-icon-button icon="pi-check" ariaLabel="Confirm"&gt;&lt;/app-icon-button&gt;</pre>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: var(--space-3); color: var(--color-text-secondary);">Live Examples</h4>
          <div style="display: flex; gap: var(--ds-space-3); align-items: center; flex-wrap: wrap;">
            <app-button (clicked)="alert('Saved!')">Save</app-button>
            <app-button variant="danger">Delete</app-button>
            <app-button variant="outlined">Cancel</app-button>
            <app-button variant="text">More</app-button>
            <app-icon-button icon="pi-check" ariaLabel="Confirm"></app-icon-button>
          </div>
        </div>
      </div>
    `,
  }),
};
