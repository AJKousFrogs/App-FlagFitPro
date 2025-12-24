// Coach Page JavaScript Module
import { authManager } from "../../auth-manager.js";
import { logger } from "../../logger.js";

// Sample player data
const playersData = [
  {
    id: 1,
    name: "Marcus Johnson",
    position: "Quarterback",
    number: 12,
    status: "active",
    olympicScore: 92,
    accuracy: "89%",
    fortyYard: "4.45s",
    games: 47,
  },
  {
    id: 2,
    name: "Vince Machi",
    position: "Wide Receiver",
    number: 84,
    status: "active",
    olympicScore: 88,
    accuracy: "94%",
    fortyYard: "4.38s",
    games: 44,
  },
  {
    id: 3,
    name: "Sarah Thompson",
    position: "Defensive Back",
    number: 21,
    status: "injured",
    olympicScore: 85,
    accuracy: "12",
    fortyYard: "4.52s",
    games: 39,
  },
  {
    id: 4,
    name: "David Martinez",
    position: "Linebacker",
    number: 55,
    status: "rest",
    olympicScore: 83,
    accuracy: "87",
    fortyYard: "4.61s",
    games: 41,
  },
  {
    id: 5,
    name: "Emily Chen",
    position: "Wide Receiver",
    number: 18,
    status: "active",
    olympicScore: 90,
    accuracy: "91%",
    fortyYard: "4.41s",
    games: 35,
  },
  {
    id: 6,
    name: "Jason Williams",
    position: "Running Back",
    number: 28,
    status: "active",
    olympicScore: 86,
    accuracy: "78%",
    fortyYard: "4.35s",
    games: 42,
  },
];

async function initCoachDashboard() {
  if (!authManager.isAuthenticated()) {
    window.location.href = "/login.html";
    return;
  }

  // Update coach profile
  const user = authManager.getCurrentUser();
  if (user) {
    const initials = (user.name || user.email || "CW")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Check if elements exist before updating them
    const coachAvatar = document.getElementById("coachAvatar");
    const coachName = document.getElementById("coachName");
    const userAvatar = document.getElementById("user-avatar");

    if (coachAvatar) {
      coachAvatar.textContent = initials;
    }
    if (coachName) {
      coachName.textContent =
        user.name || "Coach " + user.email?.split("@")[0] || "Coach Williams";
    }
    if (userAvatar) {
      userAvatar.textContent = initials;
    }
  }

  loadPlayers();
  updateTeamStats();
}

function loadPlayers() {
  const playersGrid = document.getElementById("playersGrid");
  if (playersGrid) {
    playersGrid.innerHTML = playersData
      .map((player) => createPlayerCard(player))
      .join("");
  }
}

function createPlayerCard(player) {
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const statusClass = `status-${player.status}`;
  const statusText =
    player.status.charAt(0).toUpperCase() + player.status.slice(1);

  // Determine the second stat based on position
  let secondStat = "";
  let secondStatLabel = "";
  if (player.position.includes("Quarterback")) {
    secondStat = player.accuracy;
    secondStatLabel = "Accuracy";
  } else if (player.position.includes("Receiver")) {
    secondStat = player.accuracy;
    secondStatLabel = "Catch Rate";
  } else if (player.position.includes("Defensive")) {
    secondStat = player.accuracy;
    secondStatLabel = "Interceptions";
  } else {
    secondStat = player.accuracy;
    secondStatLabel = "Tackles";
  }

  return `
            <div class="player-card">
                <div class="player-header">
                    <div class="player-avatar">${initials}</div>
                    <div class="player-info">
                        <h4 class="player-name">${player.name}</h4>
                        <div class="player-position">${player.position} • #${player.number}</div>
                    </div>
                    <div class="player-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="player-stats">
                    <div class="stat-item">
                        <span class="stat-value">${player.olympicScore}</span>
                        <span class="stat-label">Olympic Score</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${secondStat}</span>
                        <span class="stat-label">${secondStatLabel}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${player.fortyYard}</span>
                        <span class="stat-label">40-Yard</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${player.games}</span>
                        <span class="stat-label">Games</span>
                    </div>
                </div>
                
                <div class="player-actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewPlayerProfile(${player.id})">View Profile</button>
                    <button class="btn btn-secondary btn-sm" onclick="editPlayer(${player.id})">Edit</button>
                    <button class="btn btn-secondary btn-sm" onclick="viewPlayerStats(${player.id})">${player.status === "injured" ? "Injury Report" : "Stats"}</button>
                </div>
            </div>
        `;
}

function updateTeamStats() {
  const activeCount = playersData.filter((p) => p.status === "active").length;
  const availableCount = playersData.filter(
    (p) => p.status === "active" || p.status === "rest",
  ).length;

  const activePlayersCount = document.getElementById("activePlayersCount");
  const availableToday = document.getElementById("availableToday");

  if (activePlayersCount) {
    activePlayersCount.textContent = playersData.length;
  }
  if (availableToday) {
    availableToday.textContent = `${availableCount}/${playersData.length} available today`;
  }
}

