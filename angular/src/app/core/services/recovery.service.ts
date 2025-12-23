import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";

export interface RecoveryMetric {
  name: string;
  value: number;
  unit: string;
  percentage: number;
  icon: string;
  color: string;
}

export interface RecoveryProtocol {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  priority: "high" | "medium" | "low";
  evidenceLevel: string;
  studyCount: number;
  benefits: string[];
  steps: ProtocolStep[];
}

export interface ProtocolStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  icon: string;
  completed: boolean;
  active: boolean;
}

export interface RecoverySession {
  id: string;
  protocol: RecoveryProtocol;
  startTime: Date;
  duration: number;
  progress: number;
  paused: boolean;
}

export interface RecoveryData {
  overallScore: number;
  metrics: RecoveryMetric[];
}

export interface ResearchInsight {
  id: string;
  title: string;
  summary: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  category: string;
}

@Injectable({
  providedIn: "root",
})
export class RecoveryService {
  private apiService = inject(ApiService);

  /**
   * Get current recovery metrics
   */
  getRecoveryMetrics(): Observable<RecoveryData> {
    return this.apiService
      .get<RecoveryData>(API_ENDPOINTS.recovery.metrics)
      .pipe(
        map((response) => response.data || this.getMockRecoveryData()),
        catchError(() => of(this.getMockRecoveryData())),
      );
  }

  /**
   * Get recommended recovery protocols based on current metrics
   */
  getRecommendedProtocols(): Observable<RecoveryProtocol[]> {
    return this.apiService
      .get<RecoveryProtocol[]>(API_ENDPOINTS.recovery.protocols)
      .pipe(
        map((response) => response.data || []),
        catchError(() => of(this.getMockProtocols())),
      );
  }

  /**
   * Start a recovery session
   */
  startRecoverySession(
    protocol: RecoveryProtocol,
  ): Observable<RecoverySession> {
    return this.apiService
      .post<RecoverySession>(API_ENDPOINTS.recovery.startSession, {
        protocolId: protocol.id,
      })
      .pipe(
        map((response) => {
          const session = response.data || this.createMockSession(protocol);
          return {
            ...session,
            startTime: new Date(session.startTime),
          };
        }),
        catchError(() => of(this.createMockSession(protocol))),
      );
  }

  /**
   * Complete current recovery session
   */
  completeRecoverySession(): Observable<boolean> {
    return this.apiService
      .post<boolean>(API_ENDPOINTS.recovery.completeSession, {})
      .pipe(
        map((response) => response.success || false),
        catchError(() => of(false)),
      );
  }

  /**
   * Stop current recovery session
   */
  stopRecoverySession(): Observable<boolean> {
    return this.apiService
      .post<boolean>(API_ENDPOINTS.recovery.stopSession, {})
      .pipe(
        map((response) => response.success || false),
        catchError(() => of(false)),
      );
  }

  /**
   * Get research insights related to recovery
   */
  getResearchInsights(): Observable<ResearchInsight[]> {
    return this.apiService
      .get<ResearchInsight[]>(API_ENDPOINTS.recovery.researchInsights)
      .pipe(
        map((response) => response.data || []),
        catchError(() => of(this.getMockResearchInsights())),
      );
  }

