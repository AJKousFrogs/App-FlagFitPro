/**
 * Playbook Component (Player View)
 *
 * Allows players to study and memorize team plays with their specific
 * position assignments. Includes quiz mode for testing knowledge.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastService } from "../../core/services/toast.service";

import { firstValueFrom } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";
import { LoggerService } from "../../core/services/logger.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  PLAY_CATEGORIES,
  Play,
  PlayCategory,
  QuizQuestion,
} from "./playbook.models";
import { PlaybookLibrarySectionComponent } from "./components/playbook-library-section.component";
import { PlaybookDetailDialogContentComponent } from "./components/playbook-detail-dialog-content.component";
import { PlaybookQuizDialogContentComponent } from "./components/playbook-quiz-dialog-content.component";

@Component({
  selector: "app-playbook",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MainLayoutComponent,
    AppDialogComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    PageHeaderComponent,
    PlaybookLibrarySectionComponent,
    PlaybookDetailDialogContentComponent,
    PlaybookQuizDialogContentComponent,
  ],
  template: `
    <app-main-layout>
      <div class="playbook-page ui-page-shell ui-page-stack">
        <app-page-header
          title="Playbook" eyebrow="LEARNING"
          subtitle="Your team's plays, organized and ready."
          icon="pi-book"
        ></app-page-header>
        <app-playbook-library-section
          [filteredPlays]="filteredPlays()"
          [memorizedCount]="memorizedCount()"
          [totalPlays]="totalPlays()"
          [progressPercent]="progressPercent()"
          [searchQuery]="searchQuery()"
          [categoryOptions]="categoryOptions"
          [statusOptions]="statusOptions"
          [emptyDescription]="getEmptyDescription()"
          (searchInput)="onSearchInput($event)"
          (categoryChange)="onCategoryChange($event)"
          (statusChange)="onStatusChange($event)"
          (selectPlay)="selectPlay($event)"
          (startQuiz)="startQuiz()"
        />
      </div>

      <!-- Play Detail Dialog -->
      <app-dialog
        [(visible)]="showPlayDetail"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [blockScroll]="true"
        dialogSize="2xl"
        ariaLabel="Play Details"
      >
        <app-dialog-header
          icon="pi-book"
          [title]="selectedPlay()?.name || 'Play Details'"
          subtitle="Study your assignment and memorize the concept"
          (close)="showPlayDetail = false"
        />
        @if (selectedPlay(); as play) {
          <app-playbook-detail-dialog-content
            [play]="play"
            [toggleMemorized]="toggleMemorized.bind(this)"
          />
        }
      </app-dialog>

      <!-- Quiz Dialog -->
      <app-dialog
        [(visible)]="showQuiz"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [blockScroll]="true"
        dialogSize="2xl"
        ariaLabel="Playbook Quiz"
      >
        <app-dialog-header
          icon="pi-question-circle"
          title="Playbook Quiz"
          subtitle="Test recall, assignments, and play recognition"
          (close)="showQuiz = false"
        />
        <app-playbook-quiz-dialog-content
          [quizActive]="quizActive()"
          [quizCompleted]="quizCompleted()"
          [quizQuestions]="quizQuestions()"
          [currentQuestionIndex]="currentQuestionIndex()"
          [currentQuestion]="currentQuestion()"
          [selectedAnswer]="selectedAnswer()"
          [answerSubmitted]="answerSubmitted()"
          [quizScore]="quizScore()"
          [correctAnswers]="correctAnswers()"
          (selectAnswer)="selectAnswer($event)"
          (submitAnswer)="submitAnswer()"
          (nextQuestion)="nextQuestion()"
          (showResults)="showQuizResults()"
          (restartQuiz)="startQuiz()"
          (closeQuiz)="showQuiz = false"
        />
        @if (!quizActive() || quizCompleted()) {
          <app-dialog-footer
            cancelLabel="Close"
            primaryLabel="Restart Quiz"
            primaryIcon="pi-refresh"
            (cancel)="showQuiz = false"
            (primary)="startQuiz()"
          />
        }
      </app-dialog>
    </app-main-layout>
  `,
  styleUrl: "./playbook.component.scss",
})
export class PlaybookComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // Design system tokens

  // State
  readonly plays = signal<Play[]>([]);
  readonly selectedPlay = signal<Play | null>(null);
  readonly isLoading = signal(true);

  // Filter state
  readonly searchQuery = signal("");
  readonly selectedCategory = signal<PlayCategory | null>(null);
  readonly selectedStatus = signal<"memorized" | "learning" | null>(null);

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
  readonly statusOptions: { label: string; value: "memorized" | "learning" }[] = [
    { label: "Memorized", value: "memorized" },
    { label: "Learning", value: "learning" },
  ];

  // Computed values
  readonly filteredPlays = computed(() => {
    let result = this.plays();

    // Search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.formationName.toLowerCase().includes(query) ||
          p.personalAssignment.responsibility.toLowerCase().includes(query),
      );
    }

    // Category filter
    if (this.selectedCategory()) {
      result = result.filter((p) => p.category === this.selectedCategory());
    }

    // Status filter
    if (this.selectedStatus()) {
      result = result.filter((p) =>
        this.selectedStatus() === "memorized" ? p.isMemorized : !p.isMemorized,
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

  getEmptyDescription(): string {
    return this.searchQuery() || this.selectedCategory() || this.selectedStatus()
      ? "Try adjusting your filters"
      : "Your coach hasn't added any plays yet";
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  onCategoryChange(value: PlayCategory | null | undefined): void {
    this.selectedCategory.set(value ?? null);
  }

  onStatusChange(value: "memorized" | "learning" | null | undefined): void {
    this.selectedStatus.set(value ?? null);
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.api.get<{ plays?: Play[] }>(API_ENDPOINTS.playbook.list),
      );
      const payload = extractApiPayload<{ plays?: Play[] }>(response);
      if (payload?.plays) {
        this.plays.set(payload.plays);
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
    this.api.post(API_ENDPOINTS.playbook.study, { playId: play.id }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
      .post(API_ENDPOINTS.playbook.memorized, {
        playId: play.id,
        memorized: newStatus,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toastService.success(
            play.name,
            newStatus ? "Marked as Memorized" : "Marked as Learning",
          );
        },
        error: (err) =>
          this.logger.error("Failed to update memorized status", err),
      });
  }

  // Quiz Methods
  startQuiz(): void {
    const questions = this.generateQuizQuestions();
    if (questions.length === 0) {
      this.toastService.warn(
        "Add more plays to start a quiz",
        "Not enough plays",
      );
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
}
