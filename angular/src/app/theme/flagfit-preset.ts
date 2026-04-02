/**
 * FlagFit Pro - PrimeNG preset bridge
 *
 * PrimeNG still needs a preset object at app bootstrap, but the actual visual
 * values come from the canonical CSS design tokens. This avoids maintaining a
 * second hardcoded palette in TypeScript.
 */

import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const FlagFitPreset = definePreset(Aura, {
  semantic: {
    primary: {
      color: "var(--color-brand-primary)",
      contrastColor: "var(--color-text-on-primary)",
      hoverColor: "var(--color-brand-primary-hover)",
      activeColor: "var(--color-brand-primary-active)",
      50: "var(--primitive-primary-50)",
      100: "var(--primitive-primary-100)",
      200: "var(--primitive-primary-200)",
      300: "var(--primitive-primary-300)",
      400: "var(--primitive-primary-400)",
      500: "var(--primitive-primary-500)",
      600: "var(--primitive-primary-600)",
      700: "var(--primitive-primary-700)",
      800: "var(--primitive-primary-800)",
      900: "var(--primitive-primary-900)",
      950: "var(--primitive-primary-900)",
    },
    focusRing: {
      width: "var(--focus-ring-width)",
      color: "var(--color-brand-primary)",
      offset: "var(--focus-ring-offset)",
    },
  },
});
