// Training Page JavaScript Module
import { authManager } from "../../auth-manager.js";
import {
  REAL_TEAM_DATA,
  getAllPlayers,
  getStaffMember,
} from "../../real-team-data.js";
import {
  initializeLucideIcons,
  announceToScreenReader,
  debounce,
  saveToStorage,
  getFromStorage,
} from "../utils/shared.js";
import TrainingVideoComponent from "../../training-video-component.js";
// Services
import { storageService } from "../services/storageService.js";
import { workoutService } from "../services/workoutService.js";
import { scheduleService } from "../services/scheduleService.js";
import { statsService } from "../services/statsService.js";
// State & Renderers
import { trainingPageState } from "./training-page-state.js";
import { renderPage, renderWeeklySchedule } from "./training-page-renderers.js";
// Components
import ScheduleBuilderModal from "../components/schedule-builder-modal.js";
import ProgramModal from "../components/program-modal.js";
// Config
import {
  OFFSEASON_PROGRAM_CONFIG,
  QB_PROGRAM_CONFIG,
} from "../config/program-configs.js";
// Utils
import { delegateClick } from "../utils/event-delegation.js";
// Training Modules
import { qbTraining } from "../../training-modules/qb-training.js";
import { dbTraining } from "../../training-modules/db-training.js";
import { logger } from "../../logger.js";

// Initialize training page
document.addEventListener("DOMContentLoaded", async function () {
  // Initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  
  // Check authentication - wait for auth manager to initialize first
  const isAuthenticated = await authManager.requireAuth();
  if (!isAuthenticated) {
    return; // requireAuth() already handles redirect
  }

  // Initialize page state and load data
  await initializePageState();

  // Render page with loaded state
  renderPage(trainingPageState.getState());

  // Initialize YouTube training videos
  initializeTrainingVideos();

  // Initialize AI Chat Assistant Button
  initializeAIChatButton();

  // Initialize workout card event delegation
  initializeWorkoutCards();

  // Setup global functions
  setupGlobalFunctions();

  // Initialize modal instances
  initializeModals();
});

// Setup global functions for inline handlers
function setupGlobalFunctions() {
  window.toggleSidebar = toggleSidebar;
  window.closeMenu = toggleSidebar; // Alias for menu-scrim
}

// Toggle sidebar for mobile
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const toggleBtn = document.getElementById("mobile-menu-toggle");

  if (!sidebar) return;

  const isOpen =
    sidebar.classList.contains("open") ||
    sidebar.classList.contains("mobile-open");

  if (isOpen) {
    sidebar.classList.remove("open", "mobile-open");
    if (overlay) overlay.classList.remove("active");
    document.body.classList.remove("sidebar-open", "menu-open");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", "false");
    }
    // Return focus to toggle button
    if (toggleBtn) toggleBtn.focus();
  } else {
    sidebar.classList.add("open", "mobile-open");
    if (overlay) overlay.classList.add("active");
    document.body.classList.add("sidebar-open", "menu-open");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", "true");
    }
    // Focus first nav item for accessibility
    const firstNavItem = sidebar.querySelector(".nav-item");
    if (firstNavItem) firstNavItem.focus();
  }
}

// Initialize YouTube Training Videos Component
function initializeTrainingVideos() {
  try {
    logger.debug("🎥 Initializing YouTube training videos...");
    const videoComponent = new TrainingVideoComponent(
      "training-videos-container",
    );
    logger.debug("✅ Training videos component initialized");
  } catch (error) {
    logger.error("❌ Error initializing training videos:", error);
    // Show fallback message
    const container = document.getElementById("training-videos-container");
    if (container) {
      container.innerHTML = `
                <div style="background: var(--surface-primary); border: 1px solid var(--color-border-primary); text-align: center; padding: 2rem; border-radius: 12px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 1rem;">📺 Training Videos</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Training videos are temporarily unavailable.</p>
                    <a href="https://www.youtube.com/results?search_query=flag+football+training+drills" target="_blank" class="btn btn-primary">
                        Search YouTube Manually
                    </a>
                </div>
            `;
    }
  }
}

/**
 * Initialize page state by loading all data
 */
