/**
 * Training Page Renderers
 * Pure rendering functions that take data and return HTML strings or update DOM
 */

import { workoutService } from "../services/workoutService.js";

/**
 * Render user header with name
 */
export function renderUserHeader(user) {
  const userNameElement = document.getElementById("user-display-name-training");
  if (userNameElement && user) {
    if (user.nationality) {
      userNameElement.textContent = `${user.name} ${user.nationality}`;
      userNameElement.title = `Jersey #${user.jersey} - ${user.position}`;
    } else {
      userNameElement.textContent = user.name || "Alex";
    }
  }
}

/**
 * Render weekly progress stat card
 */
export function renderWeeklyProgress(stats) {
  if (!stats) {return;}

  const weeklyProgressValue = document.querySelector(".stat-value");
  if (weeklyProgressValue && weeklyProgressValue.textContent.includes("/")) {
    const currentProgress = Math.min(stats.sessionsCompleted, 7);
    const progressPercent = Math.round((currentProgress / 7) * 100);
    weeklyProgressValue.innerHTML = `${currentProgress}<span class="u-text-body-lg u-text-secondary">/7</span>`;

    // Update progress bar
    const statCard = weeklyProgressValue.closest(".stat-card");
    if (statCard) {
      const progressBar = statCard.querySelector(".u-height-full");
      if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
      }
    }
  }
}

/**
 * Render progress stats (hours, sessions, avg score)
 */
export function renderProgressStats(weeklyStats, overallStats) {
  const progressStats = document.querySelectorAll(".progress-stat-value");
  if (progressStats.length >= 3) {
    if (weeklyStats) {
      progressStats[0].textContent = Math.round(weeklyStats.hoursThisWeek);
    }
    if (overallStats) {
      progressStats[1].textContent = overallStats.totalSessions;
      progressStats[2].textContent = overallStats.avgScore;
    }
  }
}

/**
 * Render a single day card for the weekly schedule
 */
function renderDayCard(day, scheduleSettings) {
  const { date, dayName, isToday, isGameDay, isCompleted, plannedWorkout } =
    day;
  const workoutType = plannedWorkout.type;
  const workoutTitle = plannedWorkout.title;
  const workoutMeta = plannedWorkout.meta;
  const workoutClass = plannedWorkout.class;
  const isSkipped = plannedWorkout.isSkipped;

  const dayCard = document.createElement("div");
  dayCard.className = `day-card ${isToday ? "today" : ""} ${isCompleted ? "completed" : ""} ${isGameDay ? "game-day" : ""}`;
  dayCard.setAttribute("role", "listitem");
  dayCard.setAttribute("aria-label", `${dayName}, ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`);
  
  if (isToday) {
    dayCard.setAttribute("aria-current", "date");
  }

  const dateFormatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const statusLabel = isCompleted ? "Completed" : workoutType ? "Scheduled" : "No workout scheduled";
  
  dayCard.innerHTML = `
        <div class="day-header">
            <div>
                <div class="day-name u-font-weight-600 u-text-primary">${dayName}</div>
                <div class="day-date u-text-body-sm u-text-secondary">${dateFormatted}</div>
            </div>
            <span 
              class="day-status ${isCompleted ? "completed" : workoutType ? "scheduled" : ""}" 
              aria-label="${statusLabel}"
              role="status"
            ></span>
        </div>

        ${
          scheduleSettings?.preferences?.includeMobility
            ? `
        <div class="morning-routine" role="region" aria-label="Morning routine">
            <div class="morning-routine-label u-text-body-sm u-font-weight-600 u-text-primary">
                <i data-lucide="sunrise" class="icon-14 icon-inline" aria-hidden="true"></i>
                Morning Routine
            </div>
            <div class="morning-routine-content u-display-flex u-align-center u-gap-8">
                <div class="morning-routine-icon">
                    <i data-lucide="activity" class="icon-12 icon-inline" aria-hidden="true"></i>
                </div>
                <span class="u-text-body-sm u-text-secondary">15 min Mobility + Foam Rolling</span>
            </div>
        </div>
        `
            : ""
        }

        ${
          workoutTitle
            ? `
        <div class="day-workout ${workoutClass} ${isSkipped ? "skipped" : ""}" role="region" aria-label="Workout">
            <div class="day-workout-title u-font-weight-600 u-text-primary">${workoutTitle}</div>
            ${workoutMeta ? `<div class="day-workout-meta u-text-body-sm u-text-secondary">${workoutMeta}</div>` : ""}
        </div>
        `
            : ""
        }

        ${
          !isSkipped && workoutType
            ? `
        <div class="day-actions u-margin-top-12">
            <button 
              class="day-action-btn btn ${isCompleted ? "btn-secondary" : "btn-primary"} btn-sm" 
              onclick="startDayWorkout('${workoutType}', '${date.toISOString()}')"
              aria-label="${isCompleted ? "Workout completed" : `Start ${workoutTitle || workoutType} workout`}"
              ${isCompleted ? 'aria-pressed="true"' : ''}
            >
                ${isCompleted ? '<i data-lucide="check" class="icon-16 icon-inline" aria-hidden="true"></i> Completed' : '<i data-lucide="play" class="icon-16 icon-inline" aria-hidden="true"></i> Start'}
            </button>
        </div>
        `
            : ""
        }
    `;

  return dayCard;
}

