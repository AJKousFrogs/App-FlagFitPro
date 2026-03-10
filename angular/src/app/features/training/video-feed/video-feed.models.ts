export interface FilterChip {
  label: string;
  value: string;
  type: "position" | "focus" | "skill";
  icon?: string;
  active: boolean;
}
