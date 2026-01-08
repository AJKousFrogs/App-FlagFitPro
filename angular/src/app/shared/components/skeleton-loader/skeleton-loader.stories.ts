import type { Meta, StoryObj } from "@storybook/angular";
import {
  SkeletonLoaderComponent,
  SkeletonRepeatComponent,
} from "./skeleton-loader.component";
import { expect, within } from "storybook/test";

/**
 * # Skeleton Loader Component
 *
 * Premium skeleton loading states with smooth shimmer animations.
 * Use to indicate loading content and improve perceived performance.
 *
 * ## Features
 * - 17+ variants for different content types
 * - Shimmer animation effect
 * - Stagger animation support
 * - Dark mode compatible
 * - Reduced motion support
 *
 * ## Usage
 *
 * ```html
 * <app-skeleton-loader variant="card"></app-skeleton-loader>
 * <app-skeleton-repeat variant="list-item" [count]="5"></app-skeleton-repeat>
 * ```
 */
const meta: Meta<SkeletonLoaderComponent> = {
  title: "Components/SkeletonLoader",
  component: SkeletonLoaderComponent,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "text",
        "title",
        "avatar",
        "thumbnail",
        "card",
        "table-row",
        "chart",
        "stat-card",
        "workout-card",
        "player-card",
        "list-item",
        "paragraph",
        "button",
        "badge",
        "metric",
        "profile-header",
        "dashboard-widget",
      ],
      description: "Type of skeleton to display",
      table: {
        defaultValue: { summary: "text" },
      },
    },
    width: {
      control: "text",
      description: "Width of the skeleton",
      table: {
        defaultValue: { summary: "100%" },
      },
    },
    height: {
      control: "text",
      description: "Height of the skeleton",
      table: {
        defaultValue: { summary: "20px" },
      },
    },
    delay: {
      control: "number",
      description: "Animation delay in milliseconds",
      table: {
        defaultValue: { summary: "0" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<SkeletonLoaderComponent>;

// ================================
// BASIC VARIANTS
// ================================

export const Text: Story = {
  args: {
    variant: "text",
    width: "80%",
  },
  play: async ({ canvasElement }) => {
    // Verify skeleton renders with shimmer animation
    const skeleton = canvasElement.querySelector(".skeleton");
    await expect(skeleton).toBeInTheDocument();
    await expect(skeleton).toHaveClass("skeleton--text");
  },
};

export const Title: Story = {
  args: {
    variant: "title",
    width: "60%",
  },
};

export const Avatar: Story = {
  args: {
    variant: "avatar",
    size: "48px",
  },
};

export const Thumbnail: Story = {
  args: {
    variant: "thumbnail",
    width: "200px",
    height: "150px",
  },
};

export const Button: Story = {
  args: {
    variant: "button",
    width: "120px",
  },
};

export const Badge: Story = {
  args: {
    variant: "badge",
  },
};

// ================================
// COMPOUND VARIANTS
// ================================

export const Card: Story = {
  args: {
    variant: "card",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 300px;">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Verify card skeleton renders
    const skeleton = canvasElement.querySelector(".skeleton--card");
    await expect(skeleton).toBeInTheDocument();
  },
};

export const StatCard: Story = {
  args: {
    variant: "stat-card",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 250px;">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
  }),
};

export const WorkoutCard: Story = {
  args: {
    variant: "workout-card",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 350px;">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
  }),
};

export const PlayerCard: Story = {
  args: {
    variant: "player-card",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 200px;">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
  }),
};

export const ListItem: Story = {
  args: {
    variant: "list-item",
  },
};

export const TableRow: Story = {
  args: {
    variant: "table-row",
    columns: [1, 2, 1, 1],
  },
};

export const Chart: Story = {
  args: {
    variant: "chart",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 500px;">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
  }),
};

export const Paragraph: Story = {
  args: {
    variant: "paragraph",
  },
};

export const ProfileHeader: Story = {
  args: {
    variant: "profile-header",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 500px;">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
  }),
};

export const DashboardWidget: Story = {
  args: {
    variant: "dashboard-widget",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 400px;">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
  }),
};

export const Metric: Story = {
  args: {
    variant: "metric",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 200px;">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
  }),
};

// ================================
// REPEAT COMPONENT
// ================================

export const RepeatedListItems: Story = {
  render: () => ({
    template: `
      <app-skeleton-repeat 
        variant="list-item" 
        [count]="5"
        [staggerDelay]="75"
      ></app-skeleton-repeat>
    `,
  }),
};

export const RepeatedCards: Story = {
  render: () => ({
    template: `
      <app-skeleton-repeat 
        variant="card" 
        [count]="3"
        layout="grid"
        [staggerDelay]="100"
      ></app-skeleton-repeat>
    `,
  }),
};

export const RepeatedTableRows: Story = {
  render: () => ({
    template: `
      <app-skeleton-repeat 
        variant="table-row" 
        [count]="5"
        [columns]="[1, 2, 1, 1]"
        [staggerDelay]="50"
      ></app-skeleton-repeat>
    `,
  }),
};

// ================================
// ALL VARIANTS SHOWCASE
// ================================

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px;">
        <div>
          <h4 style="margin-bottom: 16px; color: var(--color-text-secondary);">Text & Title</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <app-skeleton-loader variant="title" width="60%"></app-skeleton-loader>
            <app-skeleton-loader variant="text" width="100%"></app-skeleton-loader>
            <app-skeleton-loader variant="text" width="80%"></app-skeleton-loader>
            <app-skeleton-loader variant="text" width="90%"></app-skeleton-loader>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 16px; color: var(--color-text-secondary);">Avatars & Badges</h4>
          <div style="display: flex; gap: 16px; align-items: center;">
            <app-skeleton-loader variant="avatar" size="32px"></app-skeleton-loader>
            <app-skeleton-loader variant="avatar" size="48px"></app-skeleton-loader>
            <app-skeleton-loader variant="avatar" size="64px"></app-skeleton-loader>
            <app-skeleton-loader variant="badge"></app-skeleton-loader>
          </div>
        </div>
        
        <div>
          <h4 style="margin-bottom: 16px; color: var(--color-text-secondary);">Card</h4>
          <app-skeleton-loader variant="card"></app-skeleton-loader>
        </div>
        
        <div>
          <h4 style="margin-bottom: 16px; color: var(--color-text-secondary);">Stat Card</h4>
          <app-skeleton-loader variant="stat-card"></app-skeleton-loader>
        </div>
        
        <div>
          <h4 style="margin-bottom: 16px; color: var(--color-text-secondary);">List Items</h4>
          <app-skeleton-repeat variant="list-item" [count]="3" [staggerDelay]="75"></app-skeleton-repeat>
        </div>
        
        <div>
          <h4 style="margin-bottom: 16px; color: var(--color-text-secondary);">Chart</h4>
          <app-skeleton-loader variant="chart"></app-skeleton-loader>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    // Verify all variant sections render
    const sections = canvasElement.querySelectorAll("h4");
    await expect(sections.length).toBeGreaterThanOrEqual(6);

    // Verify skeleton elements render with animation
    const skeletons = canvasElement.querySelectorAll(".skeleton");
    await expect(skeletons.length).toBeGreaterThan(0);
  },
};
