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
import {
  NonNullableFormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { Select } from "primeng/select";
import { InputNumber } from "primeng/inputnumber";
import { SelectButton } from "primeng/selectbutton";
import { SpeedDial } from "primeng/speeddial";
import { MenuItem } from "primeng/api";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SwipeGestureDirective } from "../../shared/directives/swipe-gesture.directive";
import { GameTimePipe } from "../../shared/pipes/game-time.pipe";
import { HapticFeedbackService } from "../../core/services/haptic-feedback.service";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { AuthService } from "../../core/services/auth.service";
import { timer, Subscription } from "rxjs";

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  gameTime: number; // seconds remaining
}

interface FieldPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  team: "home" | "away";
}

interface YardLine {
  x: number;
  label: string;
}

interface Play {
  id: string;
  playType: string;
  playerId?: string;
  yards?: number;
  timestamp: Date;
}

@Component({
  selector: "app-live-game-tracker",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    Select,
    InputNumber,
    SelectButton,
    SpeedDial,
    SwipeGestureDirective,
    GameTimePipe,
    IconButtonComponent,
  ],
  template: `
    <div
      class="game-tracker"
      [class.landscape]="isLandscape()"
      appSwipeGesture
      (swipeLeft)="undoLastPlay()"
      (swipeRight)="redoPlay()"
    >
      <!-- Quick Score Header -->
      <div class="score-header">
        <div class="team home">
          <span class="team-name">{{ game()?.homeTeam || "Home" }}</span>
          <span class="score">{{ game()?.homeScore || 0 }}</span>
        </div>

        <div class="game-clock">
          <span class="item-time">{{ gameTime() | gameTime }}</span>
          <span class="quarter">Q{{ currentQuarter() }}</span>
        </div>

        <div class="team away">
          <span class="score">{{ game()?.awayScore || 0 }}</span>
          <span class="team-name">{{ game()?.awayTeam || "Away" }}</span>
        </div>
      </div>

      <!-- Field Visualization -->
      <div class="field-container">
        <svg
          class="football-field"
          viewBox="0 0 1200 533"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Field background -->
          <rect x="0" y="0" width="1200" height="533" fill="var(--color-field-grass)" />

          <!-- Yard lines -->
          <g class="yard-lines">
            @for (line of yardLines(); track line.x) {
              <line
                [attr.x1]="line.x"
                [attr.y1]="0"
                [attr.x2]="line.x"
                [attr.y2]="533"
                stroke="var(--color-text-on-primary)"
                stroke-width="2"
              />
              <text
                [attr.x]="line.x"
                [attr.y]="520"
                fill="var(--color-text-on-primary)"
                text-anchor="middle"
                font-size="var(--ds-font-size-2xl)"
              >
                {{ line.label }}
              </text>
            }
          </g>

          <!-- Ball position -->
          <circle
            [attr.cx]="ballPosition().x"
            [attr.cy]="ballPosition().y"
            r="8"
            fill="var(--color-metallic-bronze-dark)"
            class="ball-marker"
            (click)="adjustBallPosition($event)"
          />

          <!-- Player positions -->
          <g class="players">
            @for (player of fieldPlayers(); track player.id) {
              <circle
                [attr.cx]="player.x"
                [attr.cy]="player.y"
                r="15"
                [attr.fill]="player.team === 'home' ? 'var(--color-status-info)' : 'var(--color-status-error)'"
                [attr.data-player]="player.id"
                (click)="selectPlayer(player)"
                class="player-marker"
              />
            }
          </g>
        </svg>

        <!-- Touch controls overlay -->
        <div class="field-controls">
          <button
            class="field-action touchdown"
            (click)="recordTouchdown()"
            [disabled]="!canScore()"
          >
            <i class="pi pi-flag-fill"></i>
            TD
          </button>

          <button class="field-action turnover" (click)="recordTurnover()">
            <i class="pi pi-refresh"></i>
            Turnover
          </button>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions">
        <p-speedDial
          [model]="gameActions()"
          direction="up"
          buttonClassName="p-button-lg p-button-success"
          [transitionDelay]="80"
        />

        <div class="action-history">
          <app-icon-button
            icon="pi-undo"
            variant="text"
            [disabled]="!canUndo()"
            (clicked)="undoLastPlay()"
            ariaLabel="Undo last play"
          />

          <span class="play-counter">Play {{ currentPlay() }}</span>

          <app-icon-button
            icon="pi-redo"
            variant="text"
            [disabled]="!canRedo()"
            (clicked)="redoPlay()"
            ariaLabel="Redo play"
          />
        </div>
      </div>

      <!-- Play Details Modal -->
      <app-dialog
        [visible]="showPlayDetails()"
        (visibleChange)="showPlayDetails.set($event)"
        [modal]="true"
        [blockScroll]="true"
        [draggable]="false"
        ariaLabel="Play details"
        styleClass="game-tracker-play-dialog"
      >
        <app-dialog-header
          dialogHeader
          icon="clipboard"
          title="Play Details"
          (close)="cancelPlay()"
        />
        <form [formGroup]="playForm" class="play-form">
          <div class="form-row">
            <label>Play Type</label>
            <p-selectButton
              formControlName="playType"
              [options]="playTypes"
              optionLabel="label"
              optionValue="value"
            />
          </div>

          <div class="form-row">
            <label>Player</label>
            <p-select
              formControlName="playerId"
              [options]="activePlayers()"
              optionLabel="name"
              optionValue="id"
              placeholder="Select player"
            />
          </div>

          <div class="form-row">
            <label>Yards Gained</label>
            <p-inputNumber
              formControlName="yards"
              [min]="-20"
              [max]="80"
              suffix=" yds"
            />
          </div>

          <div class="form-actions">
            <app-dialog-footer
              dialogFooter
              primaryLabel="Save Play"
              [disabled]="playForm.invalid"
              (cancel)="cancelPlay()"
              (primary)="savePlay()"
            />
          </div>
        </form>
      </app-dialog>
    </div>
  `,
  styleUrl: "./live-game-tracker.component.scss",
  host: {
    "(window:orientationchange)": "onOrientationChange()",
    "(document:keydown.space)": "pauseGame($event)",
    "(document:keydown.escape)": "showGameMenu($event)",
  },
})
export class LiveGameTrackerComponent implements OnInit, OnDestroy {
  private fb = inject(NonNullableFormBuilder);
  private hapticService = inject(HapticFeedbackService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  game = signal<Game | null>(null);
  ballPosition = signal({ x: 600, y: 266 }); // Center field
  fieldPlayers = signal<FieldPlayer[]>([]);
  currentPlay = signal(1);
  gameTime = signal(1200); // 20 minutes in seconds
  currentQuarter = signal(1);
  isLandscape = signal(false);
  showPlayDetails = signal(false);
  canScore = signal(true);
  canUndo = signal(false);
  canRedo = signal(false);

  playHistory: Play[] = [];
  redoStack: Play[] = [];

  playForm!: FormGroup;

  playTypes = [
    { label: "Pass", value: "pass" },
    { label: "Run", value: "run" },
    { label: "Flag Pull", value: "flag_pull" },
    { label: "Turnover", value: "turnover" },
  ];

  gameActions = signal<MenuItem[]>([
    {
      icon: "pi pi-play",
      label: "Start Play",
      command: () => this.startPlay(),
    },
    {
      icon: "pi pi-pause",
      label: "Timeout",
      command: () => this.callTimeout(),
    },
    {
      icon: "pi pi-flag",
      label: "Flag",
      command: () => this.throwFlag(),
    },
    {
      icon: "pi pi-chart-line",
      label: "Stats",
      command: () => this.viewStats(),
    },
  ]);

  // Initialize yard lines at field declaration
  yardLines = signal<YardLine[]>(
    (() => {
      const lines: YardLine[] = [];
      for (let i = 0; i <= 10; i++) {
        lines.push({
          x: (i * 1200) / 10,
          label: i === 0 || i === 10 ? "Goal" : `${i * 10}`,
        });
      }
      return lines;
    })(),
  );
  activePlayers = signal<FieldPlayer[]>([]);

  private gameTimerSubscription?: Subscription;
  private orientationCheck?: ReturnType<typeof setTimeout>;

  constructor() {
    // Check orientation - effect automatically cleans up on component destroy in Angular 21
    effect(() => {
      this.checkOrientation();
    });
  }

  ngOnInit(): void {
    this.initPlayForm();
    this.initializeField();
    this.startGameTimer();
    this.checkOrientation();
    this.loadPlayers();
  }

  ngOnDestroy(): void {
    this.stopGameTimer();
    if (this.orientationCheck) {
      clearInterval(this.orientationCheck);
    }
  }

  onOrientationChange(): void {
    this.checkOrientation();
  }

  pauseGame(event: Event): void {
    event.preventDefault();
    // Toggle pause/resume
  }

  showGameMenu(event: Event): void {
    event.preventDefault();
    // Show game menu
  }

  private checkOrientation(): void {
    this.isLandscape.set(
      window.innerWidth > window.innerHeight && window.innerWidth > 768,
    );
  }

  private initPlayForm(): void {
    this.playForm = this.fb.group({
      playType: ["", Validators.required],
      playerId: [""],
      yards: [0],
    });
  }

  private initializeField(): void {
    // Initialize with default players
    const players: FieldPlayer[] = [
      { id: "1", name: "QB", x: 100, y: 266, team: "home" },
      { id: "2", name: "WR1", x: 300, y: 150, team: "home" },
      { id: "3", name: "WR2", x: 300, y: 383, team: "home" },
      { id: "4", name: "DB1", x: 900, y: 150, team: "away" },
      { id: "5", name: "DB2", x: 900, y: 383, team: "away" },
    ];
    this.fieldPlayers.set(players);
    this.activePlayers.set(players);
  }

  private loadPlayers(): void {
    // Load players from API or use field players
    this.apiService
      .get(API_ENDPOINTS.roster.players)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data;
          const players = Array.isArray(data) ? data : [];
          // Update active players if available
          if (players.length > 0) {
            this.activePlayers.set(players as FieldPlayer[]);
          }
        },
        error: () => {
          // Use default players
        },
      });
  }

  private startGameTimer(): void {
    this.gameTimerSubscription = timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const currentTime = this.gameTime();
        if (currentTime > 0) {
          this.gameTime.set(currentTime - 1);
        } else {
          // Quarter ended
          const quarter = this.currentQuarter();
          if (quarter < 4) {
            this.currentQuarter.set(quarter + 1);
            this.gameTime.set(1200); // Reset to 20 minutes
          } else {
            // Game ended
            this.stopGameTimer();
          }
        }
      });
  }

  private stopGameTimer(): void {
    if (this.gameTimerSubscription) {
      this.gameTimerSubscription.unsubscribe();
      this.gameTimerSubscription = undefined;
    }
  }

  undoLastPlay(): void {
    if (this.playHistory.length === 0) return;

    const lastPlay = this.playHistory.pop();
    if (lastPlay) {
      this.redoStack.push(lastPlay);
    }
    this.currentPlay.update((p) => Math.max(1, p - 1));
    this.canUndo.set(this.playHistory.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
    this.hapticService.trigger("light");
  }

  redoPlay(): void {
    if (this.redoStack.length === 0) return;

    const play = this.redoStack.pop();
    if (play) {
      this.playHistory.push(play);
    }
    this.currentPlay.update((p) => p + 1);
    this.canUndo.set(true);
    this.canRedo.set(this.redoStack.length > 0);
    this.hapticService.trigger("light");
  }

  recordTouchdown(): void {
    this.hapticService.trigger("heavy");
    this.animateTouchdown();
    this.updateScore(6);
  }

  recordTurnover(): void {
    this.hapticService.trigger("medium");
    // Record turnover logic
  }

  adjustBallPosition(event: MouseEvent): void {
    const svg = event.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1200;
    const y = ((event.clientY - rect.top) / rect.height) * 533;
    this.ballPosition.set({ x, y });
    this.hapticService.trigger("light");
  }

  selectPlayer(_player: FieldPlayer): void {
    this.hapticService.trigger("light");
    // Select player logic
  }

  startPlay(): void {
    this.showPlayDetails.set(true);
  }

  callTimeout(): void {
    this.hapticService.trigger("medium");
    // Timeout logic
  }

  throwFlag(): void {
    this.hapticService.trigger("warning");
    // Flag logic
  }

  viewStats(): void {
    // Navigate to stats or show stats modal
  }

  savePlay(): void {
    if (this.playForm.invalid) {
      this.playForm.markAllAsTouched();
      return;
    }

    const play: Play = {
      id: `play-${Date.now()}`,
      playType: this.playForm.value.playType,
      playerId: this.playForm.value.playerId,
      yards: this.playForm.value.yards,
      timestamp: new Date(),
    };

    this.playHistory.push(play);
    this.redoStack = []; // Clear redo stack
    this.currentPlay.update((p) => p + 1);
    this.canUndo.set(true);
    this.canRedo.set(false);
    this.showPlayDetails.set(false);
    this.playForm.reset();
    this.hapticService.trigger("success");
  }

  cancelPlay(): void {
    this.showPlayDetails.set(false);
    this.playForm.reset();
  }

  private updateScore(points: number): void {
    const currentGame = this.game();
    if (currentGame) {
      this.game.set({
        ...currentGame,
        homeScore: currentGame.homeScore + points,
      });
    }
  }

  private animateTouchdown(): void {
    // Create confetti effect (simplified)
    // In a real implementation, you'd use a confetti library
    this.logger.info("Touchdown!");
  }
}
