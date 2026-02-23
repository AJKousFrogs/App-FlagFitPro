export type InteractionState =
  | "default"
  | "hover"
  | "focus-visible"
  | "pressed"
  | "selected"
  | "disabled"
  | "loading";

export interface InteractionBehaviorSpec {
  component: string;
  states: InteractionState[];
  keyboard: string[];
  aria: string[];
}

export const ELITE_INTERACTION_BEHAVIORS: InteractionBehaviorSpec[] = [
  {
    component: "kpi-card",
    states: ["default", "hover", "focus-visible", "selected", "loading"],
    keyboard: ["Enter opens details", "Space toggles selection"],
    aria: ["role=button", "aria-pressed for selection", "aria-busy while loading"],
  },
  {
    component: "priority-queue-row",
    states: ["default", "hover", "focus-visible", "pressed", "selected", "disabled"],
    keyboard: ["ArrowUp/ArrowDown moves row focus", "Enter opens right drawer"],
    aria: ["aria-sort", "aria-selected", "aria-disabled"],
  },
  {
    component: "daily-protocol-step",
    states: ["default", "focus-visible", "selected", "disabled", "loading"],
    keyboard: ["Tab cycles controls", "Space toggles switch", "Enter confirms step"],
    aria: ["aria-current for active step", "aria-describedby references guidance"],
  },
];
