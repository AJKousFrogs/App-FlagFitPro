export interface Metric {
  icon: string;
  value: string;
  label: string;
  trend: string;
  trendType: "positive" | "negative" | "neutral";
}

export interface DevelopmentGoal {
  id: string;
  metricType: "speed" | "agility" | "strength" | "power" | "skill";
  metricName: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  startValue: number;
  deadline: Date;
  coachNote: string;
  status: "active" | "achieved" | "missed";
}

export interface AnalyticsAcwrData {
  acwr: number | null;
  acuteLoad: number;
  chronicLoad: number;
  acuteDays: number;
  chronicDays: number;
  riskZone: string;
  message: string;
}
