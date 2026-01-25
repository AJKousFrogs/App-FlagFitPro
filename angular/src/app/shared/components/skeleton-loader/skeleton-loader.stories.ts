import type { Meta, StoryObj } from "@storybook/angular";
import {
  SkeletonLoaderComponent,
  SkeletonRepeatComponent,
} from "./skeleton-loader.component";
// Note: play functions temporarily disabled due to Storybook 10 + @storybook/test incompatibility

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

const storyStyles = `
  .story-width-sm { width: 100%; max-width: var(--grid-card-min-sm); }
  .story-width-md { width: 100%; max-width: var(--grid-card-min-md); }
  .story-width-lg { width: 100%; max-width: var(--grid-card-min-lg); }
  .story-width-xl { width: 100%; max-width: var(--grid-card-min-xl); }
  .story-width-2xl { width: 100%; max-width: var(--dialog-max-width-xl); }
  .story-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--grid-card-min-md), 1fr)); gap: var(--space-8); }
  .story-stack { display: flex; flex-direction: column; gap: var(--space-2); }
  .story-row { display: flex; gap: var(--space-4); align-items: center; flex-wrap: wrap; }
  .story-title { margin: 0 0 var(--space-4); color: var(--color-text-secondary); }
`;

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
      <div class="story-width-md">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
    styles: [storyStyles],
  }),
};

export const StatCard: Story = {
  args: {
    variant: "stat-card",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="story-width-md">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
    styles: [storyStyles],
  }),
};

export const WorkoutCard: Story = {
  args: {
    variant: "workout-card",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="story-width-lg">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
    styles: [storyStyles],
  }),
};

export const PlayerCard: Story = {
  args: {
    variant: "player-card",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="story-width-sm">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
    styles: [storyStyles],
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
      <div class="story-width-2xl">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
    styles: [storyStyles],
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
      <div class="story-width-2xl">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
    styles: [storyStyles],
  }),
};

export const DashboardWidget: Story = {
  args: {
    variant: "dashboard-widget",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="story-width-xl">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
    styles: [storyStyles],
  }),
};

export const Metric: Story = {
  args: {
    variant: "metric",
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="story-width-sm">
        <app-skeleton-loader [variant]="variant"></app-skeleton-loader>
      </div>
    `,
    styles: [storyStyles],
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
      <div class="story-grid">
        <div>
          <h4 class="story-title">Text & Title</h4>
          <div class="story-stack">
            <app-skeleton-loader variant="title" width="60%"></app-skeleton-loader>
            <app-skeleton-loader variant="text" width="100%"></app-skeleton-loader>
            <app-skeleton-loader variant="text" width="80%"></app-skeleton-loader>
            <app-skeleton-loader variant="text" width="90%"></app-skeleton-loader>
          </div>
        </div>
        
        <div>
          <h4 class="story-title">Avatars & Badges</h4>
          <div class="story-row">
            <app-skeleton-loader variant="avatar" size="var(--avatar-size-sm)"></app-skeleton-loader>
            <app-skeleton-loader variant="avatar" size="var(--avatar-size-lg)"></app-skeleton-loader>
            <app-skeleton-loader variant="avatar" size="var(--avatar-size-2xl)"></app-skeleton-loader>
            <app-skeleton-loader variant="badge"></app-skeleton-loader>
          </div>
        </div>
        
        <div>
          <h4 class="story-title">Card</h4>
          <app-skeleton-loader variant="card"></app-skeleton-loader>
        </div>
        
        <div>
          <h4 class="story-title">Stat Card</h4>
          <app-skeleton-loader variant="stat-card"></app-skeleton-loader>
        </div>
        
        <div>
          <h4 class="story-title">List Items</h4>
          <app-skeleton-repeat variant="list-item" [count]="3" [staggerDelay]="75"></app-skeleton-repeat>
        </div>
        
        <div>
          <h4 class="story-title">Chart</h4>
          <app-skeleton-loader variant="chart"></app-skeleton-loader>
        </div>
      </div>
    `,
    styles: [storyStyles],
  }),
};
