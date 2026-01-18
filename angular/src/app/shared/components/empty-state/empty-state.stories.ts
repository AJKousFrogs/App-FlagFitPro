import type { Meta, StoryObj } from "@storybook/angular";
import { EmptyStateComponent } from "./empty-state.component";
// Note: play functions temporarily disabled due to Storybook 10 + @storybook/test incompatibility

/**
 * # Empty State Component
 *
 * Displays a consistent empty state when no data is available.
 * Provides guidance to users on how to get started.
 *
 * ## Features
 * - Customizable icon and title
 * - Primary and secondary actions
 * - Benefits list
 * - Help link
 * - Compact variant
 * - Animations
 *
 * ## Usage
 *
 * ```html
 * <app-empty-state
 *   title="No workouts yet"
 *   message="Start tracking your training to see progress"
 *   icon="pi-calendar"
 *   actionLabel="Add Workout"
 *   actionLink="/training/new"
 * ></app-empty-state>
 * ```
 */
const meta: Meta<EmptyStateComponent> = {
  title: "Components/EmptyState",
  component: EmptyStateComponent,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Main title text",
      table: {
        defaultValue: { summary: "No Data Available" },
      },
    },
    message: {
      control: "text",
      description: "Descriptive message below the title",
    },
    icon: {
      control: "text",
      description: "PrimeIcons icon class (without pi- prefix)",
    },
    iconColor: {
      control: "color",
      description: "Color of the icon",
    },
    compact: {
      control: "boolean",
      description: "Use compact variant with less padding",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    actionLabel: {
      control: "text",
      description: "Primary action button label",
    },
    actionLink: {
      control: "text",
      description: "RouterLink for primary action",
    },
    actionIcon: {
      control: "text",
      description: "Icon for primary action button",
    },
    secondaryActionLabel: {
      control: "text",
      description: "Secondary action button label",
    },
    secondaryActionLink: {
      control: "text",
      description: "RouterLink for secondary action",
    },
    helpText: {
      control: "text",
      description: "Help link text",
    },
    helpLink: {
      control: "text",
      description: "Help link URL",
    },
  },
};

export default meta;
type Story = StoryObj<EmptyStateComponent>;

// ================================
// BASIC STORIES
// ================================

export const Default: Story = {
  args: {
    title: "No Data Available",
    message: "There's nothing to show here yet.",
    icon: "pi-inbox",
  },
};

export const WithAction: Story = {
  args: {
    title: "No workouts yet",
    message: "Start tracking your training to see your progress over time.",
    icon: "pi-calendar",
    actionLabel: "Add Your First Workout",
    actionIcon: "pi-plus",
    actionLink: "/training/new",
  },
};

export const WithBenefits: Story = {
  args: {
    title: "Track Your Wellness",
    message: "Daily check-ins help optimize your training.",
    icon: "pi-heart",
    actionLabel: "Start Check-in",
    actionLink: "/wellness/checkin",
    benefits: [
      "Get personalized training recommendations",
      "Track sleep, mood, and energy levels",
      "Prevent overtraining and injuries",
    ],
  },
};

export const WithSecondaryAction: Story = {
  args: {
    title: "No team members",
    message:
      "Invite athletes to join your team and start tracking their progress.",
    icon: "pi-users",
    actionLabel: "Invite Athletes",
    actionIcon: "pi-user-plus",
    actionLink: "/team/invite",
    secondaryActionLabel: "Import from CSV",
    secondaryActionIcon: "pi-upload",
    secondaryActionLink: "/team/import",
  },
};

export const WithHelpLink: Story = {
  args: {
    title: "No analytics data",
    message: "Complete more workouts to see your performance trends.",
    icon: "pi-chart-line",
    actionLabel: "Log Workout",
    actionLink: "/training/new",
    helpText: "Learn how analytics work",
    helpLink: "/help/analytics",
  },
};

export const Compact: Story = {
  args: {
    title: "No results found",
    message: "Try adjusting your search or filters.",
    icon: "pi-search",
    compact: true,
  },
};

// ================================
// CONTEXT-SPECIFIC STORIES
// ================================

export const NoWorkouts: Story = {
  args: {
    title: "No Workouts Logged",
    message: "Start your fitness journey by logging your first workout.",
    icon: "pi-calendar",
    iconColor: "var(--ds-primary-green)",
    actionLabel: "Log Workout",
    actionIcon: "pi-plus",
    actionLink: "/training/new",
    benefits: [
      "Track sets, reps, and weights",
      "Monitor your progress over time",
      "Get AI-powered recommendations",
    ],
    helpText: "How to log workouts",
    helpLink: "/help/workouts",
  },
};

export const NoTeamMembers: Story = {
  args: {
    title: "Your Team is Empty",
    message:
      "Add athletes to start managing your team's training and performance.",
    icon: "pi-users",
    iconColor: "var(--color-status-info)",
    actionLabel: "Add Athlete",
    actionIcon: "pi-user-plus",
    actionLink: "/roster/add",
    secondaryActionLabel: "Import Roster",
    secondaryActionIcon: "pi-upload",
    secondaryActionLink: "/roster/import",
  },
};

export const NoMessages: Story = {
  args: {
    title: "No Messages Yet",
    message: "Start a conversation with your coach or teammates.",
    icon: "pi-comments",
    iconColor: "var(--color-status-warning)",
    actionLabel: "Start Chat",
    actionIcon: "pi-send",
    actionLink: "/chat/new",
  },
};

export const NoSearchResults: Story = {
  args: {
    title: "No Results Found",
    message:
      "We couldn't find anything matching your search. Try different keywords.",
    icon: "pi-search",
    compact: true,
  },
};

export const NoGames: Story = {
  args: {
    title: "No Games Scheduled",
    message: "Add upcoming games to track your team's performance.",
    icon: "pi-flag",
    iconColor: "var(--color-status-error)",
    actionLabel: "Schedule Game",
    actionIcon: "pi-calendar-plus",
    actionLink: "/games/new",
    benefits: [
      "Track game statistics in real-time",
      "Analyze team performance",
      "Compare against opponents",
    ],
  },
};

// ================================
// ALL VARIANTS
// ================================

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--ds-space-6);">
        <div style="border: 1px solid var(--color-border-secondary); border-radius: 12px; overflow: hidden;">
          <app-empty-state
            title="Default Empty State"
            message="Basic empty state with just title and message."
            icon="pi-inbox"
          ></app-empty-state>
        </div>
        
        <div style="border: 1px solid var(--color-border-secondary); border-radius: 12px; overflow: hidden;">
          <app-empty-state
            title="With Action"
            message="Empty state with a call-to-action button."
            icon="pi-plus-circle"
            actionLabel="Take Action"
            actionIcon="pi-arrow-right"
          ></app-empty-state>
        </div>
        
        <div style="border: 1px solid var(--color-border-secondary); border-radius: 12px; overflow: hidden;">
          <app-empty-state
            title="Compact Variant"
            message="Smaller version for inline use."
            icon="pi-filter"
            [compact]="true"
          ></app-empty-state>
        </div>
      </div>
    `,
  }),
};