  /**
   * Get weekly recovery trends
   */
  getWeeklyRecoveryTrends(): Observable<number[]> {
    return this.apiService
      .get<number[]>(API_ENDPOINTS.recovery.weeklyTrends)
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([75, 78, 72, 85, 80, 77, 82])),
      );
  }

  /**
   * Get protocol effectiveness data
   */
  getProtocolEffectiveness(): Observable<Record<string, number>> {
    return this.apiService
      .get<Record<string, number>>(API_ENDPOINTS.recovery.protocolEffectiveness)
      .pipe(
        map((response) => response.data || {}),
        catchError(() =>
          of({
            Cryotherapy: 8.5,
            Compression: 7.8,
            "Manual Therapy": 8.2,
            "Heat Therapy": 7.5,
          }),
        ),
      );
  }

  // Mock data methods for development
  private getMockRecoveryData(): RecoveryData {
    return {
      overallScore: 78,
      metrics: [
        {
          name: "Sleep Quality",
          value: 8.2,
          unit: "/10",
          percentage: 82,
          icon: "pi pi-moon",
          color: "#10c96b",
        },
        {
          name: "Heart Rate Variability",
          value: 45,
          unit: "ms",
          percentage: 75,
          icon: "pi pi-heart",
          color: "#10c96b",
        },
        {
          name: "Muscle Soreness",
          value: 3,
          unit: "/10",
          percentage: 70,
          icon: "pi pi-exclamation-circle",
          color: "#f1c40f",
        },
        {
          name: "Stress Level",
          value: 4,
          unit: "/10",
          percentage: 60,
          icon: "pi pi-info-circle",
          color: "#f1c40f",
        },
      ],
    };
  }

  private getMockProtocols(): RecoveryProtocol[] {
    return [
      {
        id: "1",
        name: "Cold Water Immersion",
        description:
          "15-minute cold water immersion protocol shown to reduce muscle soreness and inflammation.",
        category: "Cryotherapy",
        duration: 15,
        priority: "high",
        evidenceLevel: "Strong",
        studyCount: 24,
        benefits: [
          "Reduces muscle soreness",
          "Decreases inflammation",
          "Improves recovery time",
          "Enhances sleep quality",
        ],
        steps: [
          {
            id: "1",
            title: "Preparation",
            description: "Prepare cold water bath (10-15°C)",
            duration: 2,
            icon: "pi pi-cog",
            completed: false,
            active: false,
          },
          {
            id: "2",
            title: "Immersion",
            description: "Immerse body up to shoulders for 10 minutes",
            duration: 10,
            icon: "pi pi-water",
            completed: false,
            active: false,
          },
          {
            id: "3",
            title: "Warm-up",
            description: "Gradual warm-up with light movement",
            duration: 3,
            icon: "pi pi-sun",
            completed: false,
            active: false,
          },
        ],
      },
      {
        id: "2",
        name: "Compression Therapy",
        description:
          "30-minute compression session using compression garments or devices.",
        category: "Compression",
        duration: 30,
        priority: "medium",
        evidenceLevel: "Moderate",
        studyCount: 18,
        benefits: [
          "Improves circulation",
          "Reduces swelling",
          "Accelerates recovery",
        ],
        steps: [
          {
            id: "1",
            title: "Setup",
            description: "Apply compression garments or device",
            duration: 2,
            icon: "pi pi-cog",
            completed: false,
            active: false,
          },
          {
            id: "2",
            title: "Compression Session",
            description: "Maintain compression for 25 minutes",
            duration: 25,
            icon: "pi pi-compress",
            completed: false,
            active: false,
          },
          {
            id: "3",
            title: "Recovery",
            description: "Remove compression and assess",
            duration: 3,
            icon: "pi pi-check",
            completed: false,
            active: false,
          },
        ],
      },
      {
        id: "3",
        name: "Foam Rolling Protocol",
        description:
          "20-minute self-myofascial release using foam roller targeting major muscle groups.",
        category: "Manual Therapy",
        duration: 20,
        priority: "medium",
        evidenceLevel: "Moderate",
        studyCount: 15,
        benefits: [
          "Improves flexibility",
          "Reduces muscle tension",
          "Enhances mobility",
        ],
        steps: [
          {
            id: "1",
            title: "Warm-up",
            description: "Light movement to warm muscles",
            duration: 3,
            icon: "pi pi-sun",
            completed: false,
            active: false,
          },
          {
            id: "2",
            title: "Rolling",
            description: "Foam roll major muscle groups",
            duration: 15,
            icon: "pi pi-circle",
            completed: false,
            active: false,
          },
          {
            id: "3",
            title: "Stretching",
            description: "Light stretching to finish",
            duration: 2,
            icon: "pi pi-arrows-alt",
            completed: false,
            active: false,
          },
        ],
      },
    ];
  }

  private createMockSession(protocol: RecoveryProtocol): RecoverySession {
    return {
      id: "session-1",
      protocol,
      startTime: new Date(),
      duration: protocol.duration * 60, // Convert to seconds
      progress: 0,
      paused: false,
    };
  }

  private getMockResearchInsights(): ResearchInsight[] {
    return [
      {
        id: "1",
        title:
          "Effects of Cold Water Immersion on Recovery from Exercise-Induced Muscle Damage",
        summary:
          "This systematic review found that cold water immersion significantly reduces muscle soreness and improves recovery markers compared to passive recovery.",
        authors: "Bleakley et al.",
        year: 2012,
        journal: "British Journal of Sports Medicine",
        doi: "10.1136/bjsports-2011-090061",
        category: "Cryotherapy",
      },
      {
        id: "2",
        title:
          "Compression Garments and Recovery from Exercise-Induced Muscle Damage",
        summary:
          "Research demonstrates that compression garments can reduce perceived muscle soreness and improve recovery time following intense exercise.",
        authors: "Hill et al.",
        year: 2014,
        journal: "Journal of Strength and Conditioning Research",
        doi: "10.1519/JSC.0000000000000288",
        category: "Compression",
      },
    ];
  }
}
