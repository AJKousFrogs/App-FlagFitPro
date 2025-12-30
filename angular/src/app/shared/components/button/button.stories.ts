import type { Meta, StoryObj } from "@storybook/angular";
import { ButtonComponent } from "./button.component";

/**
 * # Button Component
 *
 * A versatile button component with multiple variants, sizes, and premium interactions.
 *
 * ## Features
 * - **Variants**: primary, secondary, outlined, text, danger, success
 * - **Sizes**: sm, md, lg, xl
 * - **States**: loading, disabled
 * - **Interactions**: ripple effect, hover lift, press feedback
 * - **Accessibility**: ARIA labels, keyboard navigation
 *
 * ## Usage
 *
 * ```html
 * <app-button variant="primary" (clicked)="handleClick($event)">
 *   Click Me
 * </app-button>
 * ```
 */
const meta: Meta<ButtonComponent> = {
  title: "Components/Button",
  component: ButtonComponent,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outlined", "text", "danger", "success"],
      description: "Visual style variant of the button",
      table: {
        defaultValue: { summary: "primary" },
      },
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "Size of the button",
      table: {
        defaultValue: { summary: "md" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    loading: {
      control: "boolean",
      description: "Whether to show loading spinner",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    icon: {
      control: "text",
      description: "PrimeIcons icon class (e.g., pi-check)",
    },
    iconPosition: {
      control: "select",
      options: ["left", "right"],
      description: "Position of the icon",
      table: {
        defaultValue: { summary: "left" },
      },
    },
    iconOnly: {
      control: "boolean",
      description: "Whether to show only the icon",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    rounded: {
      control: "boolean",
      description: "Whether to use fully rounded corners",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    block: {
      control: "boolean",
      description: "Whether the button should be full width",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    ariaLabel: {
      control: "text",
      description: "ARIA label for accessibility",
    },
  },
  args: {
    variant: "primary",
    size: "md",
    disabled: false,
    loading: false,
    iconOnly: false,
    rounded: false,
    block: false,
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

// ================================
// VARIANT STORIES
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
// SIZE STORIES
// ================================

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <app-button size="sm">Small</app-button>
        <app-button size="md">Medium</app-button>
        <app-button size="lg">Large</app-button>
        <app-button size="xl">Extra Large</app-button>
      </div>
    `,
  }),
};

// ================================
// STATE STORIES
// ================================

export const Loading: Story = {
  args: {
    loading: true,
  },
  render: (args) => ({
    props: args,
    template: `<app-button [loading]="loading">Loading...</app-button>`,
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
// ICON STORIES
// ================================

export const WithIcon: Story = {
  args: {
    icon: "pi-check",
    iconPosition: "left",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [icon]="icon" [iconPosition]="iconPosition">Save Changes</app-button>`,
  }),
};

export const IconRight: Story = {
  args: {
    icon: "pi-arrow-right",
    iconPosition: "right",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [icon]="icon" [iconPosition]="iconPosition">Continue</app-button>`,
  }),
};

export const IconOnly: Story = {
  args: {
    icon: "pi-plus",
    iconOnly: true,
    ariaLabel: "Add item",
  },
  render: (args) => ({
    props: args,
    template: `<app-button [icon]="icon" [iconOnly]="iconOnly" [ariaLabel]="ariaLabel"></app-button>`,
  }),
};

// ================================
// SHAPE STORIES
// ================================

export const Rounded: Story = {
  args: {
    rounded: true,
  },
  render: (args) => ({
    props: args,
    template: `<app-button [rounded]="rounded">Rounded Button</app-button>`,
  }),
};

export const Block: Story = {
  args: {
    block: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 300px;">
        <app-button [block]="block">Full Width Button</app-button>
      </div>
    `,
  }),
};

// ================================
// ALL VARIANTS
// ================================

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div>
          <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">Primary</h4>
          <div style="display: flex; gap: 12px; align-items: center;">
            <app-button variant="primary">Default</app-button>
            <app-button variant="primary" icon="pi-check">With Icon</app-button>
            <app-button variant="primary" [loading]="true">Loading</app-button>
            <app-button variant="primary" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">Secondary</h4>
          <div style="display: flex; gap: 12px; align-items: center;">
            <app-button variant="secondary">Default</app-button>
            <app-button variant="secondary" icon="pi-check">With Icon</app-button>
            <app-button variant="secondary" [loading]="true">Loading</app-button>
            <app-button variant="secondary" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">Outlined</h4>
          <div style="display: flex; gap: 12px; align-items: center;">
            <app-button variant="outlined">Default</app-button>
            <app-button variant="outlined" icon="pi-check">With Icon</app-button>
            <app-button variant="outlined" [loading]="true">Loading</app-button>
            <app-button variant="outlined" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">Text</h4>
          <div style="display: flex; gap: 12px; align-items: center;">
            <app-button variant="text">Default</app-button>
            <app-button variant="text" icon="pi-check">With Icon</app-button>
            <app-button variant="text" [loading]="true">Loading</app-button>
            <app-button variant="text" [disabled]="true">Disabled</app-button>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 12px; color: var(--color-text-secondary);">Danger</h4>
          <div style="display: flex; gap: 12px; align-items: center;">
            <app-button variant="danger">Delete</app-button>
            <app-button variant="danger" icon="pi-trash">With Icon</app-button>
            <app-button variant="danger" [loading]="true">Deleting</app-button>
            <app-button variant="danger" [disabled]="true">Disabled</app-button>
          </div>
        </div>
      </div>
    `,
  }),
};

