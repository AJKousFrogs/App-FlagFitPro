export interface Play {
  id: string;
  name: string;
  category: PlayCategory;
  formationName: string;
  diagramUrl?: string;
  description: string;
  keyPoints: string[];
  commonMistakes: string[];
  personalAssignment: PositionAssignment;
  isMemorized: boolean;
  lastStudied?: string;
}

export interface PositionAssignment {
  position: string;
  route?: string;
  responsibility: string;
  preSnapRead?: string;
  postSnapRead?: string;
}

export interface QuizQuestion {
  playId: string;
  playName: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer?: number;
}

export type PlayCategory = "offense" | "defense" | "special-teams";

export const PLAY_CATEGORIES: { label: string; value: PlayCategory }[] = [
  { label: "Offense", value: "offense" },
  { label: "Defense", value: "defense" },
  { label: "Special Teams", value: "special-teams" },
];