async function initializePageState() {
  // Load user data
  const user = authManager.getCurrentUser();
  if (user) {
    // Get a random real player for demo
    const allPlayers = getAllPlayers();
    const randomPlayer =
      allPlayers[Math.floor(Math.random() * allPlayers.length)];

    const displayName = randomPlayer.name;
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    // Update avatar
    const userAvatar = document.querySelector(".user-avatar");
    if (userAvatar) {
      userAvatar.textContent = initials;
    }

    // Set user in state
    trainingPageState.setUser({
      name: displayName,
      initials: initials,
      nationality: randomPlayer.nationality,
      jersey: randomPlayer.jersey,
      position: randomPlayer.position,
    });
  }

  // Load schedule settings
  const scheduleSettings = storageService.getScheduleSettings();
  trainingPageState.setScheduleSettings(scheduleSettings);

  // Load recent workouts
  const recentWorkouts = storageService.getRecentWorkouts();
  trainingPageState.setRecentWorkouts(recentWorkouts);

  // Calculate stats
  const today = new Date();
  const weeklyStats = statsService.calculateWeeklyStats(recentWorkouts, today);
  const overallStats = statsService.calculateOverallStats(recentWorkouts);
  const streak = statsService.computeStreak(recentWorkouts, today);
  trainingPageState.setStats(weeklyStats, overallStats, streak);

  // Generate weekly schedule
  const weeklySchedule = scheduleService.generateWeekSchedule({
    today,
    scheduleSettings,
    recentWorkouts,
  });
  trainingPageState.setWeeklySchedule(weeklySchedule);

  // Load program states
  const currentProgram = storageService.getOffseasonProgram();
  const qbProgram = storageService.getQBProgram();
  if (currentProgram) trainingPageState.setCurrentProgram(currentProgram);
  if (qbProgram) trainingPageState.setQBProgram(qbProgram);

  // Set up global function for workout exercises (needed by workout.html)
  window.getWorkoutExercises = (type) =>
    workoutService.getExercisesForType(type);
}

// Get user's custom schedule settings (using service)
function getUserSchedule() {
  return storageService.getScheduleSettings();
}

// Save user's custom schedule (using service)
function saveUserSchedule(schedule) {
  const success = storageService.saveScheduleSettings(schedule);
  if (success) {
    // Update state
    trainingPageState.setScheduleSettings(schedule);
    // Regenerate schedule
    const today = new Date();
    const recentWorkouts = trainingPageState.recentWorkouts;
    const weeklySchedule = scheduleService.generateWeekSchedule({
      today,
      scheduleSettings: schedule,
      recentWorkouts,
    });
    trainingPageState.setWeeklySchedule(weeklySchedule);
  }
  return success;
}

// Initialize Weekly Schedule View (now handled by renderer)
function initializeWeeklySchedule() {
  const state = trainingPageState.getState();
  renderWeeklySchedule(
    state.weeklySchedule,
    state.scheduleSettings,
    state.ui.scheduleViewMode,
  );
}

// Toggle schedule view between detailed and compact (using state)
window.toggleScheduleView = function () {
  const currentMode = trainingPageState.ui.scheduleViewMode;
  const newMode = currentMode === "detailed" ? "compact" : "detailed";

  trainingPageState.setScheduleViewMode(newMode);

  const state = trainingPageState.getState();
  renderWeeklySchedule(
    state.weeklySchedule,
    state.scheduleSettings,
    state.ui.scheduleViewMode,
  );
};

// Start workout for a specific day (using service)
window.startDayWorkout = function (type, dateISO) {
  const workoutSession = workoutService.createSession(type, dateISO);
  storageService.setCurrentWorkout(workoutSession);
  window.location.href = `/workout.html?type=${type}&id=${workoutSession.id}`;
};

// Open Custom Schedule Builder Modal (using component)
window.openCustomScheduleBuilder = function () {
  if (scheduleBuilderModal) {
    const schedule = getUserSchedule();
    trainingPageState.setActiveModal("scheduleBuilder");
    scheduleBuilderModal.open(schedule);
  }
};

function loadProgressData() {
  // This function is now handled by initializePageState and renderPage
  // Keeping for backward compatibility if needed
  const state = trainingPageState.getState();

  // Store getWorkoutExercises function for global access (using service)
  window.getWorkoutExercises = (type) =>
    workoutService.getExercisesForType(type);

  logger.debug("Training page state loaded:", {
    weeklyStats: state.weeklyStats,
    overallStats: state.overallStats,
    streak: state.streak,
  });
}

