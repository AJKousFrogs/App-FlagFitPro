/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./**/*.html",
    "./src/**/*.{html,js}",
    "./angular/src/**/*.{html,ts}",
    "./netlify/functions/**/*.{js,cjs}",
  ],
  theme: {
    extend: {
      // Use your existing CSS variables as Tailwind values
      colors: {
        // Brand colors - Main Colors (Branding & UI)
        "brand-primary": "var(--color-brand-primary)",
        "brand-primary-hover": "var(--color-brand-primary-hover)",
        "brand-secondary": "var(--color-brand-secondary)",
        "brand-accent": "var(--color-brand-accent)",

        // Surface colors - Neutrals
        "surface-primary": "var(--surface-primary)",
        "surface-secondary": "var(--surface-secondary)",
        "surface-tertiary": "var(--surface-tertiary)",

        // Text colors
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",

        // Icon colors
        "icon-primary": "var(--icon-color-primary)",
        "icon-secondary": "var(--icon-color-secondary)",

        // Status colors - Feedback Colors (Status & Alerts)
        success: {
          DEFAULT: "var(--color-status-success)",
          light: "var(--color-status-success-light)",
          subtle: "var(--color-status-success-subtle)",
        },
        error: {
          DEFAULT: "var(--color-status-error)",
          light: "var(--color-status-error-light)",
          subtle: "var(--color-status-error-subtle)",
        },
        warning: {
          DEFAULT: "var(--color-status-warning)",
          light: "var(--color-status-warning-light)",
          subtle: "var(--color-status-warning-subtle)",
        },
        info: {
          DEFAULT: "var(--color-status-info)",
          light: "var(--color-status-info-light)",
          subtle: "var(--color-status-info-subtle)",
        },
      },
      spacing: {
        // Use your 8-point grid spacing
        0: "var(--primitive-space-0)",
        2: "var(--primitive-space-2)",
        4: "var(--primitive-space-4)",
        6: "var(--primitive-space-6)",
        8: "var(--primitive-space-8)",
        12: "var(--primitive-space-12)",
        15: "0.9375rem", // 15px
        16: "var(--primitive-space-16)",
        18: "1.125rem", // 18px
        20: "1.25rem", // 20px
        24: "var(--primitive-space-24)",
        25: "1.5625rem", // 25px
        30: "1.875rem", // 30px
        32: "var(--primitive-space-32)",
        40: "var(--primitive-space-40)",
        48: "var(--primitive-space-48)",
        64: "var(--primitive-space-64)",
      },
      borderRadius: {
        sm: "var(--radius-component-sm)",
        md: "var(--radius-component-md)",
        lg: "var(--radius-component-lg)",
        xl: "var(--radius-component-xl)",
      },
      fontSize: {
        "heading-lg": [
          "var(--typography-heading-lg-size)",
          { lineHeight: "var(--typography-heading-lg-line-height)" },
        ],
        "heading-md": [
          "var(--typography-heading-md-size)",
          { lineHeight: "var(--typography-heading-md-line-height)" },
        ],
        "heading-sm": [
          "var(--typography-heading-sm-size)",
          { lineHeight: "var(--typography-heading-sm-line-height)" },
        ],
        "body-lg": [
          "var(--typography-body-lg-size)",
          { lineHeight: "var(--typography-body-lg-line-height)" },
        ],
        "body-md": [
          "var(--typography-body-md-size)",
          { lineHeight: "var(--typography-body-md-line-height)" },
        ],
        "body-sm": [
          "var(--typography-body-sm-size)",
          { lineHeight: "var(--typography-body-sm-line-height)" },
        ],
      },
      boxShadow: {
        low: "var(--elevation-low)",
        medium: "var(--elevation-medium)",
        high: "var(--elevation-high)",
      },
      zIndex: {
        dropdown: "var(--z-index-dropdown)",
        sticky: "var(--z-index-sticky)",
      },
    },
  },
  plugins: [],
};
