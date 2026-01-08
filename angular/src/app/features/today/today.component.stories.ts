import type { Meta, StoryObj } from "@storybook/angular";
import { applicationConfig } from "@storybook/angular";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import { TodayComponent } from "./today.component";
import { MessageService } from "primeng/api";
import { expect, within } from "storybook/test";

/**
 * Today Component Stories
 *
 * Showcases the Today component in isolation to verify design system compliance.
 * Use this to test component styling without legacy CSS interference.
 */

const meta: Meta<TodayComponent> = {
  title: "Features/Today",
  component: TodayComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimations(), provideRouter([]), MessageService],
    }),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Today's Practice - Primary daily training hub for athletes",
      },
    },
  },
};

export default meta;
type Story = StoryObj<TodayComponent>;

export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify component renders without errors
    await expect(canvasElement).toBeInTheDocument();

    // Check for main container
    const container = canvasElement.querySelector("app-today");
    await expect(container).toBeInTheDocument();
  },
};

export const WithData: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Today component with sample data loaded",
      },
    },
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Today component in loading state",
      },
    },
  },
};
