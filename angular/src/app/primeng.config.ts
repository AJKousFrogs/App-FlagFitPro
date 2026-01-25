/**
 * PrimeNG 21 Configuration
 * Provides global PrimeNG settings and pass-through API configuration
 *
 * Note: PrimeNG 21 uses a different configuration approach than earlier versions.
 * Configuration is now done via providePrimeNG() in app.config.ts
 */

/**
 * Pass-Through (pt) API Configuration
 * Allows component-level customization without encapsulation hacks
 */
/** PrimeNG Button Props */
interface ButtonPTProps {
  props: {
    size?: "small" | "large";
    severity?: "primary" | "secondary" | "success" | "danger" | "warning";
    disabled?: boolean;
  };
}

/** PrimeNG Input Props */
interface InputPTProps {
  props: {
    disabled?: boolean;
  };
}

/** PrimeNG DataTable Row Context */
interface DataTableRowContext {
  context: {
    selected?: boolean;
  };
}

export const PRIMENG_PT_CONFIG = {
  // Button pass-through
  button: {
    root: ({ props }: ButtonPTProps) => ({
      class: [
        // Base styles
        "inline-flex items-center justify-center",
        "transition-all duration-200",

        // Size variants
        props.size === "small" && "text-sm py-2 px-3",
        props.size === "large" && "text-lg py-4 px-5",
        !props.size && "py-3 px-4",

        // Severity variants
        props.severity === "primary" &&
          "bg-[var(--ds-primary-green)] text-white border-[var(--ds-primary-green)]",
        props.severity === "secondary" &&
          "bg-transparent text-[var(--ds-primary-green)] border-[var(--ds-primary-green)]",
        props.severity === "success" &&
          "bg-[var(--ds-primary-green)] text-white",
        props.severity === "danger" && "bg-red-600 text-white",
        props.severity === "warning" && "bg-yellow-500 text-yellow-900",

        // Disabled state
        props.disabled && "opacity-60 cursor-not-allowed",
      ],
    }),
  },

  // Card pass-through
  card: {
    root: {
      class:
        "bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--color-border-secondary)]",
    },
    body: {
      class: "p-5",
    },
    title: {
      class: "text-xl font-semibold text-[var(--color-text-primary)] mb-2",
    },
    subtitle: {
      class: "text-sm text-[var(--color-text-secondary)]",
    },
  },

  // Input pass-through
  inputtext: {
    root: ({ props }: InputPTProps) => ({
      class: [
        "w-full",
        "px-4 py-3",
        "rounded-md",
        "border border-[var(--color-border-primary)]",
        "focus:border-[var(--ds-primary-green)] focus:ring-2 focus:ring-[var(--ds-primary-green)]/20",
        "transition-all duration-200",
        props.disabled &&
          "bg-[var(--surface-tertiary)] opacity-60 cursor-not-allowed",
      ],
    }),
  },

  // Dialog pass-through
  dialog: {
    root: {
      class: "rounded-xl shadow-2xl",
    },
    header: {
      class: "px-6 py-5 border-b border-[var(--color-border-primary)]",
    },
    content: {
      class: "px-6 py-5",
    },
    footer: {
      class:
        "px-6 py-4 border-t border-[var(--color-border-primary)] flex justify-end gap-3",
    },
  },

  // DataTable pass-through
  datatable: {
    root: {
      class: "rounded-xl overflow-hidden shadow-sm",
    },
    header: {
      class:
        "bg-[var(--surface-secondary)] px-4 py-4 border-b border-[var(--color-border-secondary)]",
    },
    thead: {
      class: "bg-[var(--surface-secondary)]",
    },
    tbody: {
      class: "bg-[var(--surface-card)]",
    },
    row: ({ context }: DataTableRowContext) => ({
      class: [
        "transition-colors duration-200",
        context.selected && "bg-[var(--ds-primary-green)]/10",
        !context.selected && "hover:bg-[var(--surface-secondary)]",
      ],
    }),
  },
};

/**
 * PrimeNG 21 Theme Configuration
 * Used with providePrimeNG() in app.config.ts
 */
export const PRIMENG_THEME_CONFIG = {
  ripple: false,
  zIndex: {
    modal: 1100,
    overlay: 1000,
    menu: 1000,
    tooltip: 1100,
    toast: 1200,
  },
};
