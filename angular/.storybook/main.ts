import type { StorybookConfig } from "@storybook/angular";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "@storybook/addon-viewport",
    "@storybook/addon-docs",
  ],
  framework: {
    name: "@storybook/angular",
    options: {},
  },
  docs: {},
  staticDirs: ["../src/assets"],
  core: {
    disableTelemetry: true,
  },
};

export default config;
