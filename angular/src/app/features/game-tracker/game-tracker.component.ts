import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from "@angular/core";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  NonNullableFormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";

import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { DatePickerComponent } from "../../shared/components/date-picker/date-picker.component";
import { RadioButton } from "primeng/radiobutton";
import { FormInputComponent } from "../../shared/components/form-input/form-input.component";
import { InputNumberComponent } from "../../shared/components/input-number/input-number.component";
import { SelectComponent } from "../../shared/components/select/select.component";
import { TableComponent } from "../../shared/components/table/table.component";
import { TextareaComponent } from "../../shared/components/textarea/textarea.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { extractApiArray } from "../../core/utils/api-response-mapper";
import { formatTimeMMSS } from "../../shared/utils/format.utils";
import { OfflineQueueService } from "../../core/services/offline-queue.service";
import { NetworkStatusService } from "../../core/services/network-status.service";
import { PlatformService } from "../../core/services/platform.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { EmptyStateComponent } from "../../shared/components/ui-components";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  formatDate,
  formatDateISO,
  safeParseDate,
} from "../../shared/utils/date.utils";
import {
  validateForm,
  sanitizeFormData,
  FormValidationResult,
} from "../../shared/utils/form-validation.utils";
import { GameResponseSchema } from "../../core/schemas/api-response.schema";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CardShellComponent,
    FormInputComponent,
    TextareaComponent,
    InputNumberComponent,
    DatePickerComponent,
    SelectComponent,
    TableComponent,
    RadioButton,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
    AlertComponent,
    EmptyStateComponent,
    StatusTagComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
  ],
  templateUrl: "./game-tracker.component.html",
  styleUrl: "./game-tracker.component.scss",
})
export class GameTrackerComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private supabase = inject(SupabaseService);
  private teamMembershipService = inject(TeamMembershipService);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);
  private offlineQueue = inject(OfflineQueueService);
  private networkStatus = inject(NetworkStatusService);
  private logger = inject(LoggerService);
  private platform = inject(PlatformService);

  // ViewChild references for scroll operations
  private readonly gamesListCard =
    viewChild<ElementRef<HTMLElement>>("gamesListCard");
  private readonly playTrackerCard =
    viewChild<ElementRef<HTMLElement>>("playTrackerCard");

  showGameForm = signal(false);
  games = signal<Game[]>([]);
  activeGameId = signal<string | null>(null);

  // Page-level loading/error state (UX audit fix - prevent empty state masking API failure)
  readonly isPageLoading = signal<boolean>(true);
  readonly hasPageError = signal<boolean>(false);
  readonly pageErrorMessage = signal<string>(
    "Unable to load games. Please check your connection and try again.",
  );
  plays = signal<Play[]>([]);
  players = signal<Player[]>([]);
  teamScore = signal<number>(0);
  opponentScore = signal<number>(0);
  gameForm!: FormGroup;
  playForm!: FormGroup;

  // Temperature unit preference (stored in localStorage)
  temperatureUnit: "F" | "C" = "F";

  // User role detection - use TeamMembershipService as single source of truth
  readonly isCoachOrAdmin = this.teamMembershipService.canManageRoster;
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
    { label: "Incompletion", value: "incompletion", severity: "warning" },
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
   * Sets currentUserId for tracking who recorded plays
   */
  private detectUserRole(): void {
    const userId = this.supabase.userId();
    if (userId) {
      this.currentUserId.set(userId);
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
    void this.router.navigate(["/training"]);
  }

  /**
   * Load temperature unit preference from localStorage
   */
  private loadTemperaturePreference(): void {
    const savedUnit = this.platform.getLocalStorage("temperatureUnit");
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
    this.platform.setLocalStorage("temperatureUnit", unit);
  }

  loadPlayers(): void {
    // Load players from API or localStorage
    this.apiService
      .get(API_ENDPOINTS.roster.players)
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

    // Single subscription: drop-analysis validators when pass outcome is "drop"
    this.playForm
      .get("outcome")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.playForm.get("playType")?.value !== "pass_play") {
          return;
        }
        this.applyPassPlayOutcomeDropState(this.playForm.controls);
      });
  }

  /**
   * Align drop fields with current outcome when play type is pass (also when switching
   * to pass_play with outcome already set — valueChanges may not re-emit).
   */
  private applyPassPlayOutcomeDropState(
    controls: FormGroup["controls"],
  ): void {
    const outcome = controls["outcome"].value;
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

    if (playType === "pass_play") {
      this.applyPassPlayOutcomeDropState(controls);
    }

    // Update validity
    Object.keys(controls).forEach((key) => {
      controls[key].updateValueAndValidity({ emitEvent: false });
    });
  }

  loadGames(): void {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);

    this.apiService
      .get<
        | Array<{
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
        | { data: unknown[] }
      >(API_ENDPOINTS.games.list)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const raw = Array.isArray(response)
            ? response
            : (response as { data?: unknown[] })?.data ?? [];
          const games: Game[] = (raw as Array<Record<string, unknown>>).map(
            (game) => {
              const teamScore =
                (game.team_score as number) ?? (game.our_score as number) ?? 0;
              const opponentScore = (game.opponent_score as number) ?? 0;
              let result: "win" | "loss" | "tie" = "tie";
              if (teamScore > opponentScore) result = "win";
              else if (teamScore < opponentScore) result = "loss";

              return {
                id:
                  (game.game_id as string) || (game.id as string) || "",
                date: formatDate(
                  (game.game_date as string) || "",
                  "P",
                ),
                opponent:
                  (game.opponent_team_name as string) ||
                  (game.opponent_name as string) ||
                  "",
                location:
                  (game.location as string) ||
                  ((game.is_home_game as boolean) ? "Home" : "Away"),
                score: `${teamScore}-${opponentScore}`,
                result,
                visibilityScope: (game.visibility_scope as "team" | "personal") ?? "team",
                ownerType: (game.owner_type as "coach" | "player") ?? "player",
                isPersonal: game.visibility_scope === "personal",
              };
            },
          );
          this.games.set(games);
          this.isPageLoading.set(false);
          this.hasPageError.set(false);
        },
        error: (err) => {
          this.logger.error("Error loading games", err);
          this.isPageLoading.set(false);
          this.hasPageError.set(true);
          this.pageErrorMessage.set(
            err?.message ||
              "Unable to load games. Please check your connection and try again.",
          );
        },
      });
  }

  retryLoad(): void {
    this.loadGames();
    this.loadPlayers();
  }

  private resetGameForm(): void {
    this.gameForm.reset();
  }

  private closeGameForm(): void {
    this.showGameForm.set(false);
    this.resetGameForm();
  }

  private resetPlayForm(): void {
    this.playForm.reset({
      playType: "",
      half: this.playForm.get("half")?.value || 1,
      timeRemaining: null,
    });
  }

  openNewGame(): void {
    this.showGameForm.set(true);
  }

  cancelGame(): void {
    this.closeGameForm();
  }

  submitGame(): void {
    // Use comprehensive form validation
    const validationResult: FormValidationResult = validateForm(this.gameForm);

    if (!validationResult.valid) {
      // Show detailed error messages
      const errorMessages = validationResult.errors
        .map((e) => e.message)
        .slice(0, 3) // Limit to first 3 errors
        .join(". ");
      this.toastService.error(
        errorMessages || "Please fill in all required fields correctly",
      );
      return;
    }

    const formValue = this.gameForm.value;

    // Parse and validate date safely
    const parsedDate = safeParseDate(formValue.gameDate);
    if (!parsedDate) {
      this.toastService.error("Please enter a valid game date");
      return;
    }

    // Sanitize and map form data to API expected format
    const gameData = sanitizeFormData({
      opponentName: formValue.opponent,
      gameDate: formatDateISO(parsedDate),
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
    });

    this.apiService
      .post(API_ENDPOINTS.games.create, gameData, { schema: GameResponseSchema })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          let gameId = `game-${Date.now()}`;
          if (response && typeof response === "object") {
            const respObj = response as Record<string, unknown>;
            // Backend returns { success: true, data: {...} } structure
            const gameDataResp = respObj["data"] as
              | Record<string, unknown>
              | undefined;
            if (gameDataResp && typeof gameDataResp === "object") {
              const respId = gameDataResp["id"];
              const respGameId = gameDataResp["game_id"];
              if (typeof respId === "string") {
                gameId = respId;
              } else if (typeof respGameId === "string") {
                gameId = respGameId;
              }
            }
          }
          this.toastService.success(TOAST.SUCCESS.GAME_CREATED);
          this.closeGameForm();
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
            this.closeGameForm();
          } else {
            this.logger.error("Error creating game", err);
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

    const currentUserId = this.currentUserId();
    const recorderRole = this.isCoachOrAdmin() ? "coach" : "player";

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
      recordedBy: currentUserId || "unknown",
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
      this.resetPlayForm();
      return;
    }

    // Save play
    this.apiService
      .post(API_ENDPOINTS.gameEvents.list, playData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.plays.update((plays) => [...plays, playData as Play]);

          // Mark players as present if they're tracking their own stats
          this.markPlayersPresent(playData);

          // Notify coaches that stats were uploaded (database trigger handles this,
          // but we can show local feedback)
          this.showStatsUploadedFeedback(playData);

          this.resetPlayForm();
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
            this.resetPlayForm();
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
    const recorderRole = playData["recorderRole"];
    const currentUserId = this.currentUserId();
    if (currentUserId && recorderRole === "player") {
      playersInPlay.push(currentUserId);
    }

    // Mark each player as present in the game
    const uniquePlayers = [...new Set(playersInPlay)];
    uniquePlayers.forEach((playerId) => {
      this.apiService
        .post(API_ENDPOINTS.gameEvents.markPresence, {
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
      .delete(API_ENDPOINTS.gameEvents.details(playId))
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
  ): "success" | "secondary" | "info" | "warning" | "danger" {
    const severities: Record<
      string,
      "success" | "secondary" | "info" | "warning" | "danger"
    > = {
      pass_play: "info",
      run_play: "success",
      flag_pull: "warning",
      interception: "danger",
      pass_deflection: "warning",
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

  onTeamScoreChange(score: number | null | undefined): void {
    this.teamScore.set(score ?? 0);
    this.updateScore();
  }

  onOpponentScoreChange(score: number | null | undefined): void {
    this.opponentScore.set(score ?? 0);
    this.updateScore();
  }

  updateScore(): void {
    // Update score when changed
    if (this.activeGameId()) {
      this.apiService
        .post(API_ENDPOINTS.games.score(this.activeGameId() || ""), {
          teamScore: this.teamScore(),
          opponentScore: this.opponentScore(),
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  viewGames(): void {
    // Scroll to games list
    const element = this.gamesListCard();
    element?.nativeElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  viewGameDetails(game: Game): void {
    // Load plays for this game and show details
    this.activeGameId.set(game.id);
    this.teamScore.set(parseInt(game.score.split("-")[0]) || 0);
    this.opponentScore.set(parseInt(game.score.split("-")[1]) || 0);

    // Load plays for this game
    this.apiService
      .get<Play[]>(API_ENDPOINTS.games.plays(game.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const plays = extractApiArray<Play>(response);
          if (plays) {
            this.plays.set(plays);
          } else {
            this.plays.set([]);
          }
        },
        error: () => {
          // If API fails, just show empty plays
          this.plays.set([]);
        },
      });

    // Scroll to play tracker
    setTimeout(() => {
      const element = this.playTrackerCard();
      element?.nativeElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  getResultSeverity(
    result: string,
  ): "success" | "secondary" | "info" | "warning" | "danger" {
    const severities: Record<
      string,
      "success" | "secondary" | "info" | "warning" | "danger"
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
