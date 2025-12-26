import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { InputNumberModule } from "primeng/inputnumber";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { RadioButtonModule } from "primeng/radiobutton";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";

interface Game {
  id: string;
  date: string;
  opponent: string;
  location: string;
  score: string;
  result: "win" | "loss" | "tie";
}

interface Player {
  id: string;
  name: string;
  position: string;
}

interface Play {
  id: string;
  gameId: string;
  playType:
    | "pass_play"
    | "run_play"
    | "flag_pull"
    | "interception"
    | "pass_deflection";
  half: 1 | 2;
  timeRemaining: number; // seconds remaining in half
  down?: number;
  distance?: number;
  yardLine?: number;
  // Pass play specific
  quarterbackId?: string;
  receiverId?: string;
  routeType?: string;
  routeDepth?: number;
  outcome?: string; // completion, drop, incompletion, interception, defended
  throwAccuracy?: string;
  snapAccuracy?: string;
  isDrop?: boolean;
  dropSeverity?: string;
  dropReason?: string;
  // Run play specific
  ballCarrierId?: string;
  yardsGained?: number;
  // Flag pull specific
  defenderId?: string;
  ballCarrierIdFlag?: string;
  isSuccessful?: boolean;
  missReason?: string;
  // Interception/Pass deflection specific
  interceptorId?: string;
  deflectedBy?: string;
  // General
  playNotes?: string;
  // Tracking metadata
  recordedBy: string; // User ID of who recorded the play
  recorderRole: "coach" | "player"; // Role of person recording
  timestamp: Date;
}

