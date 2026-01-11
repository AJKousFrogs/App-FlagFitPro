import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { DatePicker } from "primeng/datepicker";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { formatTimeMMSS } from "../../shared/utils/format.utils";
import { OfflineQueueService } from "../../core/services/offline-queue.service";
import { NetworkStatusService } from "../../core/services/network-status.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { formatDate } from "../../shared/utils/date.utils";

interface Game {
  id: string;
  date: string;
  opponent: string;
  location: string;
  score: string;
  result: "win" | "loss" | "tie";
  visibilityScope?: "team" | "personal";
  ownerType?: "coach" | "player";
  isPersonal?: boolean;
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
    InputTextModule,
    Textarea,
    InputNumberModule,
    DatePicker,
    Select,
    TableModule,
    TagModule,
    RadioButton,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
  ],
  templateUrl: "./game-tracker.component.html",
  styleUrl: "./game-tracker.component.scss",
})
export class GameTrackerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);
  private offlineQueue = inject(OfflineQueueService);
  private networkStatus = inject(NetworkStatusService);

  showGameForm = signal(false);
  games = signal<Game[]>([]);
  activeGameId = signal<string | null>(null);
  plays = signal<Play[]>([]);
  players = signal<Player[]>([]);
  teamScore = signal<number>(0);
  opponentScore = signal<number>(0);
  gameForm!: FormGroup;
  playForm!: FormGroup;

  // Temperature unit preference (stored in localStorage)
  temperatureUnit: "F" | "C" = "F";

  // User role detection
  isCoachOrAdmin = signal(false);
  currentUserId = signal<string | null>(null);

  // Game type options
  gameTypeOptions = [
    {
      label: "Team Game",
      value: "team",
      description: "Visible to all team members",
    },
    {
      label: "Personal/Domestic League",
      value: "personal",
      description: "Only visible to you and coaches with consent",
    },
  ];

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
    { label: "Turf", value: "turf" },
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
    this.loadTemperaturePreference();
    this.detectUserRole();
    this.initGameForm();
    this.initPlayForm();
    this.loadGames();
    this.loadPlayers();
  }

  /**
   * Detect if user is coach/admin or player
   */
  private detectUserRole(): void {
    const user = this.authService.getUser();
    if (user) {
      this.currentUserId.set(user.id);
      const role = user.role || "player";
      const coachRoles = [
        "coach",
        "head_coach",
        "assistant_coach",
        "manager",
        "admin",
      ];
      this.isCoachOrAdmin.set(coachRoles.includes(role));
    }
  }

  /**
   * Get button label based on user role
   */
  getNewGameButtonLabel(): string {
    return this.isCoachOrAdmin() ? "New Team Game" : "Log Game";
  }

  /**
   * Get form title based on user role
   */
  getFormTitle(): string {
    return this.isCoachOrAdmin() ? "Create Team Game" : "Log Personal Game";
  }

  /**
   * Get form subtitle/description based on user role
   */
  getFormDescription(): string {
    if (this.isCoachOrAdmin()) {
      return "This game will be visible to all team members and affect team statistics.";
    }
    return "Log a game from your domestic league or personal competition. Only you and coaches you've given consent to can see this.";
  }

  viewPracticeSchedule(): void {
    // Navigate to training schedule
    window.location.href = "/training";
  }

  /**
   * Load temperature unit preference from localStorage
   */
  private loadTemperaturePreference(): void {
    const savedUnit = localStorage.getItem("temperatureUnit");
    if (savedUnit === "C" || savedUnit === "F") {
      this.temperatureUnit = savedUnit;
    }
  }

  /**
   * Set temperature unit and save to localStorage
   */
  setTemperatureUnit(unit: "F" | "C"): void {
    // Convert existing temperature value if there is one
    const currentTemp = this.gameForm?.get("temperature")?.value;
    if (currentTemp !== null && currentTemp !== undefined) {
      if (unit === "C" && this.temperatureUnit === "F") {
        // Convert F to C
        const celsius = Math.round(((currentTemp - 32) * 5) / 9);
        this.gameForm.patchValue({ temperature: celsius });
      } else if (unit === "F" && this.temperatureUnit === "C") {
        // Convert C to F
        const fahrenheit = Math.round((currentTemp * 9) / 5 + 32);
        this.gameForm.patchValue({ temperature: fahrenheit });
      }
    }

    this.temperatureUnit = unit;
    localStorage.setItem("temperatureUnit", unit);
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
            typeof response === "object" &&
            ("data" in response || Array.isArray(response));

          if (!isValidResponse) {
            this.loadDefaultPlayers();
            return;
          }

          const responseObj = response as Record<string, unknown>;
          const playersData = Array.isArray(responseObj["data"])
            ? responseObj["data"]
            : Array.isArray(response)
              ? response
              : [];

          this.players.set(
            playersData
              .filter(
                (p): p is Record<string, unknown> =>
                  p !== null && typeof p === "object",
              )
              .map((p) => {
                const pId = p["id"];
                const pPlayerId = p["playerId"];
                const pName = p["name"];
                const pFirstName = p["firstName"];
                const pLastName = p["lastName"];
                const pPosition = p["position"];

                return {
                  id:
                    typeof pId === "string"
                      ? pId
                      : typeof pPlayerId === "string"
                        ? pPlayerId
                        : "unknown-player",
                  name:
                    typeof pName === "string"
                      ? pName
                      : typeof pFirstName === "string" &&
                          typeof pLastName === "string"
                        ? `${pFirstName} ${pLastName}`
                        : "Unknown Player",
                  position: typeof pPosition === "string" ? pPosition : "",
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
    // Return empty array if no players found
    this.players.set([]);
  }

  initGameForm(): void {
    // Default visibility based on user role
    const defaultVisibility = this.isCoachOrAdmin() ? "team" : "personal";

    this.gameForm = this.fb.group({
      gameDate: [new Date(), Validators.required],
      gameTime: [""],
      opponent: ["", Validators.required],
      location: [""],
      homeAway: ["home"],
      weather: [""],
      temperature: [null],
      fieldConditions: ["dry"],
      gameType: ["regular_season"],
      visibilityScope: [defaultVisibility], // 'team' or 'personal'
      notes: [""],
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
    this.apiService
      .get<
        Array<{
          game_id: string;
          id: string;
          game_date: string;
          opponent_team_name: string;
          opponent_name: string;
          location: string;
          team_score: number;
          our_score: number;
          opponent_score: number;
          is_home_game: boolean;
          visibility_scope: string;
          owner_type: string;
          player_owner_id: string;
        }>
      >("/api/games")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const games: Game[] = (response.data || []).map((game) => {
            const teamScore = game.team_score ?? game.our_score ?? 0;
            const opponentScore = game.opponent_score ?? 0;
            let result: "win" | "loss" | "tie" = "tie";
            if (teamScore > opponentScore) {
              result = "win";
            } else if (teamScore < opponentScore) {
              result = "loss";
            }

            return {
              id: game.game_id || game.id,
              date: formatDate(game.game_date, "P"),
              opponent: game.opponent_team_name || game.opponent_name,
              location: game.location || (game.is_home_game ? "Home" : "Away"),
              score: `${teamScore}-${opponentScore}`,
              result,
              visibilityScope: game.visibility_scope as "team" | "personal",
              ownerType: game.owner_type as "coach" | "player",
              isPersonal: game.visibility_scope === "personal",
            };
          });
          this.games.set(games);
        },
        error: (err) => {
          console.error("Error loading games:", err);
          // Set empty array on error
          this.games.set([]);
        },
      });
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
      // Show which fields are invalid
      const invalidFields = Object.keys(this.gameForm.controls)
        .filter((key) => this.gameForm.get(key)?.invalid)
        .join(", ");
      this.toastService.error(
        `Please fill required fields: ${invalidFields || "unknown"}`,
      );
      return;
    }

    const formValue = this.gameForm.value;

    // Map form data to API expected format
    const gameData = {
      opponentName: formValue.opponent,
      gameDate:
        formValue.gameDate instanceof Date
          ? formValue.gameDate.toISOString()
          : formValue.gameDate,
      gameTime: formValue.gameTime || null,
      location: formValue.location || null,
      isHomeGame: formValue.homeAway === "home",
      weather: formValue.weather || null,
      temperature: formValue.temperature,
      fieldConditions: formValue.fieldConditions || null,
      gameType: formValue.gameType || "regular_season",
      visibilityScope:
        formValue.visibilityScope ||
        (this.isCoachOrAdmin() ? "team" : "personal"),
      notes: formValue.notes || null,
    };

    this.apiService
      .post("/api/games", gameData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          let gameId = `game-${Date.now()}`;
          if (response && typeof response === "object") {
            const respObj = response as Record<string, unknown>;
            // Backend returns { success: true, data: {...} } structure
            const gameData = respObj["data"] as Record<string, unknown> | undefined;
            if (gameData && typeof gameData === "object") {
              const respId = gameData["id"];
              const respGameId = gameData["game_id"];
              if (typeof respId === "string") {
                gameId = respId;
              } else if (typeof respGameId === "string") {
                gameId = respGameId;
              }
            }
          }
          this.toastService.success(TOAST.SUCCESS.GAME_CREATED);
          this.showGameForm.set(false);
          this.gameForm.reset();
          this.loadGames();
          this.startTrackingGame(gameId);
        },
        error: (err) => {
          // If network error, queue for retry
          if (err.status === 0 || err.message?.includes("network")) {
            this.offlineQueue.queueAction(
              "game_action",
              {
                action: "create_game",
                data: gameData,
              },
              "high",
            );
            this.toastService.info(TOAST.INFO.GAME_SAVED_OFFLINE);
            this.showGameForm.set(false);
            this.gameForm.reset();
          } else {
            console.error("Error creating game:", err);
            this.toastService.error(TOAST.ERROR.GAME_CREATE_FAILED);
          }
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
      playType?: string;
      ballCarrierId?: string;
      ballCarrierIdFlag?: string;
    } = {
      ...formValue,
      gameId: this.activeGameId() || "",
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
      playData.playType = "pass_play"; // Keep as pass_play
    } else if (playData.playType === "run_play") {
      playData.playType = "run_play"; // Keep as run_play
    }

    // Check if offline and queue action
    if (!this.networkStatus.isOnline()) {
      this.offlineQueue.queueAction(
        "game_action",
        {
          action: "create_play",
          data: playData,
        },
        "high",
      );
      this.toastService.info(TOAST.INFO.PLAY_SAVED_OFFLINE);
      this.plays.update((plays) => [...plays, playData as Play]);
      this.playForm.reset({
        playType: "",
        half: this.playForm.get("half")?.value || 1,
        timeRemaining: null,
      });
      return;
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

          // Notify coaches that stats were uploaded (database trigger handles this,
          // but we can show local feedback)
          this.showStatsUploadedFeedback(playData);

          this.playForm.reset({
            playType: "",
            half: this.playForm.get("half")?.value || 1,
            timeRemaining: null,
          });
        },
        error: (error) => {
          // If network error, queue for retry
          if (error.status === 0 || error.message?.includes("network")) {
            this.offlineQueue.queueAction(
              "game_action",
              {
                action: "create_play",
                data: playData,
              },
              "high",
            );
            this.toastService.info(TOAST.INFO.PLAY_SAVED_OFFLINE);
            this.plays.update((plays) => [...plays, playData as Play]);
            this.playForm.reset({
              playType: "",
              half: this.playForm.get("half")?.value || 1,
              timeRemaining: null,
            });
          }
        },
      });
  }

  /**
   * Show feedback when stats are uploaded
   * The database trigger automatically notifies coaches
   */
  private showStatsUploadedFeedback(playData: Record<string, unknown>): void {
    const playType = playData["playType"] as string;
    const yardsGained = playData["yardsGained"] as number | undefined;

    let message = `Play recorded: ${this.formatPlayType(playType)}`;
    if (yardsGained !== undefined) {
      message += ` (${yardsGained} yards)`;
    }

    // Show success toast
    this.toastService.success(message, { life: 2000 });
  }

  private markPlayersPresent(playData: Record<string, unknown>): void {
    const playersInPlay: string[] = [];

    // Collect all player IDs involved in this play
    const quarterbackId = playData["quarterbackId"];
    const receiverId = playData["receiverId"];
    const ballCarrierId = playData["ballCarrierId"];
    const defenderId = playData["defenderId"];
    const interceptorId = playData["interceptorId"];
    const deflectedBy = playData["deflectedBy"];

    if (typeof quarterbackId === "string") playersInPlay.push(quarterbackId);
    if (typeof receiverId === "string") playersInPlay.push(receiverId);
    if (typeof ballCarrierId === "string") playersInPlay.push(ballCarrierId);
    if (typeof defenderId === "string") playersInPlay.push(defenderId);
    if (typeof interceptorId === "string") playersInPlay.push(interceptorId);
    if (typeof deflectedBy === "string") playersInPlay.push(deflectedBy);

    // If a player is recording their own stats, mark them as present
    const currentUser = this.authService.getUser();
    const recorderRole = playData["recorderRole"];
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

  formatTime = formatTimeMMSS;

  /**
   * Format play type for display
   */
  formatPlayType(playType: string): string {
    const types: Record<string, string> = {
      pass: "Pass Play",
      pass_play: "Pass Play",
      run: "Run Play",
      run_play: "Run Play",
      flag_pull: "Flag Pull",
      touchdown: "Touchdown",
      interception: "Interception",
      pass_deflection: "Pass Deflection",
      sack: "Sack",
      penalty: "Penalty",
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
      case "pass_play": {
        const qbName = this.getPlayerName(play.quarterbackId);
        const wrName = this.getPlayerName(play.receiverId);
        const route = play.routeType || "route";
        return `${qbName} to ${wrName} on ${route}${play.outcome ? ` - ${play.outcome}` : ""}`;
      }
      case "run_play": {
        const carrierName = this.getPlayerName(play.ballCarrierId);
        return `${carrierName} runs for ${play.yardsGained || 0} yards`;
      }
      case "flag_pull": {
        const defenderName = this.getPlayerName(play.defenderId);
        const carrierNameFlag = this.getPlayerName(play.ballCarrierId);
        return `${defenderName} ${play.isSuccessful ? "pulls flag on" : "misses"} ${carrierNameFlag}`;
      }
      case "interception": {
        const interceptorName = this.getPlayerName(play.interceptorId);
        return `Intercepted by ${interceptorName}`;
      }
      case "pass_deflection": {
        const deflectedByName = this.getPlayerName(play.deflectedBy);
        return `Deflected by ${deflectedByName}`;
      }
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

  viewGameDetails(game: Game): void {
    // Load plays for this game and show details
    this.activeGameId.set(game.id);
    this.teamScore.set(parseInt(game.score.split("-")[0]) || 0);
    this.opponentScore.set(parseInt(game.score.split("-")[1]) || 0);

    // Load plays for this game
    this.apiService
      .get(`/api/games/${game.id}/plays`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            this.plays.set(response.data as Play[]);
          }
        },
        error: () => {
          // If API fails, just show empty plays
          this.plays.set([]);
        },
      });

    // Scroll to play tracker
    setTimeout(() => {
      const element = document.querySelector(".play-tracker-card");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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
