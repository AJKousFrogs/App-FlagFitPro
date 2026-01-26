/**
 * Playbook Component (Player View)
 *
 * Allows players to study and memorize team plays with their specific
 * position assignments. Includes quiz mode for testing knowledge.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";

import { ButtonComponent } from "../../shared/components/button/button.component";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { Message } from "primeng/message";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { Toast } from "primeng/toast";
import { firstValueFrom } from "rxjs";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { MobileOptimizedImageDirective } from "../../shared/directives/mobile-optimized-image.directive";

// ===== Interfaces =====
interface Play {
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

interface PositionAssignment {
  position: string;
  route?: string;
  responsibility: string;
  preSnapRead?: string;
  postSnapRead?: string;
}

interface QuizQuestion {
  playId: string;
  playName: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer?: number;
}

type PlayCategory = "offense" | "defense" | "special-teams";

// ===== Constants =====
const PLAY_CATEGORIES: { label: string; value: PlayCategory }[] = [
  { label: "Offense", value: "offense" },
  { label: "Defense", value: "defense" },
  { label: "Special Teams", value: "special-teams" },
];

@Component({
  selector: "app-playbook",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    Card,
    Dialog,
    InputText,
    Message,
    ProgressBar,
    Select,
    Toast,
    MainLayoutComponent,
    PageHeaderComponent,
    MobileOptimizedImageDirective,
    ButtonComponent,
    StatusTagComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="playbook-page">
        <app-page-header
          title="Playbook"
          subtitle="Study and memorize team plays for your position"
          icon="pi-book"
        ></app-page-header>

        <!-- Progress Overview -->
        <p-card styleClass="progress-card">
          <div class="progress-header">
            <div class="progress-stats">
              <div class="stat-item stat-block stat-block--compact">
                <div class="stat-block__content">
                  <span class="stat-block__value">{{ memorizedCount() }}</span>
                  <span class="stat-block__label">Memorized</span>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item stat-block stat-block--compact">
                <div class="stat-block__content">
                  <span class="stat-block__value">{{ totalPlays() }}</span>
                  <span class="stat-block__label">Total Plays</span>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item stat-block stat-block--compact">
                <div class="stat-block__content">
                  <span class="stat-block__value"
                    >{{ progressPercent() }}%</span
                  >
                  <span class="stat-block__label">Complete</span>
                </div>
              </div>
            </div>
            <app-button
              iconLeft="pi-question-circle"
              [disabled]="plays().length === 0"
              (clicked)="startQuiz()"
              >Quiz Mode</app-button
            >
          </div>
          <p-progressBar
            [value]="progressPercent()"
            [showValue]="false"
            styleClass="progress-overall"
          ></p-progressBar>
        </p-card>

        <!-- Filters -->
        <div class="filters-row">
          <span class="p-input-icon-left filter-search">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              placeholder="Search plays..."
              [(ngModel)]="searchQuery"
            />
          </span>

          <p-select
            [options]="categoryOptions"
            [(ngModel)]="selectedCategory"
            optionLabel="label"
            optionValue="value"
            placeholder="Category"
            [showClear]="true"
            styleClass="playbook-filter-select"
          ></p-select>

          <p-select
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            [showClear]="true"
            styleClass="playbook-filter-select"
          ></p-select>
        </div>

        <!-- Plays List -->
        @if (filteredPlays().length > 0) {
          <div class="plays-grid">
            @for (play of filteredPlays(); track play.id) {
              <p-card styleClass="play-card" (click)="selectPlay(play)">
                <div class="play-header">
                  <div class="play-title">
                    <h3>{{ play.name }}</h3>
                    <app-status-tag
                      [value]="getCategoryLabel(play.category)"
                      [severity]="getCategorySeverity(play.category)"
                      size="sm"
                    />
                  </div>
                  @if (play.isMemorized) {
                    <i
                      class="pi pi-check-circle memorized-icon"
                      title="Memorized"
                    ></i>
                  }
                </div>

                <p class="play-formation">{{ play.formationName }}</p>
                <p class="play-assignment">
                  <strong>Your Assignment:</strong>
                  {{ play.personalAssignment.responsibility }}
                </p>

                @if (play.lastStudied) {
                  <span class="last-studied">
                    Last studied: {{ play.lastStudied | date: "MMM d" }}
                  </span>
                }
              </p-card>
            }
          </div>
        } @else {
          <p-card styleClass="empty-state-card">
            <div class="empty-state">
              <i class="pi pi-book"></i>
              <h3>No plays found</h3>
              <p>
                @if (searchQuery || selectedCategory || selectedStatus) {
                  Try adjusting your filters
                } @else {
                  Your coach hasn't added any plays yet
                }
              </p>
            </div>
          </p-card>
        }
      </div>

      <!-- Play Detail Dialog -->
      <p-dialog
        [(visible)]="showPlayDetail"
        [header]="selectedPlay()?.name || 'Play Details'"
        [modal]="true"
        [closable]="true"
        styleClass="play-detail-dialog"
      >
        @if (selectedPlay(); as play) {
          <div class="play-detail">
            <!-- Play Diagram -->
            @if (play.diagramUrl) {
              <div class="play-diagram">
                <img
                  appMobileOptimized
                  [width]="600"
                  [height]="400"
                  [src]="play.diagramUrl"
                  [alt]="play.name + ' diagram'"
                />
              </div>
            } @else {
              <div class="play-diagram placeholder">
                <i class="pi pi-image"></i>
                <span>No diagram available</span>
              </div>
            }

            <!-- My Assignment -->
            <div class="section assignment-section">
              <h4>
                <i class="pi pi-user"></i> My Assignment ({{
                  play.personalAssignment.position
                }})
              </h4>
              <div class="assignment-details">
                @if (play.personalAssignment.route) {
                  <div class="detail-row">
                    <span class="label">Route:</span>
                    <span class="value">{{
                      play.personalAssignment.route
                    }}</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="label">Responsibility:</span>
                  <span class="value">{{
                    play.personalAssignment.responsibility
                  }}</span>
                </div>
                @if (play.personalAssignment.preSnapRead) {
                  <div class="detail-row">
                    <span class="label">Pre-Snap Read:</span>
                    <span class="value">{{
                      play.personalAssignment.preSnapRead
                    }}</span>
                  </div>
                }
                @if (play.personalAssignment.postSnapRead) {
                  <div class="detail-row">
                    <span class="label">Post-Snap Read:</span>
                    <span class="value">{{
                      play.personalAssignment.postSnapRead
                    }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Description -->
            <div class="section">
              <h4><i class="pi pi-info-circle"></i> Description</h4>
              <p>{{ play.description }}</p>
            </div>

            <!-- Key Points -->
            @if (play.keyPoints.length > 0) {
              <div class="section">
                <h4><i class="pi pi-check-square"></i> Key Points</h4>
                <ul class="key-points-list">
                  @for (point of play.keyPoints; track point) {
                    <li><i class="pi pi-check"></i> {{ point }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Common Mistakes -->
            @if (play.commonMistakes.length > 0) {
              <div class="section warning-section">
                <h4>
                  <i class="pi pi-exclamation-triangle"></i> Common Mistakes
                </h4>
                <ul class="mistakes-list">
                  @for (mistake of play.commonMistakes; track mistake) {
                    <li><i class="pi pi-times"></i> {{ mistake }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Actions -->
            <div class="detail-actions">
              <app-button (clicked)="toggleMemorized(play)"></app-button>
            </div>
          </div>
        }
      </p-dialog>

      <!-- Quiz Dialog -->
      <p-dialog
        [(visible)]="showQuiz"
        header="Playbook Quiz"
        [modal]="true"
        [closable]="true"
        styleClass="quiz-dialog"
      >
        @if (quizActive()) {
          <div class="quiz-content">
            <!-- Progress -->
            <div class="quiz-progress">
              <span
                >Question {{ currentQuestionIndex() + 1 }} of
                {{ quizQuestions().length }}</span
              >
              <p-progressBar
                [value]="
                  ((currentQuestionIndex() + 1) / quizQuestions().length) * 100
                "
                [showValue]="false"
              ></p-progressBar>
            </div>

            <!-- Question -->
            @if (currentQuestion(); as q) {
              <div class="quiz-question">
                <p class="play-reference">Play: {{ q.playName }}</p>
                <h3>{{ q.question }}</h3>

                <div class="options-list">
                  @for (option of q.options; track option; let i = $index) {
                    <button
                      class="option-btn"
                      [class.selected]="selectedAnswer() === i"
                      [class.correct]="
                        answerSubmitted() && i === q.correctIndex
                      "
                      [class.incorrect]="
                        answerSubmitted() &&
                        selectedAnswer() === i &&
                        i !== q.correctIndex
                      "
                      [disabled]="answerSubmitted()"
                      (click)="selectAnswer(i)"
                    >
                      <span class="option-letter">{{
                        getOptionLetter(i)
                      }}</span>
                      <span class="option-text">{{ option }}</span>
                    </button>
                  }
                </div>

                @if (answerSubmitted()) {
                  <p-message
                    [severity]="
                      selectedAnswer() === q.correctIndex ? 'success' : 'error'
                    "
                    styleClass="status-message"
                  >
                    {{
                      selectedAnswer() === q.correctIndex
                        ? "Correct!"
                        : "Incorrect. The correct answer is: " +
                          q.options[q.correctIndex]
                    }}
                  </p-message>
                }
              </div>
            }

            <!-- Quiz Actions -->
            <div class="quiz-actions">
              @if (!answerSubmitted()) {
                <app-button
                  iconLeft="pi-check"
                  [disabled]="selectedAnswer() === null"
                  (clicked)="submitAnswer()"
                  >Submit Answer</app-button
                >
              } @else if (currentQuestionIndex() < quizQuestions().length - 1) {
                <app-button iconLeft="pi-arrow-right" (clicked)="nextQuestion()"
                  >Next Question</app-button
                >
              } @else {
                <app-button
                  iconLeft="pi-chart-bar"
                  (clicked)="showQuizResults()"
                  >See Results</app-button
                >
              }
            </div>
          </div>
        } @else if (quizCompleted()) {
          <!-- Quiz Results -->
          <div class="quiz-results">
            <div class="results-icon" [class.success]="quizScore() >= 80">
              @if (quizScore() >= 80) {
                <i class="pi pi-trophy"></i>
              } @else {
                <i class="pi pi-chart-bar"></i>
              }
            </div>

            <h2>Quiz Complete!</h2>
            <p class="score-display">
              <span class="score">{{ quizScore() }}%</span>
              <span class="score-detail">
                ({{ correctAnswers() }}/{{ quizQuestions().length }} correct)
              </span>
            </p>

            @if (quizScore() >= 80) {
              <p-message
                severity="success"
                styleClass="status-message status-message--success"
              >
                Great job! You know your plays well.
              </p-message>
            } @else if (quizScore() >= 60) {
              <p-message severity="warn" styleClass="status-message">
                Good effort! Keep studying to improve.
              </p-message>
            } @else {
              <p-message severity="info" styleClass="status-message">
                Keep studying! Review the plays you missed.
              </p-message>
            }

            <div class="results-actions">
              <app-button iconLeft="pi-refresh" (clicked)="startQuiz()"
                >Try Again</app-button
              >
              <app-button
                variant="secondary"
                iconLeft="pi-times"
                (clicked)="showQuiz = false"
                >Close</app-button
              >
            </div>
          </div>
        }
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./playbook.component.scss",
})
export class PlaybookComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // Design system tokens

  // State
  readonly plays = signal<Play[]>([]);
  readonly selectedPlay = signal<Play | null>(null);
  readonly isLoading = signal(true);

  // Filter state
  searchQuery = "";
  selectedCategory: PlayCategory | null = null;
  selectedStatus: "memorized" | "learning" | null = null;

  // Dialog state
  showPlayDetail = false;
  showQuiz = false;

  // Quiz state
  readonly quizQuestions = signal<QuizQuestion[]>([]);
  readonly currentQuestionIndex = signal(0);
  readonly selectedAnswer = signal<number | null>(null);
  readonly answerSubmitted = signal(false);
  readonly quizActive = signal(false);
  readonly quizCompleted = signal(false);

  // Options
  readonly categoryOptions = PLAY_CATEGORIES;
  readonly statusOptions = [
    { label: "Memorized", value: "memorized" },
    { label: "Learning", value: "learning" },
  ];

  // Computed values
  readonly filteredPlays = computed(() => {
    let result = this.plays();

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.formationName.toLowerCase().includes(query) ||
          p.personalAssignment.responsibility.toLowerCase().includes(query),
      );
    }

    // Category filter
    if (this.selectedCategory) {
      result = result.filter((p) => p.category === this.selectedCategory);
    }

    // Status filter
    if (this.selectedStatus) {
      result = result.filter((p) =>
        this.selectedStatus === "memorized" ? p.isMemorized : !p.isMemorized,
      );
    }

    return result;
  });

  readonly memorizedCount = computed(
    () => this.plays().filter((p) => p.isMemorized).length,
  );

  readonly totalPlays = computed(() => this.plays().length);

  readonly progressPercent = computed(() => {
    const total = this.totalPlays();
    if (total === 0) return 0;
    return Math.round((this.memorizedCount() / total) * 100);
  });

  readonly currentQuestion = computed(
    () => this.quizQuestions()[this.currentQuestionIndex()],
  );

  readonly correctAnswers = computed(
    () =>
      this.quizQuestions().filter((q) => q.userAnswer === q.correctIndex)
        .length,
  );

  readonly quizScore = computed(() => {
    const total = this.quizQuestions().length;
    if (total === 0) return 0;
    return Math.round((this.correctAnswers() / total) * 100);
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(this.api.get("/api/playbook"));
      if (response?.success && response.data?.plays) {
        this.plays.set(response.data.plays);
      }
    } catch (err) {
      this.logger.error("Failed to load playbook data", err);
      // No plays assigned to player yet
      this.plays.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectPlay(play: Play): void {
    this.selectedPlay.set(play);
    this.showPlayDetail = true;

    // Record study time
    this.api.post("/api/playbook/study", { playId: play.id }).subscribe({
      error: (err) => this.logger.error("Failed to record study time", err),
    });
  }

  toggleMemorized(play: Play): void {
    const newStatus = !play.isMemorized;

    this.plays.update((plays) =>
      plays.map((p) =>
        p.id === play.id
          ? {
              ...p,
              isMemorized: newStatus,
              lastStudied: new Date().toISOString(),
            }
          : p,
      ),
    );

    // Update selected play too
    this.selectedPlay.update((p) =>
      p?.id === play.id ? { ...p, isMemorized: newStatus } : p,
    );

    this.api
      .post("/api/playbook/memorized", {
        playId: play.id,
        memorized: newStatus,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: newStatus ? "Marked as Memorized" : "Marked as Learning",
            detail: play.name,
          });
        },
        error: (err) =>
          this.logger.error("Failed to update memorized status", err),
      });
  }

  // Quiz Methods
  startQuiz(): void {
    const questions = this.generateQuizQuestions();
    if (questions.length === 0) {
      this.messageService.add({
        severity: "warning",
        summary: "Not enough plays",
        detail: "Add more plays to start a quiz",
      });
      return;
    }

    this.quizQuestions.set(questions);
    this.currentQuestionIndex.set(0);
    this.selectedAnswer.set(null);
    this.answerSubmitted.set(false);
    this.quizActive.set(true);
    this.quizCompleted.set(false);
    this.showQuiz = true;
  }

  private generateQuizQuestions(): QuizQuestion[] {
    const plays = this.plays();
    if (plays.length < 2) return [];

    // Generate questions from plays
    return plays.slice(0, Math.min(5, plays.length)).map((play) => {
      const otherPlays = plays.filter((p) => p.id !== play.id);
      const wrongAnswers = this.shuffle(
        otherPlays.map((p) => p.personalAssignment.responsibility),
      ).slice(0, 3);

      const options = this.shuffle([
        play.personalAssignment.responsibility,
        ...wrongAnswers.slice(0, Math.min(3, wrongAnswers.length)),
      ]);

      return {
        playId: play.id,
        playName: play.name,
        question: `What is your assignment on "${play.name}"?`,
        options,
        correctIndex: options.indexOf(play.personalAssignment.responsibility),
      };
    });
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  selectAnswer(index: number): void {
    if (!this.answerSubmitted()) {
      this.selectedAnswer.set(index);
    }
  }

  submitAnswer(): void {
    const answer = this.selectedAnswer();
    if (answer === null) return;

    // Record user answer
    this.quizQuestions.update((questions) =>
      questions.map((q, i) =>
        i === this.currentQuestionIndex() ? { ...q, userAnswer: answer } : q,
      ),
    );

    this.answerSubmitted.set(true);
  }

  nextQuestion(): void {
    this.currentQuestionIndex.update((i) => i + 1);
    this.selectedAnswer.set(null);
    this.answerSubmitted.set(false);
  }

  showQuizResults(): void {
    this.quizActive.set(false);
    this.quizCompleted.set(true);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  getCategoryLabel(category: PlayCategory): string {
    const found = PLAY_CATEGORIES.find((c) => c.value === category);
    return found?.label || category;
  }

  getCategorySeverity(
    category: PlayCategory,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (category) {
      case "offense":
        return "success";
      case "defense":
        return "info";
      case "special-teams":
        return "warning";
      default:
        return "secondary";
    }
  }
}
