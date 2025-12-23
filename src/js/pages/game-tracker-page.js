// Game Tracker Page JavaScript
// Handles all interactive elements for live game tracking

import { gameStatsService } from "../services/gameStatsService.js";
import { logger } from "../../logger.js";
import { errorHandler } from "../utils/unified-error-handler.js";
import { escapeHtml } from "../utils/html-escape.js";
import { unitManager } from "../../unit-manager.js";
import { setSafeContent } from "../utils/shared.js";

class GameTrackerPage {
  constructor() {
    this.currentGame = null;
    this.plays = [];
    this.playCounter = 0;
    this.players = []; // Will be loaded from roster

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupEventListeners();
        this.loadPlayers();
        this.setupGlobalFunctions();
      });
    } else {
      this.setupEventListeners();
      this.loadPlayers();
      this.setupGlobalFunctions();
    }
  }

  setupGlobalFunctions() {
    // Make functions globally available for onclick handlers
    window.toggleSidebar = () => this.toggleSidebar();
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    if (!sidebar) {
      return;
    }

    const isOpen =
      sidebar.classList.contains("open") ||
      sidebar.classList.contains("mobile-open");

    if (isOpen) {
      sidebar.classList.remove("open", "mobile-open");
      if (overlay) {
        overlay.classList.remove("active");
      }
      document.body.classList.remove("sidebar-open", "menu-open");
    } else {
      sidebar.classList.add("open", "mobile-open");
      if (overlay) {
        overlay.classList.add("active");
      }
      document.body.classList.add("sidebar-open", "menu-open");
    }
  }

  setupEventListeners() {
    // Game setup form
    const gameSetupForm = document.getElementById("game-setup-form");
    if (gameSetupForm) {
      gameSetupForm.addEventListener("submit", (e) => this.handleGameSetup(e));
    }

    // Play entry form
    const playEntryForm = document.getElementById("play-entry-form");
    if (playEntryForm) {
      playEntryForm.addEventListener("submit", (e) => this.handlePlaySubmit(e));
    }

    // Play type buttons
    const playTypeButtons = document.querySelectorAll(".play-type-btn");
    playTypeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handlePlayTypeSelect(e));
    });

    // Pass outcome buttons
    const outcomeButtons = document.querySelectorAll(
      ".outcome-btn[data-outcome]",
    );
    outcomeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handlePassOutcomeSelect(e));
    });

    // Flag pull outcome buttons
    const flagOutcomeButtons = document.querySelectorAll(
      ".outcome-btn[data-flag-outcome]",
    );
    flagOutcomeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFlagOutcomeSelect(e));
    });

    // Navigation buttons
    const newGameBtn = document.getElementById("new-game-btn");
    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => this.showGameSetup());
    }

    const viewGamesBtn = document.getElementById("view-games-btn");
    if (viewGamesBtn) {
      viewGamesBtn.addEventListener("click", () => this.showGamesList());
    }

    const backToTrackerBtn = document.getElementById("back-to-tracker-btn");
    if (backToTrackerBtn) {
      backToTrackerBtn.addEventListener("click", () => this.showGameSetup());
    }

    const endGameBtn = document.getElementById("end-game-btn");
    if (endGameBtn) {
      endGameBtn.addEventListener("click", () => this.handleEndGame());
    }

    const resetPlayBtn = document.getElementById("reset-play-btn");
    if (resetPlayBtn) {
      resetPlayBtn.addEventListener("click", () => this.resetPlayForm());
    }

    // Score inputs
    const teamScoreInput = document.getElementById("team-score");
    const opponentScoreInput = document.getElementById("opponent-score");

    if (teamScoreInput) {
      teamScoreInput.addEventListener("change", () => this.updateScore());
    }
    if (opponentScoreInput) {
      opponentScoreInput.addEventListener("change", () => this.updateScore());
    }

    // Set default date to today
    const gameDateInput = document.getElementById("game-date");
    if (gameDateInput) {
      const today = new Date().toISOString().split("T")[0];
      gameDateInput.value = today;
    }
  }

  loadPlayers() {
    // Load players from localStorage or default list
    const savedPlayers = localStorage.getItem("team_roster");

    if (savedPlayers) {
      this.players = JSON.parse(savedPlayers);
    } else {
      // Default player list (you can customize this)
      this.players = [
        { id: "player_1", name: "Player 1", position: "QB" },
        { id: "player_2", name: "Player 2", position: "WR" },
        { id: "player_3", name: "Player 3", position: "WR" },
        { id: "player_4", name: "Player 4", position: "Center" },
        { id: "player_5", name: "Player 5", position: "DB" },
        { id: "player_6", name: "Player 6", position: "Blitzer" },
      ];
    }

    this.populatePlayerSelects();
  }

  populatePlayerSelects() {
    const playerSelects = document.querySelectorAll(".player-select");

    playerSelects.forEach((select) => {
      // Clear existing options except first
      while (select.options.length > 1) {
        select.remove(1);
      }

      // Add players
      this.players.forEach((player) => {
        const option = document.createElement("option");
        option.value = player.id;
        option.textContent = `${player.name} (${player.position})`;
        select.appendChild(option);
      });
    });
  }

  async handleGameSetup(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const gameDate = document.getElementById("game-date").value;
    const gameTime = document.getElementById("game-time").value;
    const opponentName = document.getElementById("opponent-name").value;
    const location = document.getElementById("location").value;
    const homeAway = document.getElementById("home-away").value;
    const weather = document.getElementById("weather").value;
    const temperatureValue = parseFloat(
      document.getElementById("temperature").value,
    );
    const temperatureUnit =
      document.getElementById("temperature-unit")?.value || "fahrenheit";
    const fieldConditions = document.getElementById("field-conditions").value;

    // Convert temperature to Fahrenheit for storage (API expects Fahrenheit)
    let temperatureFahrenheit = null;
    if (!isNaN(temperatureValue)) {
      if (temperatureUnit === "celsius") {
        temperatureFahrenheit = (temperatureValue * 9) / 5 + 32;
      } else {
        temperatureFahrenheit = temperatureValue;
      }
    }

    // Create game object
    this.currentGame = {
      gameId: `GAME_${Date.now()}`,
      teamId: "TEAM_001", // You can make this dynamic
      gameDate,
      gameTime,
      opponentName,
      location,
      isHomeGame: homeAway === "home",
      weather,
      temperature: temperatureFahrenheit
        ? Math.round(temperatureFahrenheit)
        : null,
      temperatureUnit: temperatureUnit, // Store unit for display
      fieldConditions,
      teamScore: 0,
      opponentScore: 0,
      plays: [],
      createdAt: new Date().toISOString(),
    };

    // Save game to backend (with localStorage fallback)
    try {
      await gameStatsService.saveGame(this.currentGame);
    } catch (error) {
      logger.error("Error saving game:", error);
      // Game is still saved to localStorage as fallback
    }

    // Show live tracking section
    this.showLiveTracking();

    // Update game title
    const gameTitle = document.getElementById("game-title");
    if (gameTitle) {
      gameTitle.textContent = `vs ${opponentName} - ${new Date(gameDate).toLocaleDateString()}`;
    }

    logger.info("Game started:", this.currentGame);
  }

  showLiveTracking() {
    const setupSection = document.getElementById("game-setup-section");
    const trackingSection = document.getElementById("live-tracking-section");
    const listSection = document.getElementById("game-list-section");

    if (setupSection) {
      setupSection.style.display = "none";
    }
    if (trackingSection) {
      trackingSection.style.display = "block";
    }
    if (listSection) {
      listSection.style.display = "none";
    }

    this.resetPlayForm();
    this.updateQuickStats();
  }

  showGameSetup() {
    const setupSection = document.getElementById("game-setup-section");
    const trackingSection = document.getElementById("live-tracking-section");
    const listSection = document.getElementById("game-list-section");

    if (setupSection) {
      setupSection.style.display = "block";
    }
    if (trackingSection) {
      trackingSection.style.display = "none";
    }
    if (listSection) {
      listSection.style.display = "none";
    }
  }

  showGamesList() {
    const setupSection = document.getElementById("game-setup-section");
    const trackingSection = document.getElementById("live-tracking-section");
    const listSection = document.getElementById("game-list-section");

    if (setupSection) {
      setupSection.style.display = "none";
    }
    if (trackingSection) {
      trackingSection.style.display = "none";
    }
    if (listSection) {
      listSection.style.display = "block";
    }

    this.loadGamesList();
  }

  async loadGamesList() {
    const gamesList = document.getElementById("games-list");

    if (!gamesList) {
      return;
    }

    // Show loading state using DOM methods
    gamesList.textContent = "";
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    const loaderIcon = document.createElement("i");
    loaderIcon.setAttribute("data-lucide", "loader");
    loaderIcon.className = "icon-48 spinning";

    const loadingText = document.createElement("p");
    loadingText.textContent = "Loading games...";

    emptyState.appendChild(loaderIcon);
    emptyState.appendChild(loadingText);
    gamesList.appendChild(emptyState);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    try {
      // Try to load from backend (async)
      const games = await gameStatsService.getAllGames();
      this.renderGamesList(games, gamesList);
    } catch (error) {
      logger.error("Error loading games:", error);
      // Fallback to localStorage (synchronous mode)
      const games = await gameStatsService.getAllGames({ forceSync: true });
      this.renderGamesList(games, gamesList);
    }
  }

  renderGamesList(games, gamesList) {
    gamesList.textContent = "";

    if (games.length === 0) {
      // Create empty state using DOM methods
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";

      const calendarIcon = document.createElement("i");
      calendarIcon.setAttribute("data-lucide", "calendar");
      calendarIcon.className = "icon-48";

      const emptyText = document.createElement("p");
      emptyText.textContent = "No games tracked yet";

      emptyState.appendChild(calendarIcon);
      emptyState.appendChild(emptyText);
      gamesList.appendChild(emptyState);

      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
      return;
    }

    // Build games list HTML (data is escaped via escapeHtml)
    const gamesHtml = games
      .map((game) => {
        const result = this.determineGameResult(game);
        const safeOpponentName = escapeHtml(game.opponentName);
        const safeGameId = escapeHtml(game.gameId);
        return `
        <div class="game-item" data-game-id="${safeGameId}">
          <div class="game-item-header">
            <div class="game-date">
              ${new Date(game.gameDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div class="game-result game-result-${result.toLowerCase()}">
              ${result}
            </div>
          </div>
          <div class="game-matchup">
            vs ${safeOpponentName}
          </div>
          <div class="game-score-display">
            ${game.teamScore} - ${game.opponentScore}
          </div>
          <div class="game-stats-summary">
            <div class="game-stat">
              <div class="game-stat-label">Plays</div>
              <div class="game-stat-value">${game.plays?.length || 0}</div>
            </div>
            <div class="game-stat">
              <div class="game-stat-label">Completions</div>
              <div class="game-stat-value">${this.countCompletions(game.plays)}</div>
            </div>
            <div class="game-stat">
              <div class="game-stat-label">Drops</div>
              <div class="game-stat-value">${this.countDrops(game.plays)}</div>
            </div>
            <div class="game-stat">
              <div class="game-stat-label">Flag Pulls</div>
              <div class="game-stat-value">${this.countFlagPulls(game.plays)}</div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    // Use setSafeContent to sanitize HTML before insertion
    // Data is already escaped via escapeHtml(), but we sanitize for extra safety
    setSafeContent(gamesList, gamesHtml, true, true);

    // Add click event listeners to game items (replacing onclick attributes)
    gamesList.querySelectorAll(".game-item").forEach((item) => {
      const gameId = item.getAttribute("data-game-id");
      if (gameId) {
        item.addEventListener("click", () => {
          if (
            window.gameTrackerPage &&
            typeof window.gameTrackerPage.loadGame === "function"
          ) {
            window.gameTrackerPage.loadGame(gameId);
          }
        });
        item.style.cursor = "pointer";
      }
    });

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  determineGameResult(game) {
    if (game.teamScore > game.opponentScore) {
      return "Win";
    }
    if (game.teamScore < game.opponentScore) {
      return "Loss";
    }
    return "Tie";
  }

  loadGame(gameId) {
    const game = gameStatsService.getGame(gameId);
    if (game) {
      this.currentGame = game;
      this.plays = game.plays || [];
      this.playCounter = this.plays.length;

      // Update UI
      document.getElementById("team-score").value = game.teamScore;
      document.getElementById("opponent-score").value = game.opponentScore;

      this.showLiveTracking();
      this.renderRecentPlays();
    }
  }

  handlePlayTypeSelect(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const playType = button.dataset.type;

    // Update active state
    document.querySelectorAll(".play-type-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");

    // Set hidden input
    document.getElementById("play-type").value = playType;

    // Show/hide relevant sections
    const passSection = document.getElementById("pass-play-section");
    const runSection = document.getElementById("run-play-section");
    const flagPullSection = document.getElementById("flag-pull-section");

    if (passSection) {
      passSection.style.display = "none";
    }
    if (runSection) {
      runSection.style.display = "none";
    }
    if (flagPullSection) {
      flagPullSection.style.display = "none";
    }

    if (playType === "pass" && passSection) {
      passSection.style.display = "block";
    } else if (playType === "run" && runSection) {
      runSection.style.display = "block";
    } else if (playType === "flag_pull" && flagPullSection) {
      flagPullSection.style.display = "block";
    }
  }

  handlePassOutcomeSelect(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const outcome = button.dataset.outcome;

    // Update active state
    document.querySelectorAll(".outcome-btn[data-outcome]").forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");

    // Set hidden input
    document.getElementById("pass-outcome").value = outcome;

    // Show drop analysis if drop
    const dropSection = document.getElementById("drop-analysis-section");
    if (dropSection) {
      dropSection.style.display = outcome === "drop" ? "block" : "none";
    }
  }

  handleFlagOutcomeSelect(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const outcome = button.dataset.flagOutcome;

    // Update active state
    document
      .querySelectorAll(".outcome-btn[data-flag-outcome]")
      .forEach((btn) => {
        btn.classList.remove("active");
      });
    button.classList.add("active");

    // Set hidden input
    document.getElementById("flag-pull-outcome").value = outcome;

    // Show miss analysis if miss
    const missSection = document.getElementById("miss-analysis-section");
    if (missSection) {
      missSection.style.display = outcome === "miss" ? "block" : "none";
    }
  }

  handlePlaySubmit(e) {
    e.preventDefault();

    if (!this.currentGame) {
      alert("Please start a game first");
      return;
    }

    const playType = document.getElementById("play-type").value;

    if (!playType) {
      alert("Please select a play type");
      return;
    }

    this.playCounter++;

    // Get distance unit and convert if needed
    const distanceUnit =
      document.getElementById("distance-unit")?.value || "imperial";
    const distanceValue =
      parseFloat(document.getElementById("distance").value) || 0;
    const distanceMeters =
      distanceUnit === "imperial"
        ? unitManager.convertDistance(distanceValue, "yards", "meters")
        : distanceValue;

    // Get route depth unit and convert if needed
    const routeDepthUnit =
      document.getElementById("route-depth-unit")?.value || "imperial";
    const routeDepthValue =
      parseFloat(document.getElementById("route-depth").value) || 0;
    const routeDepthMeters =
      routeDepthUnit === "imperial"
        ? unitManager.convertDistance(routeDepthValue, "yards", "meters")
        : routeDepthValue;

    const basePlay = {
      playNumber: this.playCounter,
      quarter: parseInt(document.getElementById("quarter").value),
      down: parseInt(document.getElementById("down").value),
      distance: distanceMeters, // Store in meters for API
      distanceDisplay: distanceValue, // Keep original for display
      distanceUnit: distanceUnit, // Keep unit for display
      yardLine: parseInt(document.getElementById("yard-line").value),
      playType: playType,
      playNotes: document.getElementById("play-notes").value,
      timestamp: new Date().toISOString(),
    };

    let play = { ...basePlay };

    // Add type-specific data
    if (playType === "pass") {
      play = {
        ...play,
        quarterbackId: document.getElementById("quarterback").value,
        receiverId: document.getElementById("receiver").value,
        routeType: document.getElementById("route-type").value,
        routeDepth: routeDepthMeters, // Store in meters for API
        routeDepthDisplay: routeDepthValue, // Keep original for display
        routeDepthUnit: routeDepthUnit, // Keep unit for display
        outcome: document.getElementById("pass-outcome").value,
        throwAccuracy: document.getElementById("throw-accuracy").value,
        isDrop: document.getElementById("pass-outcome").value === "drop",
        dropSeverity: document.getElementById("drop-severity").value,
        dropReason: document.getElementById("drop-reason").value,
      };
    } else if (playType === "run") {
      const yardsGainedValue =
        parseFloat(document.getElementById("yards-gained").value) || 0;
      const yardsGainedUnit =
        localStorage.getItem("flagfit_distance_unit") || "imperial";
      const yardsGainedMeters =
        yardsGainedUnit === "imperial"
          ? unitManager.convertDistance(yardsGainedValue, "yards", "meters")
          : yardsGainedValue;

      play = {
        ...play,
        ballCarrierId: document.getElementById("ball-carrier").value,
        yardsGained: yardsGainedMeters, // Store in meters for API
        yardsGainedDisplay: yardsGainedValue, // Keep original for display
        yardsGainedUnit: yardsGainedUnit, // Keep unit for display
      };
    } else if (playType === "flag_pull") {
      play = {
        ...play,
        defenderId: document.getElementById("defender").value,
        ballCarrierId: document.getElementById("carrier").value,
        isSuccessful:
          document.getElementById("flag-pull-outcome").value === "success",
        missReason: document.getElementById("miss-reason").value,
      };
    }

    // Add play to game
    this.plays.push(play);
    this.currentGame.plays = this.plays;

    // Save play to backend
    this.savePlayToBackend(play).catch((error) => {
      logger.error("Error saving play to backend:", error);
      // Continue with local save
    });

    // Save game to service (localStorage + backend)
    gameStatsService.saveGame(this.currentGame).catch((error) => {
      logger.error("Error saving game:", error);
    });

    logger.info("Play saved:", play);

    // Update UI
    this.updateQuickStats();
    this.renderRecentPlays();
    this.resetPlayForm();

    // Show success message
    this.showSuccessMessage("Play saved successfully!");
  }

  async savePlayToBackend(play) {
    if (!this.currentGame || !this.currentGame.gameId) {
      return;
    }

    try {
      const { apiClient } = await import("../../api-client.js");
      const { API_ENDPOINTS } = await import("../../api-config.js");

      const playData = {
        teamId: this.currentGame.teamId,
        quarter: play.quarter,
        down: play.down,
        distance: play.distance || play.distanceDisplay, // Use meters if converted, otherwise display value
        yardLine: play.yardLine,
        playType: play.playType,
        playCategory: "offensive", // or "defensive" based on play type
        primaryPlayerId:
          play.quarterbackId || play.ballCarrierId || play.defenderId,
        secondaryPlayerIds: play.receiverId ? [play.receiverId] : [],
        playResult:
          play.outcome || (play.isSuccessful ? "flag_pull" : "missed"),
        yardsGained: play.yardsGained || play.yardsGainedDisplay || 0, // Use meters if converted
        routeDepth: play.routeDepth || play.routeDepthDisplay || null, // Use meters if converted
        yardsAfterCatch: 0, // Could be calculated
        isSuccessful:
          play.outcome === "completion" || play.isSuccessful || false,
        isTurnover: play.outcome === "interception" || false,
        notes: play.playNotes || null,
      };

      const response = await apiClient.post(
        API_ENDPOINTS.games.plays(this.currentGame.gameId),
        playData,
      );

      if (response.success) {
        logger.info("Play saved to backend:", response.data);
      }
    } catch (error) {
      logger.error("Error saving play to backend:", error);
      throw error;
    }
  }

  updateQuickStats() {
    const totalPlaysEl = document.getElementById("total-plays");
    const totalCompletionsEl = document.getElementById("total-completions");
    const totalDropsEl = document.getElementById("total-drops");
    const totalFlagPullsEl = document.getElementById("total-flag-pulls");

    if (totalPlaysEl) {
      totalPlaysEl.textContent = this.plays.length;
    }
    if (totalCompletionsEl) {
      totalCompletionsEl.textContent = this.countCompletions(this.plays);
    }
    if (totalDropsEl) {
      totalDropsEl.textContent = this.countDrops(this.plays);
    }
    if (totalFlagPullsEl) {
      totalFlagPullsEl.textContent = this.countFlagPulls(this.plays);
    }
  }

  countCompletions(plays) {
    return (
      plays?.filter((p) => p.playType === "pass" && p.outcome === "completion")
        .length || 0
    );
  }

  countDrops(plays) {
    return plays?.filter((p) => p.isDrop === true).length || 0;
  }

  countFlagPulls(plays) {
    return (
      plays?.filter(
        (p) => p.playType === "flag_pull" && p.isSuccessful === true,
      ).length || 0
    );
  }

  renderRecentPlays() {
    const recentPlaysList = document.getElementById("recent-plays-list");

    if (!recentPlaysList) {
      return;
    }

    recentPlaysList.textContent = "";

    if (this.plays.length === 0) {
      // Create empty state using DOM methods
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";

      const clipboardIcon = document.createElement("i");
      clipboardIcon.setAttribute("data-lucide", "clipboard");
      clipboardIcon.className = "icon-48";

      const emptyText = document.createElement("p");
      emptyText.textContent =
        "No plays tracked yet. Start tracking plays above!";

      emptyState.appendChild(clipboardIcon);
      emptyState.appendChild(emptyText);
      recentPlaysList.appendChild(emptyState);

      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
      return;
    }

    // Show last 10 plays, most recent first
    const recentPlays = [...this.plays].reverse().slice(0, 10);

    // Build plays HTML (data is escaped via escapeHtml)
    const playsHtml = recentPlays
      .map((play) => {
        const badge = this.getPlayBadge(play);
        const description = this.getPlayDescription(play);
        const safeNotes = play.playNotes
          ? escapeHtml(play.playNotes)
          : "No notes";

        return `
        <div class="play-item">
          <div class="play-item-content">
            <div class="play-item-header">
              <span class="play-number">#${play.playNumber}</span>
              <span class="play-context">Q${play.quarter} • ${play.down}${this.getOrdinal(play.down)} & ${this.formatDistance(play)}</span>
            </div>
            <div class="play-description">${description}</div>
            <div class="play-details">
              ${safeNotes}
            </div>
          </div>
          <div class="play-item-actions">
            ${badge}
          </div>
        </div>
      `;
      })
      .join("");

    lucide.createIcons();
  }

  getPlayBadge(play) {
    if (play.playType === "pass") {
      if (play.outcome === "completion") {
        return '<span class="play-badge play-badge-success">Completion</span>';
      } else if (play.isDrop) {
        return '<span class="play-badge play-badge-danger">Drop</span>';
      } else if (play.outcome === "interception") {
        return '<span class="play-badge play-badge-danger">INT</span>';
      } else {
        return '<span class="play-badge play-badge-warning">Incomplete</span>';
      }
    } else if (play.playType === "flag_pull") {
      return play.isSuccessful
        ? '<span class="play-badge play-badge-success">Flag Pull</span>'
        : '<span class="play-badge play-badge-danger">Missed</span>';
    } else if (play.playType === "run") {
      return `<span class="play-badge play-badge-info">${play.yardsGained} yards</span>`;
    }
    return '<span class="play-badge play-badge-info">Other</span>';
  }

  getPlayDescription(play) {
    const getPlayerName = (id) => {
      const player = this.players.find((p) => p.id === id);
      return player ? escapeHtml(player.name) : "Unknown";
    };

    if (play.playType === "pass") {
      const qb = getPlayerName(play.quarterbackId);
      const receiver = getPlayerName(play.receiverId);
      const route = escapeHtml(play.routeType || "route");
      const routeDepth = this.formatRouteDepth(play);
      return `${qb} to ${receiver} on ${route}${routeDepth ? ` (${routeDepth})` : ""}`;
    } else if (play.playType === "run") {
      const carrier = getPlayerName(play.ballCarrierId);
      const yardsGained = this.formatYardsGained(play);
      return `${carrier} runs for ${yardsGained}`;
    } else if (play.playType === "flag_pull") {
      const defender = getPlayerName(play.defenderId);
      const carrier = getPlayerName(play.ballCarrierId);
      return `${defender} ${play.isSuccessful ? "pulls flag on" : "misses"} ${carrier}`;
    }
    return "Play";
  }

  formatDistance(play) {
    const preferredUnit =
      localStorage.getItem("flagfit_distance_unit") || "imperial";
    if (play.distanceDisplay && play.distanceUnit) {
      // Use stored display value and unit
      return `${play.distanceDisplay} ${play.distanceUnit === "imperial" ? "yds" : "m"}`;
    } else if (play.distance) {
      // Convert from meters to preferred unit
      const distanceValue =
        preferredUnit === "imperial"
          ? unitManager.convertDistance(play.distance, "meters", "yards")
          : play.distance;
      return `${Math.round(distanceValue)} ${preferredUnit === "imperial" ? "yds" : "m"}`;
    }
    return "0 yds";
  }

  formatYardsGained(play) {
    const preferredUnit =
      localStorage.getItem("flagfit_distance_unit") || "imperial";
    if (play.yardsGainedDisplay && play.yardsGainedUnit) {
      // Use stored display value and unit
      return `${play.yardsGainedDisplay} ${play.yardsGainedUnit === "imperial" ? "yds" : "m"}`;
    } else if (play.yardsGained) {
      // Convert from meters to preferred unit
      const yardsValue =
        preferredUnit === "imperial"
          ? unitManager.convertDistance(play.yardsGained, "meters", "yards")
          : play.yardsGained;
      return `${Math.round(yardsValue)} ${preferredUnit === "imperial" ? "yds" : "m"}`;
    }
    return "0 yds";
  }

  formatRouteDepth(play) {
    if (!play.routeDepth && !play.routeDepthDisplay) {
      return "";
    }
    const preferredUnit =
      localStorage.getItem("flagfit_distance_unit") || "imperial";
    if (play.routeDepthDisplay && play.routeDepthUnit) {
      return `${play.routeDepthDisplay} ${play.routeDepthUnit === "imperial" ? "yds" : "m"}`;
    } else if (play.routeDepth) {
      const depthValue =
        preferredUnit === "imperial"
          ? unitManager.convertDistance(play.routeDepth, "meters", "yards")
          : play.routeDepth;
      return `${depthValue.toFixed(1)} ${preferredUnit === "imperial" ? "yds" : "m"}`;
    }
    return "";
  }

  getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  resetPlayForm() {
    const form = document.getElementById("play-entry-form");
    if (form) {
      form.reset();
    }

    // Reset active states
    document
      .querySelectorAll(".play-type-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document
      .querySelectorAll(".outcome-btn")
      .forEach((btn) => btn.classList.remove("active"));

    // Hide conditional sections
    document.getElementById("pass-play-section").style.display = "none";
    document.getElementById("run-play-section").style.display = "none";
    document.getElementById("flag-pull-section").style.display = "none";
    document.getElementById("drop-analysis-section").style.display = "none";
    document.getElementById("miss-analysis-section").style.display = "none";

    // Clear hidden inputs
    document.getElementById("play-type").value = "";
    document.getElementById("pass-outcome").value = "";
    document.getElementById("flag-pull-outcome").value = "";
  }

  updateScore() {
    if (!this.currentGame) {
      return;
    }

    const teamScore =
      parseInt(document.getElementById("team-score").value) || 0;
    const opponentScore =
      parseInt(document.getElementById("opponent-score").value) || 0;

    this.currentGame.teamScore = teamScore;
    this.currentGame.opponentScore = opponentScore;

    gameStatsService.saveGame(this.currentGame);
  }

  async handleEndGame() {
    if (!this.currentGame) {
      return;
    }

    if (
      confirm("Are you sure you want to end this game? All data will be saved.")
    ) {
      this.updateScore();

      // Determine game result
      const teamScore = this.currentGame.teamScore;
      const opponentScore = this.currentGame.opponentScore;

      if (teamScore > opponentScore) {
        this.currentGame.gameResult = "win";
      } else if (teamScore < opponentScore) {
        this.currentGame.gameResult = "loss";
      } else {
        this.currentGame.gameResult = "tie";
      }

      // Save final game state to backend
      try {
        await gameStatsService.saveGame(this.currentGame);

        // Update game scores in backend
        if (
          this.currentGame.gameId &&
          this.currentGame.gameId.startsWith("GAME_")
        ) {
          const { apiClient } = await import("../../api-client.js");
          const { API_ENDPOINTS } = await import("../../api-config.js");

          await apiClient.put(
            API_ENDPOINTS.games.update(this.currentGame.gameId),
            {
              teamScore: this.currentGame.teamScore,
              opponentScore: this.currentGame.opponentScore,
              gameResult: this.currentGame.gameResult,
            },
          );
        }
      } catch (error) {
        logger.error("Error saving final game state:", error);
        // Continue anyway - game is saved to localStorage
      }

      this.showSuccessMessage("Game ended and saved successfully!");

      // Reset and show game list
      this.currentGame = null;
      this.plays = [];
      this.playCounter = 0;

      setTimeout(() => {
        this.showGamesList();
      }, 1500);
    }
  }

  showSuccessMessage(message) {
    // Create a simple toast notification
    const toast = document.createElement("div");
    toast.className = "toast-notification toast-success";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize page
const gameTrackerPage = new GameTrackerPage();

// Make globally available
window.gameTrackerPage = gameTrackerPage;

// Export for module usage
export { gameTrackerPage };
