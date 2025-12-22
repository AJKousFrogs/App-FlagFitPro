import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { CarouselModule } from "primeng/carousel";
import { KnobModule } from "primeng/knob";
import { scaleInOut } from "../../shared/animations/app.animations";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AIService } from "../../core/services/ai.service";
import { ContextService } from "../../core/services/context.service";
import { PerformanceMonitorService } from "../../core/services/performance-monitor.service";
import { HapticFeedbackService } from "../../core/services/haptic-feedback.service";
import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";

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
  severity?: "success" | "info" | "warn" | "danger";
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

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

@Component({
  selector: "app-ai-training-companion",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CarouselModule,
    KnobModule,
  ],
  animations: [scaleInOut],
  template: `
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
                  <p-button
                    [label]="action.label"
                    size="small"
                    [text]="true"
                    (onClick)="executeAction(action)"
                  />
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
                        <p-button
                          [label]="action.label"
                          [icon]="action.icon"
                          size="small"
                          [severity]="action.severity"
                          (onClick)="executeInsightAction(action)"
                        />
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Voice Commands -->
          <div class="voice-controls">
            <p-button
              [icon]="isListening() ? 'pi pi-microphone' : 'pi pi-microphone-slash'"
              [label]="isListening() ? 'Listening...' : 'Voice Command'"
              [severity]="isListening() ? 'success' : 'secondary'"
              [loading]="processingVoice()"
              (onClick)="toggleVoiceRecognition()"
              class="voice-button"
            />

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
              <ng-template let-recommendation pTemplate="item">
                <div class="recommendation-card">
                  <div class="recommendation-content">
                    <h5>{{ recommendation.title }}</h5>
                    <p>{{ recommendation.description }}</p>

                    @if (recommendation.expectedImprovement) {
                      <div class="recommendation-metrics">
                        <div class="metric">
                          <span class="metric-label">Expected Improvement</span>
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
                    <p-button
                      label="Try It"
                      icon="pi pi-play"
                      (onClick)="applyRecommendation(recommendation)"
                    />

                    <p-button
                      label="More Info"
                      icon="pi pi-info-circle"
                      [outlined]="true"
                      (onClick)="showRecommendationDetails(recommendation)"
                    />
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
                      [(ngModel)]="metric.value"
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
  `,
  styles: [
    `
      .training-companion {
        position: fixed;
        bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
        right: 1rem;
        z-index: 1000;
        transition: all 0.3s ease;
      }

      .ai-avatar {
        position: relative;
        cursor: pointer;
      }

      .avatar-container {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transition: transform 0.2s ease;
      }

      .avatar-container:hover {
        transform: scale(1.1);
      }

      .avatar-image {
        font-size: 2rem;
        color: white;
        z-index: 2;
      }

      .pulse-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid rgba(102, 126, 234, 0.6);
        animation: pulse-ring 2s ease-out infinite;
      }

      .pulse-ring.animate {
        animation: pulse-ring 1s ease-out infinite;
      }

      @keyframes pulse-ring {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      .status-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
        background: #6c757d;
      }

      .status-indicator[data-status="listening"] {
        background: #28a745;
        animation: blink 1s ease-in-out infinite;
      }

      .status-indicator[data-status="processing"] {
        background: #ffc107;
      }

      .status-indicator[data-status="active"] {
        background: #007bff;
      }

      @keyframes blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .speech-bubble {
        position: absolute;
        bottom: 80px;
        right: 0;
        min-width: 200px;
        max-width: 300px;
        padding: 1rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        color: #333;
        font-size: 0.875rem;
      }

      .speech-bubble::after {
        content: "";
        position: absolute;
        bottom: -8px;
        right: 20px;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
      }

      .bubble-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .companion-interface {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 90vw;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .insights-panel h4,
      .recommendations-panel h4,
      .performance-feedback h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        color: #333;
      }

      .insight-cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .insight-card {
        padding: 1rem;
        border-radius: 0.5rem;
        background: #f8f9fa;
        border-left: 4px solid #6c757d;
      }

      .insight-card.priority {
        border-left-color: #dc3545;
        background: #fff5f5;
      }

      .insight-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .insight-type {
        font-weight: 600;
        font-size: 0.875rem;
        text-transform: uppercase;
        color: #6c757d;
      }

      .insight-text {
        margin: 0.5rem 0;
        color: #333;
      }

      .insight-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .voice-controls {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .voice-button {
        width: 100%;
      }

      .voice-feedback {
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        color: #6c757d;
      }

      .recommendation-card {
        padding: 1rem;
        border-radius: 0.5rem;
        background: #f8f9fa;
      }

      .recommendation-content h5 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .recommendation-content p {
        margin: 0.5rem 0;
        color: #666;
        font-size: 0.875rem;
      }

      .recommendation-metrics {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
      }

      .metric {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .metric-label {
        font-size: 0.75rem;
        color: #6c757d;
      }

      .metric-value {
        font-weight: 600;
        color: #28a745;
      }

      .recommendation-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .performance-feedback {
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
      }

      .feedback-meters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
      }

      .meter {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .meter label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #333;
      }

      .metric-trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: #6c757d;
      }

      .training-companion.minimized .companion-interface {
        display: none;
      }

      @media (max-width: 768px) {
        .companion-interface {
          width: calc(100vw - 2rem);
          max-width: none;
        }
      }
    `,
  ],
})
export class AITrainingCompanionComponent implements OnInit, OnDestroy {
  private aiService = inject(AIService);
  private contextService = inject(ContextService);
  private performanceMonitor = inject(PerformanceMonitorService);
  private hapticService = inject(HapticFeedbackService);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

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

  private speechRecognition?: any;
  private contextAnalysisInterval?: NodeJS.Timeout;

  ngOnInit(): void {
    this.initializeSpeechRecognition();
    this.startContextAnalysis();
    this.loadPersonalizedRecommendations();
    this.initializePerformanceMetrics();
  }

  ngOnDestroy(): void {
    this.stopVoiceRecognition();
    if (this.contextAnalysisInterval) {
      clearInterval(this.contextAnalysisInterval);
    }
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
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.logger.warn("Speech recognition not supported");
      return;
    }

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = "en-US";

    this.speechRecognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      if (result.isFinal) {
        this.processVoiceCommand(result[0].transcript);
      }
    };

    this.speechRecognition.onerror = (event: any) => {
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

  private async processVoiceCommand(command: string): void {
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

    const action = Object.keys(commandMap).find((key) =>
      command.includes(key),
    );

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
    this.contextAnalysisInterval = setInterval(() => {
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
    }, 10000); // Analyze every 10 seconds
  }

  private async gatherTrainingContext(): Promise<any> {
    return {
      currentExercise: null, // Would come from training service
      timeInSession: 0, // Would come from training service
      previousPerformance: [], // Would come from performance service
      environmentalFactors: null, // Would come from environment service
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
        description: "Light recovery session to optimize tomorrow's performance",
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

  private updateInsights(insights: any[]): void {
    const formattedInsights: Insight[] = insights.map((insight) => ({
      id: insight.id || `insight-${Date.now()}`,
      type: insight.type || "General",
      message: insight.message,
      icon: insight.icon || "pi pi-info-circle",
      priority: insight.priority || "medium",
      actions: insight.actions,
    }));
    this.currentInsights.set(formattedInsights);
  }

  private handleAIResponse(response: any): void {
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
    if (value >= 80) return "#28a745";
    if (value >= 60) return "#ffc107";
    return "#dc3545";
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

