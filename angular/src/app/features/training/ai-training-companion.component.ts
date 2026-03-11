import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { Carousel } from "primeng/carousel";
import { Knob } from "primeng/knob";
import { scaleInOut } from "../../shared/animations/app.animations";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AIService, AnalysisContext } from "../../core/services/ai.service";
import { ContextService } from "../../core/services/context.service";
import { PerformanceMonitorService } from "../../core/services/performance-monitor.service";
import { HapticFeedbackService } from "../../core/services/haptic-feedback.service";
import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { PrivacySettingsService } from "../../core/services/privacy-settings.service";
import { timer } from "rxjs";
import { AiConsentRequiredComponent } from "../../shared/components/ai-consent-required/ai-consent-required.component";

interface Insight {
  id: string;
  type: string;
  message: string;
  icon: string;
  priority: "high" | "medium" | "low";
  actions?: QuickAction[];
}

interface QuickAction {
  label: string;
  icon: string;
  severity?: "success" | "info" | "warning" | "danger";
  action: () => void;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  expectedImprovement?: number;
  timeRequired?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  trend: {
    icon: string;
    text: string;
  };
}

// Speech Recognition API Type Definitions
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
    confidence: number;
  };
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// TrainingContext is now imported as AnalysisContext from ai.service.ts

interface AIResponse {
  message?: string;
  actions?: QuickAction[];
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

@Component({
  selector: "app-ai-training-companion",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    Carousel,
    Knob,

    ButtonComponent,
    AiConsentRequiredComponent,
  ],
  animations: [scaleInOut],
  template: `
    <!-- AI Disabled Banner -->
    @if (!aiEnabled()) {
      <div class="ai-disabled-shell">
        <app-ai-consent-required
          featureName="AI Training Companion"
          [showSettingsLink]="true"
          [status]="'disabled'"
        />
      </div>
    }

    @if (aiEnabled()) {
      <div
        class="training-companion"
        [class.active]="isActive()"
        [class.minimized]="isMinimized()"
      >
        <!-- AI Avatar -->
        <div class="ai-avatar" (click)="toggleCompanion()">
          <div class="avatar-container">
            <div class="pulse-ring" [class.animate]="isListening()"></div>
            <div class="avatar-image">
              <i class="pi pi-sparkles"></i>
            </div>
            <div class="status-indicator" [attr.data-status]="aiStatus()"></div>
          </div>

          <!-- Speech bubble -->
          @if (currentMessage()) {
            <div class="speech-bubble" [@fadeInOut]>
              <p>{{ currentMessage() }}</p>
              @if (hasQuickActions()) {
                <div class="bubble-actions">
                  @for (action of quickActions(); track action.label) {
                    <app-button
                      variant="text"
                      size="sm"
                      (clicked)="executeAction(action)"
                    ></app-button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Expanded Interface -->
        @if (isActive() && !isMinimized()) {
          <div class="companion-interface">
            <!-- Context-Aware Insights -->
            <div class="insights-panel">
              <h4>
                <i class="pi pi-lightbulb"></i>
                Training Insights
              </h4>

              <div class="insight-cards">
                @for (insight of currentInsights(); track insight.id) {
                  <div
                    class="insight-card"
                    [class.priority]="insight.priority === 'high'"
                  >
                    <div class="insight-header">
                      <i [class]="insight.icon"></i>
                      <span class="insight-type">{{ insight.type }}</span>
                    </div>
                    <p class="insight-text">{{ insight.message }}</p>
                    @if (insight.actions) {
                      <div class="insight-actions">
                        @for (action of insight.actions; track action.label) {
                          <app-button
                            size="sm"
                            (clicked)="executeInsightAction(action)"
                          ></app-button>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Voice Commands -->
            <div class="voice-controls">
              <app-button
                [loading]="processingVoice()"
                (clicked)="toggleVoiceRecognition()"
                [iconOnly]="true"
                iconLeft="pi-microphone"
                ariaLabel="Toggle voice recognition"
              ></app-button>

              @if (lastVoiceCommand()) {
                <div class="voice-feedback">
                  <small>Last command: "{{ lastVoiceCommand() }}"</small>
                </div>
              }
            </div>

            <!-- Smart Recommendations -->
            <div class="recommendations-panel">
              <h4>
                <i class="pi pi-sparkles"></i>
                Smart Recommendations
              </h4>

              <p-carousel
                [value]="recommendations()"
                [numVisible]="1"
                [numScroll]="1"
                [circular]="true"
                [autoplayInterval]="8000"
                class="recommendation-carousel"
              >
                <ng-template let-recommendation #item>
                  <div class="recommendation-card">
                    <div class="recommendation-content">
                      <h5>{{ recommendation.title }}</h5>
                      <p>{{ recommendation.description }}</p>

                      @if (recommendation.expectedImprovement) {
                        <div class="recommendation-metrics">
                          <div class="metric">
                            <span class="metric-label"
                              >Expected Improvement</span
                            >
                            <span class="metric-value"
                              >+{{ recommendation.expectedImprovement }}%</span
                            >
                          </div>
                          @if (recommendation.timeRequired) {
                            <div class="metric">
                              <span class="metric-label">Time Investment</span>
                              <span class="metric-value">{{
                                recommendation.timeRequired
                              }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <div class="recommendation-actions">
                      <app-button
                        iconLeft="pi-play"
                        (clicked)="applyRecommendation(recommendation)"
                        >Try It</app-button
                      >

                      <app-button
                        variant="outlined"
                        iconLeft="pi-info-circle"
                        (clicked)="showRecommendationDetails(recommendation)"
                        >More Info</app-button
                      >
                    </div>
                  </div>
                </ng-template>
              </p-carousel>
            </div>

            <!-- Performance Feedback -->
            @if (realtimePerformance()) {
              <div class="performance-feedback">
                <h4>Real-time Feedback</h4>

                <div class="feedback-meters">
                  @for (metric of performanceMetrics(); track metric.name) {
                    <div class="meter">
                      <label>{{ metric.name }}</label>
                      <p-knob
                        [value]="metric.value"
                        [min]="0"
                        [max]="100"
                        [readonly]="true"
                        [size]="80"
                        [strokeWidth]="8"
                        [valueColor]="getMetricColor(metric.value)"
                      />
                      <small class="metric-trend">
                        <i [class]="metric.trend.icon"></i>
                        {{ metric.trend.text }}
                      </small>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
    <!-- End of aiEnabled() check -->
  `,
  styleUrl: "./ai-training-companion.component.scss",
})
export class AITrainingCompanionComponent implements OnInit, OnDestroy {
  private aiService = inject(AIService);
  private contextService = inject(ContextService);
  private performanceMonitor = inject(PerformanceMonitorService);
  private hapticService = inject(HapticFeedbackService);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  private privacyService = inject(PrivacySettingsService);

