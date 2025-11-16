// Game Tracker Page JavaScript
// Handles all interactive elements for live game tracking

import { gameStatsService } from '../services/gameStatsService.js';
import { logger } from '../../logger.js';

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
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
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
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('open') || sidebar.classList.contains('mobile-open');

    if (isOpen) {
      sidebar.classList.remove('open', 'mobile-open');
      if (overlay) overlay.classList.remove('active');
      document.body.classList.remove('sidebar-open', 'menu-open');
    } else {
      sidebar.classList.add('open', 'mobile-open');
      if (overlay) overlay.classList.add('active');
      document.body.classList.add('sidebar-open', 'menu-open');
    }
  }

  setupEventListeners() {
    // Game setup form
    const gameSetupForm = document.getElementById('game-setup-form');
    if (gameSetupForm) {
      gameSetupForm.addEventListener('submit', (e) => this.handleGameSetup(e));
    }

    // Play entry form
    const playEntryForm = document.getElementById('play-entry-form');
    if (playEntryForm) {
      playEntryForm.addEventListener('submit', (e) => this.handlePlaySubmit(e));
    }

    // Play type buttons
    const playTypeButtons = document.querySelectorAll('.play-type-btn');
    playTypeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handlePlayTypeSelect(e));
    });

    // Pass outcome buttons
    const outcomeButtons = document.querySelectorAll('.outcome-btn[data-outcome]');
    outcomeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handlePassOutcomeSelect(e));
    });

    // Flag pull outcome buttons
    const flagOutcomeButtons = document.querySelectorAll('.outcome-btn[data-flag-outcome]');
    flagOutcomeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleFlagOutcomeSelect(e));
    });

    // Navigation buttons
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.showGameSetup());
    }

    const viewGamesBtn = document.getElementById('view-games-btn');
    if (viewGamesBtn) {
      viewGamesBtn.addEventListener('click', () => this.showGamesList());
    }

    const backToTrackerBtn = document.getElementById('back-to-tracker-btn');
    if (backToTrackerBtn) {
      backToTrackerBtn.addEventListener('click', () => this.showGameSetup());
    }

    const endGameBtn = document.getElementById('end-game-btn');
    if (endGameBtn) {
      endGameBtn.addEventListener('click', () => this.handleEndGame());
    }

    const resetPlayBtn = document.getElementById('reset-play-btn');
    if (resetPlayBtn) {
      resetPlayBtn.addEventListener('click', () => this.resetPlayForm());
    }

    // Score inputs
    const teamScoreInput = document.getElementById('team-score');
    const opponentScoreInput = document.getElementById('opponent-score');

    if (teamScoreInput) {
      teamScoreInput.addEventListener('change', () => this.updateScore());
    }
    if (opponentScoreInput) {
      opponentScoreInput.addEventListener('change', () => this.updateScore());
    }

    // Set default date to today
    const gameDateInput = document.getElementById('game-date');
    if (gameDateInput) {
      const today = new Date().toISOString().split('T')[0];
      gameDateInput.value = today;
    }
  }

  loadPlayers() {
    // Load players from localStorage or default list
    const savedPlayers = localStorage.getItem('team_roster');

    if (savedPlayers) {
      this.players = JSON.parse(savedPlayers);
    } else {
      // Default player list (you can customize this)
      this.players = [
        { id: 'player_1', name: 'Player 1', position: 'QB' },
        { id: 'player_2', name: 'Player 2', position: 'WR' },
        { id: 'player_3', name: 'Player 3', position: 'WR' },
        { id: 'player_4', name: 'Player 4', position: 'RB' },
        { id: 'player_5', name: 'Player 5', position: 'DB' },
        { id: 'player_6', name: 'Player 6', position: 'DB' },
      ];
    }

    this.populatePlayerSelects();
  }

  populatePlayerSelects() {
    const playerSelects = document.querySelectorAll('.player-select');

    playerSelects.forEach(select => {
      // Clear existing options except first
      while (select.options.length > 1) {
        select.remove(1);
      }

      // Add players
      this.players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `${player.name} (${player.position})`;
        select.appendChild(option);
      });
    });
  }

  handleGameSetup(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const gameDate = document.getElementById('game-date').value;
    const gameTime = document.getElementById('game-time').value;
    const opponentName = document.getElementById('opponent-name').value;
    const location = document.getElementById('location').value;
    const homeAway = document.getElementById('home-away').value;
    const weather = document.getElementById('weather').value;
    const temperature = document.getElementById('temperature').value;
    const fieldConditions = document.getElementById('field-conditions').value;

    // Create game object
    this.currentGame = {
      gameId: `GAME_${Date.now()}`,
      teamId: 'TEAM_001', // You can make this dynamic
      gameDate,
      gameTime,
      opponentName,
      location,
      isHomeGame: homeAway === 'home',
      weather,
      temperature: temperature ? parseInt(temperature) : null,
      fieldConditions,
      teamScore: 0,
      opponentScore: 0,
      plays: [],
      createdAt: new Date().toISOString()
    };

    // Save game to localStorage
    gameStatsService.saveGame(this.currentGame);

    // Show live tracking section
    this.showLiveTracking();

    // Update game title
    const gameTitle = document.getElementById('game-title');
    if (gameTitle) {
      gameTitle.textContent = `vs ${opponentName} - ${new Date(gameDate).toLocaleDateString()}`;
    }

    logger.info('Game started:', this.currentGame);
  }

  showLiveTracking() {
    const setupSection = document.getElementById('game-setup-section');
    const trackingSection = document.getElementById('live-tracking-section');
    const listSection = document.getElementById('game-list-section');

    if (setupSection) setupSection.style.display = 'none';
    if (trackingSection) trackingSection.style.display = 'block';
    if (listSection) listSection.style.display = 'none';

    this.resetPlayForm();
    this.updateQuickStats();
  }

  showGameSetup() {
    const setupSection = document.getElementById('game-setup-section');
    const trackingSection = document.getElementById('live-tracking-section');
    const listSection = document.getElementById('game-list-section');

    if (setupSection) setupSection.style.display = 'block';
    if (trackingSection) trackingSection.style.display = 'none';
    if (listSection) listSection.style.display = 'none';
  }

  showGamesList() {
    const setupSection = document.getElementById('game-setup-section');
    const trackingSection = document.getElementById('live-tracking-section');
    const listSection = document.getElementById('game-list-section');

    if (setupSection) setupSection.style.display = 'none';
    if (trackingSection) trackingSection.style.display = 'none';
    if (listSection) listSection.style.display = 'block';

    this.loadGamesList();
  }

  loadGamesList() {
    const games = gameStatsService.getAllGames();
    const gamesList = document.getElementById('games-list');

    if (!gamesList) return;

    if (games.length === 0) {
      gamesList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="calendar" class="icon-48"></i>
          <p>No games tracked yet</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    gamesList.innerHTML = games.map(game => {
      const result = this.determineGameResult(game);
      return `
        <div class="game-item" onclick="window.gameTrackerPage.loadGame('${game.gameId}')">
          <div class="game-item-header">
            <div class="game-date">
              ${new Date(game.gameDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div class="game-result game-result-${result.toLowerCase()}">
              ${result}
            </div>
          </div>
          <div class="game-matchup">
            vs ${game.opponentName}
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
    }).join('');

    lucide.createIcons();
  }

  determineGameResult(game) {
    if (game.teamScore > game.opponentScore) return 'Win';
    if (game.teamScore < game.opponentScore) return 'Loss';
    return 'Tie';
  }

  loadGame(gameId) {
    const game = gameStatsService.getGame(gameId);
    if (game) {
      this.currentGame = game;
      this.plays = game.plays || [];
      this.playCounter = this.plays.length;

      // Update UI
      document.getElementById('team-score').value = game.teamScore;
      document.getElementById('opponent-score').value = game.opponentScore;

      this.showLiveTracking();
      this.renderRecentPlays();
    }
  }

  handlePlayTypeSelect(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const playType = button.dataset.type;

    // Update active state
    document.querySelectorAll('.play-type-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    // Set hidden input
    document.getElementById('play-type').value = playType;

    // Show/hide relevant sections
    const passSection = document.getElementById('pass-play-section');
    const runSection = document.getElementById('run-play-section');
    const flagPullSection = document.getElementById('flag-pull-section');

    if (passSection) passSection.style.display = 'none';
    if (runSection) runSection.style.display = 'none';
    if (flagPullSection) flagPullSection.style.display = 'none';

    if (playType === 'pass' && passSection) {
      passSection.style.display = 'block';
    } else if (playType === 'run' && runSection) {
      runSection.style.display = 'block';
    } else if (playType === 'flag_pull' && flagPullSection) {
      flagPullSection.style.display = 'block';
    }
  }

  handlePassOutcomeSelect(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const outcome = button.dataset.outcome;

    // Update active state
    document.querySelectorAll('.outcome-btn[data-outcome]').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    // Set hidden input
    document.getElementById('pass-outcome').value = outcome;

    // Show drop analysis if drop
    const dropSection = document.getElementById('drop-analysis-section');
    if (dropSection) {
      dropSection.style.display = outcome === 'drop' ? 'block' : 'none';
    }
  }

  handleFlagOutcomeSelect(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const outcome = button.dataset.flagOutcome;

    // Update active state
    document.querySelectorAll('.outcome-btn[data-flag-outcome]').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    // Set hidden input
    document.getElementById('flag-pull-outcome').value = outcome;

    // Show miss analysis if miss
    const missSection = document.getElementById('miss-analysis-section');
    if (missSection) {
      missSection.style.display = outcome === 'miss' ? 'block' : 'none';
    }
  }

  handlePlaySubmit(e) {
    e.preventDefault();

    if (!this.currentGame) {
      alert('Please start a game first');
      return;
    }

    const playType = document.getElementById('play-type').value;

    if (!playType) {
      alert('Please select a play type');
      return;
    }

    this.playCounter++;

    const basePlay = {
      playNumber: this.playCounter,
      quarter: parseInt(document.getElementById('quarter').value),
      down: parseInt(document.getElementById('down').value),
      distance: parseInt(document.getElementById('distance').value),
      yardLine: parseInt(document.getElementById('yard-line').value),
      playType: playType,
      playNotes: document.getElementById('play-notes').value,
      timestamp: new Date().toISOString()
    };

    let play = { ...basePlay };

    // Add type-specific data
    if (playType === 'pass') {
      play = {
        ...play,
        quarterbackId: document.getElementById('quarterback').value,
        receiverId: document.getElementById('receiver').value,
        routeType: document.getElementById('route-type').value,
        routeDepth: parseInt(document.getElementById('route-depth').value) || 0,
        outcome: document.getElementById('pass-outcome').value,
        throwAccuracy: document.getElementById('throw-accuracy').value,
        isDrop: document.getElementById('pass-outcome').value === 'drop',
        dropSeverity: document.getElementById('drop-severity').value,
        dropReason: document.getElementById('drop-reason').value
      };
    } else if (playType === 'run') {
      play = {
        ...play,
        ballCarrierId: document.getElementById('ball-carrier').value,
        yardsGained: parseInt(document.getElementById('yards-gained').value) || 0
      };
    } else if (playType === 'flag_pull') {
      play = {
        ...play,
        defenderId: document.getElementById('defender').value,
        ballCarrierId: document.getElementById('carrier').value,
        isSuccessful: document.getElementById('flag-pull-outcome').value === 'success',
        missReason: document.getElementById('miss-reason').value
      };
    }

    // Add play to game
    this.plays.push(play);
    this.currentGame.plays = this.plays;

    // Save to service
    gameStatsService.saveGame(this.currentGame);

    logger.info('Play saved:', play);

    // Update UI
    this.updateQuickStats();
    this.renderRecentPlays();
    this.resetPlayForm();

    // Show success message
    this.showSuccessMessage('Play saved successfully!');
  }

  updateQuickStats() {
    const totalPlaysEl = document.getElementById('total-plays');
    const totalCompletionsEl = document.getElementById('total-completions');
    const totalDropsEl = document.getElementById('total-drops');
    const totalFlagPullsEl = document.getElementById('total-flag-pulls');

    if (totalPlaysEl) totalPlaysEl.textContent = this.plays.length;
    if (totalCompletionsEl) totalCompletionsEl.textContent = this.countCompletions(this.plays);
    if (totalDropsEl) totalDropsEl.textContent = this.countDrops(this.plays);
    if (totalFlagPullsEl) totalFlagPullsEl.textContent = this.countFlagPulls(this.plays);
  }

  countCompletions(plays) {
    return plays?.filter(p => p.playType === 'pass' && p.outcome === 'completion').length || 0;
  }

  countDrops(plays) {
    return plays?.filter(p => p.isDrop === true).length || 0;
  }

  countFlagPulls(plays) {
    return plays?.filter(p => p.playType === 'flag_pull' && p.isSuccessful === true).length || 0;
  }

  renderRecentPlays() {
    const recentPlaysList = document.getElementById('recent-plays-list');

    if (!recentPlaysList) return;

    if (this.plays.length === 0) {
      recentPlaysList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="clipboard" class="icon-48"></i>
          <p>No plays tracked yet. Start tracking plays above!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    // Show last 10 plays, most recent first
    const recentPlays = [...this.plays].reverse().slice(0, 10);

    recentPlaysList.innerHTML = recentPlays.map(play => {
      const badge = this.getPlayBadge(play);
      const description = this.getPlayDescription(play);

      return `
        <div class="play-item">
          <div class="play-item-content">
            <div class="play-item-header">
              <span class="play-number">#${play.playNumber}</span>
              <span class="play-context">Q${play.quarter} • ${play.down}${this.getOrdinal(play.down)} & ${play.distance}</span>
            </div>
            <div class="play-description">${description}</div>
            <div class="play-details">
              ${play.playNotes ? play.playNotes : 'No notes'}
            </div>
          </div>
          <div class="play-item-actions">
            ${badge}
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  getPlayBadge(play) {
    if (play.playType === 'pass') {
      if (play.outcome === 'completion') {
        return '<span class="play-badge play-badge-success">Completion</span>';
      } else if (play.isDrop) {
        return '<span class="play-badge play-badge-danger">Drop</span>';
      } else if (play.outcome === 'interception') {
        return '<span class="play-badge play-badge-danger">INT</span>';
      } else {
        return '<span class="play-badge play-badge-warning">Incomplete</span>';
      }
    } else if (play.playType === 'flag_pull') {
      return play.isSuccessful
        ? '<span class="play-badge play-badge-success">Flag Pull</span>'
        : '<span class="play-badge play-badge-danger">Missed</span>';
    } else if (play.playType === 'run') {
      return `<span class="play-badge play-badge-info">${play.yardsGained} yards</span>`;
    }
    return '<span class="play-badge play-badge-info">Other</span>';
  }

  getPlayDescription(play) {
    const getPlayerName = (id) => {
      const player = this.players.find(p => p.id === id);
      return player ? player.name : 'Unknown';
    };

    if (play.playType === 'pass') {
      const qb = getPlayerName(play.quarterbackId);
      const receiver = getPlayerName(play.receiverId);
      const route = play.routeType || 'route';
      return `${qb} to ${receiver} on ${route}`;
    } else if (play.playType === 'run') {
      const carrier = getPlayerName(play.ballCarrierId);
      return `${carrier} runs for ${play.yardsGained} yards`;
    } else if (play.playType === 'flag_pull') {
      const defender = getPlayerName(play.defenderId);
      const carrier = getPlayerName(play.ballCarrierId);
      return `${defender} ${play.isSuccessful ? 'pulls flag on' : 'misses'} ${carrier}`;
    }
    return 'Play';
  }

  getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  resetPlayForm() {
    const form = document.getElementById('play-entry-form');
    if (form) form.reset();

    // Reset active states
    document.querySelectorAll('.play-type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.outcome-btn').forEach(btn => btn.classList.remove('active'));

    // Hide conditional sections
    document.getElementById('pass-play-section').style.display = 'none';
    document.getElementById('run-play-section').style.display = 'none';
    document.getElementById('flag-pull-section').style.display = 'none';
    document.getElementById('drop-analysis-section').style.display = 'none';
    document.getElementById('miss-analysis-section').style.display = 'none';

    // Clear hidden inputs
    document.getElementById('play-type').value = '';
    document.getElementById('pass-outcome').value = '';
    document.getElementById('flag-pull-outcome').value = '';
  }

  updateScore() {
    if (!this.currentGame) return;

    const teamScore = parseInt(document.getElementById('team-score').value) || 0;
    const opponentScore = parseInt(document.getElementById('opponent-score').value) || 0;

    this.currentGame.teamScore = teamScore;
    this.currentGame.opponentScore = opponentScore;

    gameStatsService.saveGame(this.currentGame);
  }

  handleEndGame() {
    if (!this.currentGame) return;

    if (confirm('Are you sure you want to end this game? All data will be saved.')) {
      this.updateScore();

      // Determine game result
      const teamScore = this.currentGame.teamScore;
      const opponentScore = this.currentGame.opponentScore;

      if (teamScore > opponentScore) {
        this.currentGame.gameResult = 'win';
      } else if (teamScore < opponentScore) {
        this.currentGame.gameResult = 'loss';
      } else {
        this.currentGame.gameResult = 'tie';
      }

      gameStatsService.saveGame(this.currentGame);

      this.showSuccessMessage('Game ended and saved successfully!');

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
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-color);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-lg);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
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
