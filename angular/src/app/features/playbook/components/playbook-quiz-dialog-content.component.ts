import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ProgressBar } from "primeng/progressbar";

import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { QuizQuestion } from "../playbook.models";

@Component({
  selector: "app-playbook-quiz-dialog-content",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressBar, AlertComponent, ButtonComponent],
  templateUrl: "./playbook-quiz-dialog-content.component.html",
  styleUrl: "./playbook-quiz-dialog-content.component.scss",
})
export class PlaybookQuizDialogContentComponent {
  readonly quizActive = input.required<boolean>();
  readonly quizCompleted = input.required<boolean>();
  readonly quizQuestions = input.required<QuizQuestion[]>();
  readonly currentQuestionIndex = input.required<number>();
  readonly selectedAnswer = input.required<number | null>();
  readonly answerSubmitted = input.required<boolean>();
  readonly quizScore = input.required<number>();
  readonly correctAnswers = input.required<number>();

  readonly selectAnswer = output<number>();
  readonly submitAnswer = output<void>();
  readonly nextQuestion = output<void>();
  readonly showResults = output<void>();
  readonly restartQuiz = output<void>();
  readonly closeQuiz = output<void>();

  readonly currentQuestion = input<QuizQuestion | null>(null);

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