/**
 * Render weekly schedule grid
 */
export function renderWeeklySchedule(
  weeklySchedule,
  scheduleSettings,
  viewMode = "detailed",
) {
  const scheduleGrid = document.getElementById("weekly-schedule-grid");
  if (!scheduleGrid) {return;}

  scheduleGrid.innerHTML = "";

  weeklySchedule.forEach((day) => {
    const dayCard = renderDayCard(day, scheduleSettings);
    scheduleGrid.appendChild(dayCard);
  });

  // Apply view mode classes
  const section = document.querySelector(".weekly-schedule-section");
  if (viewMode === "compact") {
    scheduleGrid.classList.add("compact");
    if (section) {section.classList.add("schedule-view-compact");}
  } else {
    scheduleGrid.classList.remove("compact");
    if (section) {section.classList.remove("schedule-view-compact");}
  }

  // Update toggle button text
  const toggle = document.getElementById("schedule-view-toggle");
  if (toggle) {
    toggle.textContent =
      viewMode === "detailed" ? "Compact View" : "Detailed View";
  }

  // Re-initialize icons for new elements
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

/**
 * Render workout cards section
 */
export function renderWorkoutCards() {
  const workoutsSection = document.querySelector(".workouts-section");
  if (!workoutsSection) {return;}

  // Workout cards are already in HTML, we just need to ensure they're properly initialized
  // This function can be extended to dynamically generate cards from templates if needed
  const workoutCards = workoutsSection.querySelectorAll(
    ".workout-card[data-workout-type]",
  );
  workoutCards.forEach((card) => {
    const workoutType = card.getAttribute("data-workout-type");
    if (workoutType && workoutService.isValidWorkoutType(workoutType)) {
      // Cards are already rendered in HTML, just ensure they're interactive
      // Event delegation is handled elsewhere
    }
  });
}

/**
 * Render achievements section
 */
export function renderAchievements(recentWorkouts) {
  // Achievements are currently static in HTML
  // This function can be extended to dynamically generate achievements based on workout data
  const achievementsSection = document.querySelector(".achievements-section");
  if (!achievementsSection) {}

  // Future: Generate achievements based on recentWorkouts data
  // For now, achievements remain static in HTML
}

/**
 * Render all page components
 */
export function renderPage(state) {
  if (state.user) {
    renderUserHeader(state.user);
  }

  if (state.weeklyStats) {
    renderWeeklyProgress(state.weeklyStats);
  }

  if (state.weeklyStats && state.overallStats) {
    renderProgressStats(state.weeklyStats, state.overallStats);
  }

  if (state.weeklySchedule.length > 0) {
    renderWeeklySchedule(
      state.weeklySchedule,
      state.scheduleSettings,
      state.ui.scheduleViewMode,
    );
  }

  renderWorkoutCards();

  if (state.recentWorkouts) {
    renderAchievements(state.recentWorkouts);
  }
}