  // AI consent check - shows disabled banner when AI processing is off
  readonly aiEnabled = this.privacyService.aiProcessingEnabled;

  isActive = signal(false);
  isMinimized = signal(false);
  isListening = signal(false);
  processingVoice = signal(false);
  currentMessage = signal<string | null>(null);
  currentInsights = signal<Insight[]>([]);
  recommendations = signal<Recommendation[]>([]);
  realtimePerformance = signal(false);
  performanceMetrics = signal<PerformanceMetric[]>([]);
  aiStatus = signal<"idle" | "listening" | "processing" | "active">("idle");
  lastVoiceCommand = signal<string | null>(null);
  quickActions = signal<QuickAction[]>([]);

  private speechRecognition: SpeechRecognition | null = null;
  private contextAnalysisInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.initializeSpeechRecognition();
    this.startContextAnalysis();
    this.loadPersonalizedRecommendations();
    this.initializePerformanceMetrics();
  }

  ngOnDestroy(): void {
    this.stopVoiceRecognition();
  }

  toggleCompanion(): void {
    if (this.isActive()) {
      this.isMinimized.update((val) => !val);
    } else {
      this.isActive.set(true);
      this.isMinimized.set(false);
    }
    this.hapticService.trigger("light");
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.logger.warn("Speech recognition not supported");
      return;
    }

    this.speechRecognition = new SpeechRecognitionClass();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = "en-US";

    this.speechRecognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      if (result.isFinal) {
        this.processVoiceCommand(result[0].transcript);
      }
    };

    this.speechRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.logger.error("Speech recognition error:", event.error);
      this.isListening.set(false);
      this.aiStatus.set("idle");
    };

    this.speechRecognition.onend = () => {
      if (this.isListening()) {
        // Restart if still listening
        this.speechRecognition?.start();
      }
    };
  }

  toggleVoiceRecognition(): void {
    if (this.isListening()) {
      this.stopVoiceRecognition();
    } else {
      this.startVoiceRecognition();
    }
  }

  private startVoiceRecognition(): void {
    if (!this.speechRecognition) {
      this.showMessage("Voice recognition not supported in this browser");
      return;
    }

    try {
      this.speechRecognition.start();
      this.isListening.set(true);
      this.aiStatus.set("listening");
      this.hapticService.trigger("medium");
    } catch (error) {
      this.logger.error("Failed to start speech recognition:", error);
    }
  }

  private stopVoiceRecognition(): void {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.isListening.set(false);
      this.aiStatus.set(this.isActive() ? "active" : "idle");
    }
  }

  private async processVoiceCommand(command: string): Promise<void> {
    this.lastVoiceCommand.set(command.toLowerCase());
    this.processingVoice.set(true);
    this.aiStatus.set("processing");

    // Parse common training commands
    const commandMap: Record<string, () => void> = {
      "start training": () => this.startTraining(),
      "log session": () => this.logSession(),
      "show stats": () => this.showStats(),
      "take a break": () => this.suggestBreak(),
      "increase intensity": () => this.adjustIntensity(1),
      "decrease intensity": () => this.adjustIntensity(-1),
    };

    const action = Object.keys(commandMap).find((key) => command.includes(key));

    if (action) {
      commandMap[action]();
      this.showMessage(`Executing: ${action}`);
    } else {
      // Send to AI for natural language processing
      this.aiService
        .processNaturalCommand(command)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.handleAIResponse(response);
          },
          error: () => {
            this.showMessage("I didn't understand that command. Try again.");
          },
        });
    }

    this.processingVoice.set(false);
    this.aiStatus.set(this.isListening() ? "listening" : "active");
  }

  private startContextAnalysis(): void {
    // Analyze context every 10 seconds using RxJS timer
    timer(0, 10000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.gatherTrainingContext().then((context) => {
          this.aiService
            .analyzeContext(context)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (insights) => {
                this.updateInsights(insights);
              },
              error: () => {
                // Silently fail - insights are optional
              },
            });
        });
      });
  }

  private async gatherTrainingContext(): Promise<AnalysisContext> {
    return {
      currentExercise: undefined, // Would come from training service
      timeInSession: 0, // Would come from training service
      previousPerformance: [], // Would come from performance service
      environmentalFactors: undefined, // Would come from environment service
    };
  }

  private loadPersonalizedRecommendations(): void {
    // Load recommendations from AI service
    const recommendations: Recommendation[] = [
      {
        id: "1",
        title: "Speed & Agility Focus",
        description: "Based on your recent sessions, add speed training",
        expectedImprovement: 15,
        timeRequired: "45 min",
      },
      {
        id: "2",
        title: "Recovery Session",
        description:
          "Light recovery session to optimize tomorrow's performance",
        expectedImprovement: 10,
        timeRequired: "30 min",
      },
    ];
    this.recommendations.set(recommendations);
  }

  private initializePerformanceMetrics(): void {
    const metrics: PerformanceMetric[] = [
      {
        name: "Form",
        value: 85,
        trend: { icon: "pi pi-arrow-up", text: "Improving" },
      },
      {
        name: "Intensity",
        value: 72,
        trend: { icon: "pi pi-minus", text: "Stable" },
      },
      {
        name: "Endurance",
        value: 68,
        trend: { icon: "pi pi-arrow-down", text: "Needs work" },
      },
    ];
    this.performanceMetrics.set(metrics);
    this.realtimePerformance.set(true);
  }

  private updateInsights(insights: unknown[]): void {
    const formattedInsights: Insight[] = insights.map((insight) => {
      // Type guard to check if insight has required properties
      const insightObj = insight as Record<string, unknown>;
      const hasRequiredProps =
        insight &&
        typeof insight === "object" &&
        "message" in insight &&
        typeof insightObj["message"] === "string";

      if (!hasRequiredProps) {
        return {
          id: `insight-${Date.now()}`,
          type: "General",
          message: "Unknown insight",
          icon: "pi pi-info-circle",
          priority: "medium" as const,
        };
      }

      return {
        id:
          typeof insightObj["id"] === "string"
            ? insightObj["id"]
            : `insight-${Date.now()}`,
        type:
          typeof insightObj["type"] === "string"
            ? insightObj["type"]
            : "General",
        message: insightObj["message"] as string,
        icon:
          typeof insightObj["icon"] === "string"
            ? insightObj["icon"]
            : "pi pi-info-circle",
        priority:
          insightObj["priority"] === "high" ||
          insightObj["priority"] === "medium" ||
          insightObj["priority"] === "low"
            ? insightObj["priority"]
            : "medium",
        actions: Array.isArray(insightObj["actions"])
          ? insightObj["actions"]
          : undefined,
      };
    });
    this.currentInsights.set(formattedInsights);
  }

  private handleAIResponse(response: AIResponse): void {
    if (response.message) {
      this.showMessage(response.message);
    }
    if (response.actions) {
      this.quickActions.set(response.actions);
    }
  }

  executeAction(action: QuickAction): void {
    action.action();
    this.hapticService.trigger("light");
  }

  executeInsightAction(action: QuickAction): void {
    action.action();
    this.hapticService.trigger("medium");
  }

  applyRecommendation(recommendation: Recommendation): void {
    // Apply the AI recommendation
    this.showMessage(`Applied recommendation: ${recommendation.title}`);
    this.hapticService.trigger("success");
  }

  showRecommendationDetails(recommendation: Recommendation): void {
    // Show detailed information about recommendation
    this.showMessage(`Details for: ${recommendation.title}`);
  }

  getMetricColor(value: number): string {
    if (value >= 80) return "var(--color-status-success)";
    if (value >= 60) return "var(--color-status-warning)";
    return "var(--color-status-error)";
  }

  hasQuickActions(): boolean {
    return this.quickActions().length > 0;
  }

  private showMessage(message: string): void {
    this.currentMessage.set(message);
    setTimeout(() => {
      this.currentMessage.set(null);
    }, 5000);
  }

  private startTraining(): void {
    this.showMessage("Starting training session...");
  }

  private logSession(): void {
    this.showMessage("Logging your session...");
  }

  private showStats(): void {
    this.showMessage("Here are your stats...");
  }

  private suggestBreak(): void {
    this.showMessage("Taking a break is a great idea!");
  }

  private adjustIntensity(delta: number): void {
    this.showMessage(
      delta > 0 ? "Increasing intensity..." : "Decreasing intensity...",
    );
  }
}
