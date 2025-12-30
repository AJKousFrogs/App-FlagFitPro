import type { Preview } from "@storybook/angular";
import { setCompodocJson } from "@storybook/addon-docs/angular";

// Import global styles
import "../src/styles.scss";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#f8faf9",
        },
        {
          name: "dark",
          value: "#171717",
        },
        {
          name: "surface",
          value: "#ffffff",
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "667px" },
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
        },
        largeDesktop: {
          name: "Large Desktop",
          styles: { width: "1920px", height: "1080px" },
        },
      },
    },
    docs: {
      toc: true,
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark", "auto"],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme;
      document.body.setAttribute("data-theme", theme);
      return story();
    },
  ],
};

export default preview;

