/**
 * FlagFit Pro - PrimeNG 21 Aura Preset Customization
 *
 * Uses definePreset to brand Aura with our green palette (#089949).
 * Design tokens flow through the component tree; CSS vars in token-mapping
 * provide additional overrides for edge cases.
 */

import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const FlagFitPreset = definePreset(Aura, {
  semantic: {
    primary: {
      color: "#089949",
      contrastColor: "#ffffff",
      hoverColor: "#036d35",
      activeColor: "#067a3c",
      50: "#f0f9f7",
      100: "#d0f0eb",
      200: "#a0e4d7",
      300: "#70d8c3",
      400: "#40ccaf",
      500: "#10c96b",
      600: "#0ab85a",
      700: "#089949",
      800: "#067a3c",
      900: "#036d35",
      950: "#024d21",
    },
    focusRing: {
      width: "3px",
      color: "#089949",
      offset: "2px",
    },
  },
});
