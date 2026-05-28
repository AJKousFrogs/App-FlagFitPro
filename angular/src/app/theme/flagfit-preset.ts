/**
 * FlagFit Pro — PrimeNG preset bridge (minimal, static-first rebuild).
 *
 * PrimeNG still needs a preset object at bootstrap. During the rebuild this is a
 * lean Aura-based bridge using the dark-first brand green. The full token-driven
 * theme (mapping these to the new `tokens.css` design system) is reintroduced in
 * Phase E. Values reference `var(--…)` with literal fallbacks so it renders
 * correctly before the new tokens land.
 */
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const FlagFitPreset = definePreset(Aura, {
  semantic: {
    primary: {
      color: "var(--accent, #00E07A)",
      contrastColor: "var(--text-inverse, #0A0B0D)",
      hoverColor: "var(--accent-dim, #00A85C)",
      activeColor: "var(--accent-dim, #00A85C)",
      50: "#e6fff4",
      100: "#b3ffdd",
      200: "#80ffc6",
      300: "#4dffaf",
      400: "#1aff98",
      500: "#00e07a",
      600: "#00b362",
      700: "#008649",
      800: "#005931",
      900: "#002c18",
      950: "#00160c",
    },
  },
});
