export interface TrainingExercise {
  id: string;
  name: string;
  category: string;
  duration: number;
  intensity: "low" | "medium" | "high";
  equipment: string[];
  description: string;
  videoUrl?: string;
  aiRecommended?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  aiRecommended: boolean;
}

export interface TrainingTimelineEvent {
  type: string;
  icon: string;
  title: string;
  duration: number;
  description: string;
  aiGenerated: boolean;
}