@Component({
  selector: "app-game-tracker",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    Textarea,
    InputNumberModule,
    DatePicker,
    Select,
    TableModule,
    TagModule,
    RadioButtonModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  templateUrl: "./game-tracker.component.html",
  styleUrls: ["./game-tracker.component.css"],
})
export class GameTrackerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  showGameForm = signal(false);
  games = signal<Game[]>([]);
  activeGameId = signal<string | null>(null);
  plays = signal<Play[]>([]);
  players = signal<Player[]>([]);
  teamScore = signal<number>(0);
  opponentScore = signal<number>(0);
  gameForm!: FormGroup;
  playForm!: FormGroup;

  homeAwayOptions = [
    { label: "Home", value: "home" },
    { label: "Away", value: "away" },
  ];

  weatherOptions = [
    { label: "Clear", value: "clear" },
    { label: "Partly Cloudy", value: "partly_cloudy" },
    { label: "Cloudy", value: "cloudy" },
    { label: "Light Rain", value: "light_rain" },
    { label: "Rain", value: "rain" },
    { label: "Windy", value: "windy" },
    { label: "Hot (85°F+)", value: "hot" },
    { label: "Cold (50°F-)", value: "cold" },
  ];

  fieldConditionOptions = [
    { label: "Dry", value: "dry" },
    { label: "Wet", value: "wet" },
    { label: "Muddy", value: "muddy" },
    { label: "Indoor", value: "indoor" },
  ];

  routeTypeOptions = [
    { label: "Slant", value: "slant" },
    { label: "Out", value: "out" },
    { label: "In", value: "in" },
    { label: "Post", value: "post" },
    { label: "Corner", value: "corner" },
    { label: "Go", value: "go" },
    { label: "Comeback", value: "comeback" },
    { label: "Screen", value: "screen" },
    { label: "Flat", value: "flat" },
  ];

  passOutcomeOptions = [
    { label: "Completion", value: "completion", severity: "success" },
    { label: "Drop", value: "drop", severity: "danger" },
    { label: "Incompletion", value: "incompletion", severity: "warn" },
    { label: "Interception", value: "interception", severity: "danger" },
    { label: "Defended", value: "defended", severity: "info" },
  ];

  dropSeverityOptions = [
    { label: "Unforgivable (Easy catch)", value: "unforgivable" },
    { label: "Should Catch", value: "should_catch" },
    { label: "Difficult", value: "difficult" },
    { label: "Contested", value: "contested" },
  ];

  dropReasonOptions = [
    { label: "Hands issue", value: "hands" },
    { label: "Body catch attempt", value: "body_catch_attempt" },
    { label: "Distraction", value: "distraction" },
    { label: "Defender contact", value: "defender_contact" },
    { label: "Sun in eyes", value: "sun" },
    { label: "Wind", value: "wind" },
    { label: "Looked upfield early", value: "looked_upfield_early" },
  ];

  missReasonOptions = [
    { label: "Missed grab", value: "missed_grab" },
    { label: "Faked out", value: "faked_out" },
    { label: "Out of position", value: "out_of_position" },
    { label: "Fell down", value: "fell_down" },
    { label: "Too slow", value: "too_slow" },
    { label: "Wrong pursuit angle", value: "wrong_angle" },
  ];

  halfOptions = [
    { label: "1st Half", value: 1 },
    { label: "2nd Half", value: 2 },
  ];

  accuracyOptions = [
    { label: "Perfect", value: "perfect" },
    { label: "Good", value: "good" },
    { label: "Catchable", value: "catchable" },
    { label: "Bad", value: "bad" },
    { label: "Terrible", value: "terrible" },
  ];

  successOptions = [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ];

  ngOnInit(): void {
    this.initGameForm();
    this.initPlayForm();
    this.loadGames();
    this.loadPlayers();
  }

  loadPlayers(): void {
    // Load players from API or localStorage
    this.apiService
      .get("/api/roster/players")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          // Type guard for response structure
          const isValidResponse = 
            response &&
            typeof response === 'object' &&
            ('data' in response || Array.isArray(response));

          if (!isValidResponse) {
            this.loadDefaultPlayers();
            return;
          }

          const responseObj = response as Record<string, unknown>;
          const playersData = Array.isArray(responseObj['data']) 
            ? responseObj['data'] 
            : Array.isArray(response) 
              ? response 
              : [];

          this.players.set(
            playersData
              .filter((p): p is Record<string, unknown> => 
                p !== null && typeof p === 'object'
              )
              .map((p) => {
                const pId = p['id'];
                const pPlayerId = p['playerId'];
                const pName = p['name'];
                const pFirstName = p['firstName'];
                const pLastName = p['lastName'];
                const pPosition = p['position'];
                
                return {
                  id: 
                    typeof pId === 'string' ? pId :
                    typeof pPlayerId === 'string' ? pPlayerId :
                    `player-${Math.random()}`,
                  name: 
                    typeof pName === 'string' ? pName :
                    (typeof pFirstName === 'string' && typeof pLastName === 'string')
                      ? `${pFirstName} ${pLastName}`
                      : 'Unknown Player',
                  position: typeof pPosition === 'string' ? pPosition : "",
                };
              }),
          );
        },
        error: () => {
          this.loadDefaultPlayers();
        },
      });
  }

  private loadDefaultPlayers(): void {
    // Fallback to default players if API fails
    this.players.set([
      { id: "player_1", name: "Player 1", position: "QB" },
      { id: "player_2", name: "Player 2", position: "WR" },
      { id: "player_3", name: "Player 3", position: "WR" },
      { id: "player_4", name: "Player 4", position: "RB" },
      { id: "player_5", name: "Player 5", position: "DB" },
      { id: "player_6", name: "Player 6", position: "DB" },
    ]);
  }

  initGameForm(): void {
    this.gameForm = this.fb.group({
      gameDate: [new Date(), Validators.required],
      gameTime: [""],
      opponent: ["", Validators.required],
      location: [""],
      homeAway: ["home"],
      weather: [""],
      temperature: [null],
      fieldConditions: ["dry"],
    });
  }

  initPlayForm(): void {
    this.playForm = this.fb.group({
      playType: ["", Validators.required],
      half: [1, Validators.required],
      timeRemaining: [null],
      down: [null],
      distance: [null],
      yardLine: [null],
      // Pass play fields
      quarterbackId: [""],
      receiverId: [""],
      routeType: [""],
      routeDepth: [null],
      outcome: [""],
      snapAccuracy: [""],
      throwAccuracy: [""],
      isDrop: [false],
      dropSeverity: [""],
      dropReason: [""],
      // Run play fields
      ballCarrierId: [""],
      yardsGained: [null],
      // Flag pull fields
      defenderId: [""],
      ballCarrierIdFlag: [""],
      isSuccessful: [null],
      missReason: [""],
      // Interception fields
      interceptorId: [""],
      // Pass deflection fields
      deflectedBy: [""],
      // General
      playNotes: [""],
    });

    // Update validators based on play type
    this.playForm
      .get("playType")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((playType) => {
        this.updatePlayFormValidators(playType);
      });
  }

  updatePlayFormValidators(playType: string): void {
    const controls = this.playForm.controls;

    // Reset all conditional validators
    Object.keys(controls).forEach((key) => {
      if (key !== "playType" && key !== "half" && key !== "timeRemaining") {
        controls[key].clearValidators();
        controls[key].updateValueAndValidity();
      }
    });

    // Add validators based on play type
    switch (playType) {
      case "pass_play":
        controls["quarterbackId"].setValidators([Validators.required]);
        controls["outcome"].setValidators([Validators.required]);
        controls["snapAccuracy"].setValidators([Validators.required]);
        controls["throwAccuracy"].setValidators([Validators.required]);
        break;
      case "run_play":
        controls["ballCarrierId"].setValidators([Validators.required]);
        break;
      case "flag_pull":
        controls["defenderId"].setValidators([Validators.required]);
        controls["ballCarrierIdFlag"].setValidators([Validators.required]);
        controls["isSuccessful"].setValidators([Validators.required]);
        break;
      case "interception":
        controls["interceptorId"].setValidators([Validators.required]);
        break;
      case "pass_deflection":
        controls["deflectedBy"].setValidators([Validators.required]);
        break;
    }

    // Show/hide drop analysis if outcome is drop
    if (playType === "pass_play") {
      this.playForm
        .get("outcome")
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((outcome) => {
          if (outcome === "drop") {
            controls["dropSeverity"].setValidators([Validators.required]);
            controls["dropReason"].setValidators([Validators.required]);
            controls["isDrop"].setValue(true);
          } else {
            controls["dropSeverity"].clearValidators();
            controls["dropReason"].clearValidators();
            controls["isDrop"].setValue(false);
          }
          controls["dropSeverity"].updateValueAndValidity({ emitEvent: false });
          controls["dropReason"].updateValueAndValidity({ emitEvent: false });
        });
    }

    // Update validity
    Object.keys(controls).forEach((key) => {
      controls[key].updateValueAndValidity({ emitEvent: false });
    });
  }

  loadGames(): void {
    // Load games
    this.games.set([
      {
        id: "1",
        date: "2024-03-15",
        opponent: "Blue Devils",
        location: "Home Field",
        score: "28-21",
        result: "win",
      },
      {
        id: "2",
        date: "2024-03-08",
        opponent: "Thunder Bolts",
        location: "Away",
        score: "14-21",
        result: "loss",
      },
      {
        id: "3",
        date: "2024-03-01",
        opponent: "Lightning Strike",
        location: "Home Field",
        score: "35-28",
        result: "win",
      },
    ]);
  }

  openNewGame(): void {
    this.showGameForm.set(true);
  }

  cancelGame(): void {
    this.showGameForm.set(false);
    this.gameForm.reset();
  }

  submitGame(): void {
    if (this.gameForm.invalid) {
      this.gameForm.markAllAsTouched();
      return;
    }

    const gameData = this.gameForm.value;
    this.apiService
      .post("/api/tournaments/games", gameData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          let gameId = `game-${Date.now()}`;
          if (response && typeof response === 'object') {
            const respObj = response as Record<string, unknown>;
            const respId = respObj['id'];
            const respGameId = respObj['game_id'];
            if (typeof respId === 'string') {
              gameId = respId;
            } else if (typeof respGameId === 'string') {
              gameId = respGameId;
            }
          }
          this.showGameForm.set(false);
          this.gameForm.reset();
          this.loadGames();
          this.startTrackingGame(gameId);
        },
        error: () => {
          // Error handled by error interceptor
        },
      });
  }

  startTrackingGame(gameId: string): void {
    this.activeGameId.set(gameId);
    this.plays.set([]);
    this.playForm.reset({
      playType: "",
      half: 1,
      timeRemaining: null,
    });
  }

  submitPlay(): void {
    if (this.playForm.invalid || !this.activeGameId()) {
      this.playForm.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.getUser();
    const userRole = currentUser?.role || "player";
    const recorderRole =
      userRole === "coach" ||
      userRole === "assistant_coach" ||
      userRole === "admin"
        ? "coach"
        : "player";

    const formValue = this.playForm.value;

    const playData: Partial<Play> & { 
      gameId: string;
      id: string;
      recordedBy: string;
      recorderRole: "coach" | "player";
      timestamp: Date;
    } = {
      ...formValue,
      gameId: this.activeGameId()!,
      id: `play-${Date.now()}`,
      recordedBy: currentUser?.id || "unknown",
      recorderRole: recorderRole,
      timestamp: new Date(),
    };

    // Handle ballCarrierId for flag pull (use ballCarrierIdFlag)
    if (playData.playType === "flag_pull" && playData.ballCarrierIdFlag) {
      playData.ballCarrierId = playData.ballCarrierIdFlag;
      delete playData.ballCarrierIdFlag;
    }

    // Map play types for compatibility with existing system
    // Convert pass_play -> pass, run_play -> run for backend compatibility
    if (playData.playType === "pass_play") {
      playData.playType = "pass" as any;
    } else if (playData.playType === "run_play") {
      playData.playType = "run" as any;
    }

    // Save play
    this.apiService
      .post("/api/game-events", playData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.plays.update((plays) => [...plays, playData as Play]);

          // Mark players as present if they're tracking their own stats
          this.markPlayersPresent(playData);

          this.playForm.reset({
            playType: "",
            half: this.playForm.get("half")?.value || 1,
            timeRemaining: null,
          });
        },
        error: () => {
          // Error handled by error interceptor
        },
      });
  }

  private markPlayersPresent(playData: Record<string, unknown>): void {
    const playersInPlay: string[] = [];

    // Collect all player IDs involved in this play
    const quarterbackId = playData['quarterbackId'];
    const receiverId = playData['receiverId'];
    const ballCarrierId = playData['ballCarrierId'];
    const defenderId = playData['defenderId'];
    const interceptorId = playData['interceptorId'];
    const deflectedBy = playData['deflectedBy'];
    
    if (typeof quarterbackId === 'string') playersInPlay.push(quarterbackId);
    if (typeof receiverId === 'string') playersInPlay.push(receiverId);
    if (typeof ballCarrierId === 'string') playersInPlay.push(ballCarrierId);
    if (typeof defenderId === 'string') playersInPlay.push(defenderId);
    if (typeof interceptorId === 'string') playersInPlay.push(interceptorId);
    if (typeof deflectedBy === 'string') playersInPlay.push(deflectedBy);

    // If a player is recording their own stats, mark them as present
    const currentUser = this.authService.getUser();
    const recorderRole = playData['recorderRole'];
    if (currentUser && recorderRole === "player" && currentUser.id) {
      playersInPlay.push(currentUser.id);
    }

    // Mark each player as present in the game
    const uniquePlayers = [...new Set(playersInPlay)];
    uniquePlayers.forEach((playerId) => {
      this.apiService
        .post("/api/game-events/mark-presence", {
          gameId: this.activeGameId(),
          playerId: playerId,
          present: true,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    });
  }

  cancelPlay(): void {
    this.playForm.reset({
      playType: "",
      half: 1,
      timeRemaining: null,
    });
  }

  deletePlay(playId: string): void {
    this.apiService
      .delete(`/api/game-events/${playId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.plays.update((plays) => plays.filter((p) => p.id !== playId));
        },
        error: () => {
          // Error handled by error interceptor
        },
      });
  }

  getActiveGameOpponent(): string {
    const game = this.games().find((g) => g.id === this.activeGameId());
    return game?.opponent || "Unknown";
  }

  formatTime(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return "--";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  formatPlayType(playType: string): string {
    const types: Record<string, string> = {
      pass_play: "Pass Play",
      run_play: "Run Play",
      flag_pull: "Flag Pull",
      interception: "Interception",
      pass_deflection: "Pass Deflection",
    };
    return types[playType] || playType;
  }

  getPlayTypeSeverity(
    playType: string,
  ): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    const severities: Record<
      string,
      "success" | "secondary" | "info" | "warn" | "danger" | "contrast"
    > = {
      pass_play: "info",
      run_play: "success",
      flag_pull: "warn",
      interception: "danger",
      pass_deflection: "warn",
    };
    return severities[playType] || "info";
  }

  getPlayDetails(play: Play): string {
    switch (play.playType) {
      case "pass_play":
        const qbName = this.getPlayerName(play.quarterbackId);
        const wrName = this.getPlayerName(play.receiverId);
        const route = play.routeType || "route";
        return `${qbName} to ${wrName} on ${route}${play.outcome ? ` - ${play.outcome}` : ""}`;
      case "run_play":
        const carrierName = this.getPlayerName(play.ballCarrierId);
        return `${carrierName} runs for ${play.yardsGained || 0} yards`;
      case "flag_pull":
        const defenderName = this.getPlayerName(play.defenderId);
        const carrierNameFlag = this.getPlayerName(play.ballCarrierId);
        return `${defenderName} ${play.isSuccessful ? "pulls flag on" : "misses"} ${carrierNameFlag}`;
      case "interception":
        const interceptorName = this.getPlayerName(play.interceptorId);
        return `Intercepted by ${interceptorName}`;
      case "pass_deflection":
        const deflectedByName = this.getPlayerName(play.deflectedBy);
        return `Deflected by ${deflectedByName}`;
      default:
        return "No details";
    }
  }

  getPlayerName(playerId: string | undefined): string {
    if (!playerId) return "Unknown";
    const player = this.players().find((p) => p.id === playerId);
    return player ? player.name : playerId;
  }

  getTotalPlays(): number {
    return this.plays().length;
  }

  getTotalCompletions(): number {
    return this.plays().filter((p) => {
      return p.playType === "pass_play" && p.outcome === "completion";
    }).length;
  }

  getTotalDrops(): number {
    return this.plays().filter((p) => p.isDrop === true).length;
  }

  getTotalFlagPulls(): number {
    return this.plays().filter(
      (p) => p.playType === "flag_pull" && p.isSuccessful === true,
    ).length;
  }

  updateScore(): void {
    // Update score when changed
    if (this.activeGameId()) {
      this.apiService
        .post(`/api/games/${this.activeGameId()}/score`, {
          teamScore: this.teamScore(),
          opponentScore: this.opponentScore(),
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  viewGames(): void {
    // Scroll to games list
    const element = document.querySelector(".games-list-card");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  getResultSeverity(
    result: string,
  ): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    const severities: Record<
      string,
      "success" | "secondary" | "info" | "warn" | "danger" | "contrast"
    > = {
      win: "success",
      loss: "danger",
      tie: "info",
    };
    return severities[result] || "info";
  }

  trackByGameId(index: number, game: Game): string {
    return game.id;
  }
}