window.startWorkout = function (type, event) {
  // Handle both inline onclick and programmatic calls
  const card = event?.currentTarget || event?.target?.closest(".workout-card");
  const button = card?.querySelector(".btn");
  const originalText = button?.textContent;

  if (button) {
    button.textContent = "Starting...";
    button.disabled = true;
  }

  // Start actual workout session
  setTimeout(() => {
    // Create workout session using service
    const workoutSession = workoutService.createSession(type);

    // Save to storage using service
    storageService.setCurrentWorkout(workoutSession);

    // Navigate to workout interface
    window.location.href = `/workout.html?type=${type}&id=${workoutSession.id}`;
  }, 1000);
};

// Download Offseason Program
function downloadOffseasonProgram() {
  const config = OFFSEASON_PROGRAM_CONFIG;
  const link = document.createElement("a");
  link.href =
    "data:text/plain;charset=utf-8," +
    encodeURIComponent(
      `COMPLETE FLAG FOOTBALL OFFSEASON TRAINING PROGRAM\n${config.title}\n${config.startDate} - ${config.endDate} (${config.durationWeeks} Weeks)\n\nThis is the complete ${config.durationWeeks}-week periodized training program for flag football players. Visit the training section in FlagFit Pro for the interactive version with weekly breakdowns, exercise demonstrations, and progress tracking.`,
    );
  link.download = `FlagFit-Pro-${config.durationWeeks}Week-Offseason-Program.txt`;
  link.click();
  alert(
    `🎉 Program downloaded! The complete ${config.durationWeeks}-week training program with detailed weekly workouts is now saved to your device.`,
  );
}

// Start Offseason Program
function startOffseasonProgram() {
  const startDate = new Date().toISOString();
  const programData = {
    started: startDate,
    currentWeek: 1,
    currentPhase: "foundation",
    completedWorkouts: [],
    assessments: {},
  };
  storageService.saveOffseasonProgram(programData);
  trainingPageState.setCurrentProgram(programData);
  alert("🚀 Program started! Navigate to the workout section to begin Week 1.");
}

// Open Offseason Program Modal (using component)
window.openOffseasonProgram = function () {
  if (offseasonProgramModal) {
    trainingPageState.setActiveModal("offseasonProgram");
    offseasonProgramModal.open();
  }
};

// Download QB Program
function downloadQBProgram() {
  const config = QB_PROGRAM_CONFIG;
  const link = document.createElement("a");
  link.href =
    "data:text/plain;charset=utf-8," +
    encodeURIComponent(
      `COMPLETE QUARTERBACK FLAG FOOTBALL TRAINING PROGRAM\n${config.title}\n${config.startDate} - ${config.endDate}\n\nThis comprehensive ${config.durationWeeks}-week quarterback development program prepares you for the ultimate challenge: ${config.challenge.totalThrows} throws in a weekend tournament while maintaining velocity and accuracy. Includes dual-track training (lower body + QB-specific), evidence-based protocols, and progressive endurance building to handle ${config.challenge.gamesPerWeekend} games at elite level.`,
    );
  link.download = "FlagFit-Pro-Elite-QB-Program.txt";
  link.click();
  alert(
    "🎯 QB Program downloaded! The complete 14-week quarterback development program for 320 throws/weekend is now saved to your device.",
  );
}

// Start QB Program
function startQBProgram() {
  const startDate = new Date().toISOString();
  const programData = {
    started: startDate,
    currentWeek: 1,
    currentPhase: "foundation",
    position: "quarterback",
    completedWorkouts: [],
    assessments: {},
    armCareLog: [],
    throwingVolume: [],
  };
  storageService.saveQBProgram(programData);
  trainingPageState.setQBProgram(programData);
  alert(
    "🎯 QB Program started! Enhanced training with dual-track approach begins now.",
  );
}

// Open QB Program Modal (using component)
window.openQBProgram = function () {
  if (qbProgramModal) {
    trainingPageState.setActiveModal("qbProgram");
    qbProgramModal.open();
  }
};

// Navigation handlers
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function (e) {
    if (this.getAttribute("href") !== "#") {
      return; // Allow navigation
    }
    e.preventDefault();

    // Remove active class from all items
    document
      .querySelectorAll(".nav-item")
      .forEach((nav) => nav.classList.remove("active"));

    // Add active class to clicked item
    this.classList.add("active");
  });
});

// Add hover effects for workout cards
document.querySelectorAll(".workout-card").forEach((card) => {
  card.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-4px)";
  });

  card.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0)";
  });
});