// Tab switching functionality
function switchTab(tab) {
  document
    .querySelectorAll(".coach-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelector(`[onclick="switchTab('${tab}')"]`)
    ?.classList.add("active");

  // Here you would implement actual tab switching logic
  logger.debug("Switched to tab:", tab);
}

// Player management functions
function addPlayer() {
  showPlayerModal("add");
}

function viewPlayerProfile(playerId) {
  const player = playersData.find((p) => p.id === playerId);
  showPlayerModal("view", player);
}

function editPlayer(playerId) {
  const player = playersData.find((p) => p.id === playerId);
  showPlayerModal("edit", player);
}

function viewPlayerStats(playerId) {
  const player = playersData.find((p) => p.id === playerId);
  showPlayerStatsModal(player);
}

function runAIAnalysis() {
  showAIAnalysisModal();
}

// Modal functions for player management
function showPlayerModal(mode, player = null) {
  const modal = document.createElement("div");
  modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: var(--z-index-modal, 1400);
        `;

  let modalContent = "";

  if (mode === "add") {
    modalContent = `
                <div class="card" style="max-width: 500px; width: 90%;">
                    <h3 class="text-primary">Add New Player</h3>
                    <form onsubmit="handleAddPlayer(event)">
                        <div style="margin-bottom: 1rem;">
                            <label class="form-label">Full Name</label>
                            <input type="text" id="playerName" required class="form-input">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label class="form-label">Position</label>
                            <select id="playerPosition" required class="form-select">
                                <option value="">Select Position</option>
                                <option value="QB">Quarterback</option>
                                <option value="WR">Wide Receiver</option>
                                <option value="RB">Running Back</option>
                                <option value="C">Center</option>
                                <option value="DE">Defensive End</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label class="form-label">Jersey Number</label>
                            <input type="number" id="playerNumber" min="1" max="99" required class="form-input">
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" onclick="this.closest('div').remove()" class="btn btn-secondary btn-md">Cancel</button>
                            <button type="submit" class="btn btn-primary btn-md">Add Player</button>
                        </div>
                    </form>
                </div>
            `;
  } else if (mode === "view" && player) {
    modalContent = `
                <div style="background: var(--dark-text-primary); padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%;">
                    <h3 style="margin-bottom: 1rem; color: var(--dark-text-primary);">${player.name} - Profile</h3>
                    <div style="margin-bottom: 1rem;">
                        <strong>Position:</strong> ${player.position}
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong>Jersey Number:</strong> #${player.number}
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong>Status:</strong> <span style="color: var(--success);">Active</span>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <strong>Recent Performance:</strong> Strong training attendance, consistent improvement in speed drills.
                    </div>
                    <div style="text-align: right;">
                        <button onclick="this.closest('div').remove()" class="btn btn-primary btn-md">Close</button>
                    </div>
                </div>
            `;
  } else if (mode === "edit" && player) {
    modalContent = `
                <div style="background: var(--dark-text-primary); padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%;">
                    <h3 style="margin-bottom: 1rem; color: var(--dark-text-primary);">Edit ${player.name}</h3>
                    <form onsubmit="handleEditPlayer(event, ${player.id})">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: var(--font-weight-medium, 500);">Full Name</label>
                            <input type="text" id="editPlayerName" value="${player.name}" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--dark-border); border-radius: 6px;">
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: var(--font-weight-medium, 500);">Position</label>
                            <select id="editPlayerPosition" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--dark-border); border-radius: 6px;">
                                <option value="QB" ${player.position === "QB" ? "selected" : ""}>Quarterback</option>
                                <option value="WR" ${player.position === "WR" ? "selected" : ""}>Wide Receiver</option>
                                <option value="RB" ${player.position === "RB" ? "selected" : ""}>Running Back</option>
                                <option value="C" ${player.position === "C" ? "selected" : ""}>Center</option>
                                <option value="DE" ${player.position === "DE" ? "selected" : ""}>Defensive End</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: var(--font-weight-medium, 500);">Jersey Number</label>
                            <input type="number" id="editPlayerNumber" value="${player.number}" min="1" max="99" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--dark-border); border-radius: 6px;">
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" onclick="this.closest('div').remove()" class="btn btn-secondary btn-md">Cancel</button>
                            <button type="submit" class="btn btn-primary btn-md">Save Changes</button>
                        </div>
                    </form>
                </div>
            `;
  }

  modal.innerHTML = modalContent;
  document.body.appendChild(modal);
}

function showPlayerStatsModal(player) {
  const modal = document.createElement("div");
  modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: var(--z-index-modal, 1400);
        `;

  modal.innerHTML = `
            <div style="background: var(--dark-text-primary); padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%;">
                <h3 style="margin-bottom: 1rem; color: var(--dark-text-primary);">${player.name} - Performance Stats</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <div style="text-align: center; padding: 1rem; background: var(--dark-bg-secondary); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">94%</div>
                        <div style="font-size: 0.875rem; color: var(--dark-text-secondary);">Training Attendance</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--dark-bg-secondary); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">8.2</div>
                        <div style="font-size: 0.875rem; color: var(--dark-text-secondary);">Avg Performance Score</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--dark-bg-secondary); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning);">15</div>
                        <div style="font-size: 0.875rem; color: var(--dark-text-secondary);">Games Played</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--dark-bg-secondary); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--info);">7</div>
                        <div style="font-size: 0.875rem; color: var(--dark-text-secondary);">Touchdowns</div>
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Recent Notes:</strong>
                    <p style="margin-top: 0.5rem; color: var(--dark-text-secondary);">Excellent progress in speed training. Shows leadership qualities. Recommend for advanced drills.</p>
                </div>
                <div style="text-align: right;">
                    <button onclick="this.closest('div').remove()" style="padding: 0.75rem 1.5rem; background: var(--primary); color: var(--dark-text-primary); border: none; border-radius: 6px; cursor: pointer;">Close</button>
                </div>
            </div>
        `;

  document.body.appendChild(modal);
}

