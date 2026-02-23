/**
 * PrimeNG 21 Configuration
 * Provides global PrimeNG settings and pass-through API configuration
 *
 * Uses design-system utility classes (no Tailwind dependency).
 * Styling primarily via design tokens in primeng-integration + primeng-theme.scss.
 */

/** PrimeNG Button Props */
interface ButtonPTProps {
  props?: {
    size?: "small" | "large";
    severity?: "primary" | "secondary" | "success" | "danger" | "warning";
    disabled?: boolean;
  };
}

/** PrimeNG Input Props */
interface InputPTProps {
  props?: {
    disabled?: boolean;
  };
}

/** PrimeNG DataTable Row Context */
interface DataTableRowContext {
  context?: {
    selected?: boolean;
  };
}

/** Design-system utility classes (from scss/utilities + design-system-tokens) */
const DS = {
  button: {
    root: "d-inline-flex align-center justify-center gap-2",
    sm: "text-sm py-2 px-3",
    md: "py-3 px-6",
    lg: "text-lg py-4 px-5",
    disabled: "opacity-50 cursor-not-allowed",
  },
  card: "bg-secondary rounded-xl shadow-sm border border-secondary p-5",
  input: "w-full px-4 py-3 rounded-md border border-primary",
  dialog: "rounded-xl shadow-2xl",
  table: "rounded-xl overflow-hidden shadow-sm",
} as const;

export const PRIMENG_PT_CONFIG = {
  button: {
    root: ({ props }: ButtonPTProps = {}) => ({
      class: [
        DS.button.root,
        props?.size === "small" && DS.button.sm,
        props?.size === "large" && DS.button.lg,
        !props?.size && DS.button.md,
        props?.disabled && DS.button.disabled,
      ].filter(Boolean),
    }),
  },

  card: {
    root: {
      class: DS.card,
    },
    body: {
      class: "p-5",
    },
    title: {
      class: "text-xl font-semibold text-primary mb-2",
    },
    subtitle: {
      class: "text-sm text-secondary",
    },
  },

  inputtext: {
    root: ({ props }: InputPTProps = {}) => ({
      class: [
        DS.input,
        "border-primary",
        props?.disabled && DS.button.disabled,
      ].filter(Boolean),
    }),
  },

  dialog: {
    root: {
      class: DS.dialog,
    },
    header: {
      class: "px-6 py-5 border-b-primary",
    },
    content: {
      class: "px-6 py-5",
    },
    footer: {
      class: "px-6 py-4 border-t-primary d-flex justify-end gap-3",
    },
  },

  table: {
    root: {
      class: DS.table,
    },
    header: {
      class: "bg-secondary px-4 py-4 border-b-primary",
    },
    thead: {
      class: "bg-secondary",
    },
    tbody: {
      class: "bg-primary",
    },
    row: ({ context }: DataTableRowContext = {}) => ({
      class: [
        "transition-colors",
        context?.selected ? "bg-selected" : "",
      ].filter(Boolean),
    }),
  },
};