// Initialize workout card event delegation (using utility)
function initializeWorkoutCards() {
  // Handle card clicks (excluding buttons)
  delegateClick(
    ".workouts-section",
    ".workout-card[data-workout-type]",
    (e, card) => {
      const workoutType = card.getAttribute("data-workout-type");
      if (workoutType && !e.target.closest(".btn")) {
        window.startWorkout(workoutType, e);
      }
    },
  );

  // Handle button clicks specifically
  delegateClick(
    ".workouts-section",
    ".workout-card[data-workout-type] .btn",
    (e, button) => {
      e.stopPropagation(); // Prevent card click from firing
      const card = button.closest(".workout-card[data-workout-type]");
      if (card) {
        const workoutType = card.getAttribute("data-workout-type");
        if (workoutType) {
          window.startWorkout(workoutType, e);
        }
      }
    },
  );
}

// Initialize modal instances
let scheduleBuilderModal = null;
let offseasonProgramModal = null;
let qbProgramModal = null;

function initializeModals() {
  // Schedule Builder Modal
  scheduleBuilderModal = new ScheduleBuilderModal({
    onSave: (schedule) => {
      // Update state
      trainingPageState.setScheduleSettings(schedule);
      // Regenerate schedule
      const today = new Date();
      const recentWorkouts = trainingPageState.recentWorkouts;
      const weeklySchedule = scheduleService.generateWeekSchedule({
        today,
        scheduleSettings: schedule,
        recentWorkouts,
      });
      trainingPageState.setWeeklySchedule(weeklySchedule);
      // Re-render
      const state = trainingPageState.getState();
      renderWeeklySchedule(
        state.weeklySchedule,
        state.scheduleSettings,
        state.ui.scheduleViewMode,
      );
    },
  });

  // Offseason Program Modal
  offseasonProgramModal = new ProgramModal(OFFSEASON_PROGRAM_CONFIG, {
    onDownload: downloadOffseasonProgram,
    onStart: startOffseasonProgram,
  });

  // QB Program Modal
  qbProgramModal = new ProgramModal(QB_PROGRAM_CONFIG, {
    onDownload: downloadQBProgram,
    onStart: startQBProgram,
  });
}

// Initialize AI Chat Assistant Button
function initializeAIChatButton() {
  const aiChatBtn =
    document.getElementById("ai-chat-button-training") ||
    document.querySelector(".ai-chat-button");
  if (aiChatBtn) {
    aiChatBtn.addEventListener("click", handleAIChat);
  }
}

// Handle AI Chat Button Click
async function handleAIChat(e) {
  e.preventDefault();

  const chatButton = e.target.closest(".ai-chat-button") || e.target;

  // Add visual feedback
  chatButton.style.transform = "scale(0.95)";
  setTimeout(() => {
    chatButton.style.transform = "scale(1)";
  }, 150);

  // Open the chatbot modal
  try {
    // Import and open chatbot
    const chatbotModule = await import("../components/chatbot.js");
    const { flagFitChatbot } = chatbotModule;

    if (flagFitChatbot && typeof flagFitChatbot.open === "function") {
      flagFitChatbot.open();
    } else {
      throw new Error("Chatbot module not properly initialized");
    }
  } catch (error) {
    logger.error("Failed to load chatbot:", error);

    // Try to use global chatbot if available
    if (
      window.flagFitChatbot &&
      typeof window.flagFitChatbot.open === "function"
    ) {
      window.flagFitChatbot.open();
    } else {
      // Last resort: show alert
      alert(
        "AI Assistant Chat\n\nAsk me about:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs",
      );
    }
  }
}

