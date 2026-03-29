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
    severity?: "primary" | "secondary" | "success" | "danger" | "warning" | "help" | "info";
    disabled?: boolean;
    text?: boolean;
    outlined?: boolean;
    link?: boolean;
  };
}

/** PrimeNG Input Props */
interface InputPTProps {
  props?: {
    disabled?: boolean;
    invalid?: boolean;
  };
}

/** PrimeNG DataTable Row Context */
interface DataTableRowContext {
  context?: {
    selected?: boolean;
    index?: number;
  };
}

/** Design-system utility classes (from scss/utilities + design-system-tokens) */
const DS = {
  button: {
    root: "d-inline-flex align-center justify-center gap-2 transition-all font-semibold",
    sm: "text-sm py-2 px-3",
    md: "py-3 px-6",
    lg: "text-lg py-4 px-8",
    disabled: "opacity-50 cursor-not-allowed",
    primary: "bg-brand text-on-brand border-brand hover:bg-brand-dark shadow-sm",
    secondary: "bg-secondary text-primary border-subtle hover:bg-tertiary",
    text: "bg-transparent border-transparent hover:bg-secondary shadow-none",
  },
  card: "bg-primary rounded-2xl shadow-md border border-subtle overflow-hidden",
  input: "w-full px-4 py-3 rounded-lg border border-primary transition-focus",
  dialog: "rounded-2xl shadow-2xl border border-subtle backdrop-blur-md",
  table: "rounded-2xl overflow-hidden shadow-sm border border-subtle",
  tabs: {
    root: "bg-secondary p-1 rounded-xl border border-subtle d-inline-flex",
    tab: "px-5 py-2 rounded-lg text-sm font-medium transition-all",
    active: "bg-primary text-brand shadow-sm font-semibold",
  },
  menu: "bg-primary rounded-xl shadow-lg border border-subtle p-2",
  breadcrumb: "bg-transparent border-none p-0 m-0",
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
        props?.text && DS.button.text,
        !props?.text && !props?.outlined && !props?.link && (props?.severity === 'secondary' ? DS.button.secondary : DS.button.primary),
      ].filter(Boolean),
    }),
  },

  card: {
    root: {
      class: DS.card,
    },
    body: {
      class: "p-6 d-flex flex-col gap-4",
    },
    header: {
      class: "px-6 pt-6",
    },
    footer: {
      class: "px-6 pb-6",
    },
    title: {
      class: "text-xl font-bold text-primary m-0",
    },
    subtitle: {
      class: "text-sm text-secondary m-0",
    },
  },

  inputtext: {
    root: ({ props }: InputPTProps = {}) => ({
      class: [
        DS.input,
        props?.invalid ? "border-error" : "border-primary",
        props?.disabled && DS.button.disabled,
      ].filter(Boolean),
    }),
  },

  dialog: {
    root: {
      class: DS.dialog,
    },
    header: {
      class: "px-6 py-5 border-b border-subtle d-flex align-center justify-between",
    },
    content: {
      class: "px-6 py-6",
    },
    footer: {
      class: "px-6 py-4 border-t border-subtle d-flex justify-end gap-3",
    },
    mask: {
      class: "backdrop-blur-sm bg-black-alpha-40",
    }
  },

  table: {
    root: {
      class: DS.table,
    },
    header: {
      class: "bg-secondary px-6 py-4 border-b border-subtle",
    },
    thead: {
      class: "bg-secondary",
    },
    headercell: {
      class: "px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider",
    },
    tbody: {
      class: "bg-primary",
    },
    bodycell: {
      class: "px-6 py-4 border-b border-subtle",
    },
    row: ({ context }: DataTableRowContext = {}) => ({
      class: [
        "transition-colors hover:bg-secondary",
        context?.selected ? "bg-selected" : "",
      ].filter(Boolean),
    }),
  },

  tabs: {
    root: {
      class: "w-full",
    },
    tablist: {
      class: DS.tabs.root,
    },
    tab: ({ context }: any) => ({
      class: [
        DS.tabs.tab,
        context?.active ? DS.tabs.active : "text-secondary hover:text-primary hover:bg-primary-alpha-50",
      ].filter(Boolean),
    }),
    activebar: {
      class: "d-none", // Hidden in modern design
    },
    panelcontainer: {
      class: "pt-6 bg-transparent",
    }
  },

  menu: {
    root: {
      class: DS.menu,
    },
    list: {
      class: "d-flex flex-col gap-1 p-0 m-0 list-none",
    },
    itemlink: {
      class: "px-4 py-3 rounded-lg d-flex align-center gap-3 text-secondary transition-all hover:bg-brand-subtle hover:text-brand",
    },
    itemicon: {
      class: "text-lg",
    },
    itemtext: {
      class: "font-medium",
    }
  },

  breadcrumb: {
    root: {
      class: DS.breadcrumb,
    },
    list: {
      class: "d-flex align-center gap-2 p-0 m-0 list-none",
    },
    itemlink: {
      class: "text-xs text-secondary hover:text-brand transition-colors no-underline",
    },
    separator: {
      class: "text-muted opacity-50 mx-1",
    }
  },

  paginator: {
    root: {
      class: "d-flex align-center justify-center gap-2 py-4 bg-transparent",
    },
    pages: {
      class: "d-flex align-center gap-1",
    },
    page: ({ context }: any) => ({
      class: [
        "w-10 h-10 d-flex align-center justify-center rounded-lg transition-all",
        context?.active ? "bg-brand text-on-brand shadow-sm font-bold" : "text-secondary hover:bg-secondary",
      ].filter(Boolean),
    }),
    action: {
      class: "w-10 h-10 d-flex align-center justify-center rounded-lg text-secondary hover:bg-secondary transition-all",
    }
  },

  tooltip: {
    root: {
      class: "max-w-xs",
    },
    text: {
      class: "px-3 py-2 bg-neutral-800 text-white text-xs rounded-md shadow-lg font-medium",
    }
  }
};