function showAIAnalysisModal() {
  const modal = document.createElement("div");
  modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: var(--z-index-modal, 1400);
        `;

  modal.innerHTML = `
            <div style="background: var(--dark-text-primary); padding: 2rem; border-radius: 12px; max-width: 700px; width: 90%;">
                <h3 style="margin-bottom: 1rem; color: var(--dark-text-primary);"><i data-lucide="bot" style="width: 16px;  height: 16px;  display: inline-block;  vertical-align: middle ;   color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i> AI Team Chemistry Analysis</h3>
                <div style="margin-bottom: 1rem; padding: 1rem; background: var(--primary-50); border-radius: 8px; border-left: 4px solid var(--primary);">
                    <strong>Analysis Complete</strong>
                    <p style="margin: 0.5rem 0 0 0;">Based on training data, game performance, and interaction patterns.</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <h4>Key Insights:</h4>
                    <ul style="margin-left: 1rem;">
                        <li>Strong offensive coordination between QB and WR positions</li>
                        <li>Defensive line shows excellent teamwork and communication</li>
                        <li>Recommend cross-training exercises for RB and WR groups</li>
                        <li>Overall team chemistry score: 87/100 (Excellent)</li>
                    </ul>
                </div>
                <div style="margin-bottom: 1rem;">
                    <h4>Recommendations:</h4>
                    <ul style="margin-left: 1rem;">
                        <li>Schedule more joint practice sessions for offense/defense</li>
                        <li>Implement team-building activities outside of training</li>
                        <li>Focus on leadership development for veteran players</li>
                    </ul>
                </div>
                <div style="text-align: right;">
                    <button onclick="this.closest('div').remove()" style="padding: 0.75rem 1.5rem; background: var(--primary); color: var(--dark-text-primary); border: none; border-radius: 6px; cursor: pointer;">Close Analysis</button>
                </div>
            </div>
        `;

  document.body.appendChild(modal);
}

// Form handlers for player management
function handleAddPlayer(event) {
  event.preventDefault();
  const name = document.getElementById("playerName").value;
  const position = document.getElementById("playerPosition").value;
  const number = parseInt(document.getElementById("playerNumber").value);

  // Check if number is already taken
  const numberTaken = playersData.some((p) => p.number === number);
  if (numberTaken) {
    alert(
      `Jersey number ${number} is already taken. Please choose another number.`,
    );
    return;
  }

  // Add player to data
  const newPlayer = {
    id: Date.now(),
    name: name,
    position: position,
    number: number,
    status: "Active",
  };

  playersData.push(newPlayer);
  loadPlayers(); // Re-render players

  // Close modal
  event.target.closest("div").closest("div").remove();

  // Show success message
  alert(`${name} has been added to the team successfully!`);
}

function handleEditPlayer(event, playerId) {
  event.preventDefault();
  const name = document.getElementById("editPlayerName").value;
  const position = document.getElementById("editPlayerPosition").value;
  const number = parseInt(document.getElementById("editPlayerNumber").value);

  // Check if number is already taken by another player
  const numberTaken = playersData.some(
    (p) => p.number === number && p.id !== playerId,
  );
  if (numberTaken) {
    alert(
      `Jersey number ${number} is already taken. Please choose another number.`,
    );
    return;
  }

  // Update player data
  const playerIndex = playersData.findIndex((p) => p.id === playerId);
  if (playerIndex !== -1) {
    playersData[playerIndex] = {
      ...playersData[playerIndex],
      name: name,
      position: position,
      number: number,
    };
  }

  loadPlayers(); // Re-render players

  // Close modal
  event.target.closest("div").closest("div").remove();

  // Show success message
  alert(`${name}'s information has been updated successfully!`);
}

// Mobile sidebar toggle
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    sidebar.classList.toggle("open");
  }
}

// Export functions to global scope for onclick handlers
window.switchTab = switchTab;
window.addPlayer = addPlayer;
window.viewPlayerProfile = viewPlayerProfile;
window.editPlayer = editPlayer;
window.viewPlayerStats = viewPlayerStats;
window.runAIAnalysis = runAIAnalysis;
window.handleAddPlayer = handleAddPlayer;
window.handleEditPlayer = handleEditPlayer;
window.toggleSidebar = toggleSidebar;

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initCoachDashboard);