// Enhanced Training Module Functions
window.openQBTrainingModule = function () {
  try {
    logger.info("Opening QB Training Module");

    // Get current user data for training analysis
    const state = trainingPageState.getState();
    const playerData = {
      id: state.user?.name || "player1",
      position: "QB",
      stats: {
        passing: {
          short_completions: 45,
          short_attempts: 50,
          medium_completions: 28,
          medium_attempts: 40,
          deep_completions: 8,
          deep_attempts: 15,
        },
        decisions: {
          correct_reads: 25,
          total_reads: 30,
          avg_decision_time: 2.8,
          turnovers: 2,
        },
      },
    };

    // Generate QB training plan
    qbTraining
      .generateQBTrainingPlan(playerData)
      .then((plan) => {
        // Create modal to display training plan
        const modal = createTrainingPlanModal("QB Training Module", plan);
        document.body.appendChild(modal);
        modal.style.display = "flex";
      })
      .catch((error) => {
        logger.error("Failed to generate QB training plan:", error);
        alert(
          "QB Training Module\n\nFocus Areas:\n• Accuracy Training (Short/Medium/Deep)\n• Decision Making Excellence\n• Field Vision Development\n• Mechanics Optimization\n\nFeatures coming soon!",
        );
      });
  } catch (error) {
    logger.error("Error opening QB training module:", error);
    alert(
      "QB Training Module\n\nSpecialized quarterback training with AI-powered analytics coming soon!",
    );
  }
};

window.openDBTrainingModule = function () {
  try {
    logger.info("Opening DB Training Module");

    // Get current user data for training analysis
    const state = trainingPageState.getState();
    const playerData = {
      id: state.user?.name || "player1",
      position: "DB",
      stats: {
        flagPull: {
          successful_pulls: 18,
          attempted_pulls: 25,
          missed_flags: 3,
        },
        coverage: {
          completions_allowed: 8,
          targets: 15,
          blown_coverage: 1,
        },
      },
    };

    // Generate DB training plan
    dbTraining
      .generateTrainingPlan(playerData)
      .then((plan) => {
        // Create modal to display training plan
        const modal = createTrainingPlanModal("DB Training Module", plan);
        document.body.appendChild(modal);
        modal.style.display = "flex";
      })
      .catch((error) => {
        logger.error("Failed to generate DB training plan:", error);
        alert(
          "DB Training Module\n\nFocus Areas:\n• Flag Pull Mastery\n• Coverage Excellence\n• 1v1 Domination\n• Route Recognition\n\nFeatures coming soon!",
        );
      });
  } catch (error) {
    logger.error("Error opening DB training module:", error);
    alert(
      "DB Training Module\n\nSpecialized defensive back training with AI-powered analytics coming soon!",
    );
  }
};

window.openEnhancedAnalytics = function () {
  try {
    logger.info("Opening Enhanced Analytics Dashboard");
    window.location.href = "/analytics.html";
  } catch (error) {
    logger.error("Error opening enhanced analytics:", error);
    alert(
      "Enhanced Analytics Dashboard\n\nAdvanced ML-powered performance insights coming soon!",
    );
  }
};

// Helper function to create training plan modal
function createTrainingPlanModal(title, plan) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); display: none; align-items: center;
        justify-content: center; z-index: 10000; padding: 20px;
    `;

  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
        background: white; border-radius: 12px; max-width: 800px;
        max-height: 90vh; overflow-y: auto; padding: 24px; width: 100%;
    `;

  const header = document.createElement("div");
  header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;`;

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  titleEl.style.cssText = `margin: 0; color: var(--color-text-primary);`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = `
        background: none; border: none; font-size: 24px; cursor: pointer;
        padding: 8px; border-radius: 4px;
    `;
  closeBtn.onclick = () => modal.remove();

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const content = document.createElement("div");
  content.innerHTML = formatTrainingPlan(plan);

  modalContent.appendChild(header);
  modalContent.appendChild(content);
  modal.appendChild(modalContent);

  // Close on overlay click
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  return modal;
}

// Helper function to format training plan for display
function formatTrainingPlan(plan) {
  if (!plan || !plan.focusAreas) {
    return "<p>Training plan data not available.</p>";
  }

  let html = `
        <div style="margin-bottom: 20px;">
            <h3>Current Performance Level: ${(plan.currentLevel * 100).toFixed(1)}%</h3>
            <div style="background: var(--color-background); padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h4>Focus Areas</h4>
                <ul style="margin: 0; padding-left: 20px;">
    `;

  plan.focusAreas.forEach((area) => {
    if (typeof area === "string") {
      html += `<li>${area}</li>`;
    } else if (area.name) {
      html += `<li><strong>${area.name}</strong>: ${area.description || "Specialized training focus"}</li>`;
    }
  });

  html += `
                </ul>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="this.closest('.modal-overlay').remove()"
                        class="btn btn-primary"
                        style="padding: 12px 24px; border: none; border-radius: 6px; background: var(--color-primary); color: white; cursor: pointer;">
                    Start Training Plan
                </button>
            </div>
        </div>
    `;

  return html;
}
