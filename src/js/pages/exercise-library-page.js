// Exercise Library Page - Optimized with pagination, debouncing, and DocumentFragment
import { debounce } from "../utils/shared.js";
import { logger } from "../../logger.js";
import { escapeHtml } from "../utils/sanitize.js";
import { errorHandler } from "../utils/unified-error-handler.js";

export class ExerciseLibraryPage {
  constructor() {
    this.currentPage = 0;
    this.itemsPerPage = 20;
    this.currentFilter = "all";
    this.searchTerm = "";
    this.allExercises = [];
    this.filteredExercises = [];
    this.eventListeners = new Map(); // Track listeners for cleanup
    this.abortController = new AbortController(); // For request cancellation
  }

  initialize() {
    this.setupSearchAndFilter();
    this.loadExerciseLibrary();
  }

  async loadExerciseLibrary() {
    try {
      // Dynamically import the large exercise library (non-blocking)
      // Add timeout to prevent hanging
      const importPromise = import("../../training-program-data.js");
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Import timeout after 10 seconds")),
          10000,
        );
      });

      const module = await Promise.race([importPromise, timeoutPromise]);
      const { EXERCISE_LIBRARY } = module;

      if (!EXERCISE_LIBRARY || typeof EXERCISE_LIBRARY !== "object") {
        throw new Error("Invalid exercise library data");
      }

      window.COMPLETE_EXERCISE_LIBRARY = EXERCISE_LIBRARY;
      this.allExercises = Object.entries(EXERCISE_LIBRARY);

      // Use setTimeout to yield to browser, preventing blocking
      setTimeout(() => {
        this.filterExercises();
        this.displayExercises();
        this.updateStats();
      }, 0);
    } catch (error) {
      logger.error("Failed to load exercise library:", error);
      this.showError(
        `Failed to load exercise library: ${error.message}. Please refresh the page.`,
      );
    }
  }

  setupSearchAndFilter() {
    const searchInput = document.getElementById("exerciseSearch");
    if (!searchInput) {
      return;
    }

    // Debounce search input (300ms delay)
    const debouncedSearch = debounce((e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.currentPage = 0; // Reset to first page on search
      this.filterExercises();
      this.displayExercises();
    }, 300);

    // Store listener for cleanup
    this.eventListeners.set("search", () => {
      searchInput.removeEventListener("input", debouncedSearch);
    });
    searchInput.addEventListener("input", debouncedSearch);

    // Filter tabs with event delegation
    const filterContainer = document.querySelector(".filter-tabs");
    if (filterContainer) {
      const handleFilterClick = (e) => {
        const tab = e.target.closest(".filter-tab");
        if (!tab) {
          return;
        }

        // Remove active class from all tabs
        filterContainer.querySelectorAll(".filter-tab").forEach((t) => {
          t.classList.remove("active");
        });

        // Add active class to clicked tab
        tab.classList.add("active");

        // Update filter
        this.currentFilter = tab.dataset.filter || "all";
        this.currentPage = 0; // Reset to first page
        this.filterExercises();
        this.displayExercises();
      };

      this.eventListeners.set("filter", () => {
        filterContainer.removeEventListener("click", handleFilterClick);
      });
      filterContainer.addEventListener("click", handleFilterClick);
    }

    // Pagination controls
    this.setupPagination();
  }

  setupPagination() {
    const exerciseGrid = document.getElementById("exerciseGrid");
    if (!exerciseGrid) {
      return;
    }

    // Create pagination container if it doesn't exist
    let paginationContainer = document.getElementById("exercisePagination");
    if (!paginationContainer) {
      paginationContainer = document.createElement("div");
      paginationContainer.id = "exercisePagination";
      paginationContainer.className = "pagination-container";
      exerciseGrid.parentNode.insertBefore(
        paginationContainer,
        exerciseGrid.nextSibling,
      );
    }

    this.updatePaginationControls();
  }

  updatePaginationControls() {
    const paginationContainer = document.getElementById("exercisePagination");
    if (!paginationContainer) {
      return;
    }

    const totalPages = Math.ceil(
      this.filteredExercises.length / this.itemsPerPage,
    );

    if (totalPages <= 1) {
      paginationContainer.textContent = '';
      return;
    }

    const prevDisabled = this.currentPage === 0 ? "disabled" : "";
    const nextDisabled = this.currentPage >= totalPages - 1 ? "disabled" : "";

    paginationContainer.innerHTML = `
      <div class="pagination-info">
        Showing ${this.currentPage * this.itemsPerPage + 1}-${Math.min(
          (this.currentPage + 1) * this.itemsPerPage,
          this.filteredExercises.length,
        )} of ${this.filteredExercises.length} exercises
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn" ${prevDisabled} data-action="prev" aria-label="Previous page">
          <i data-lucide="chevron-left"></i>
        </button>
        <span class="pagination-page-info">
          Page ${this.currentPage + 1} of ${totalPages}
        </span>
        <button class="pagination-btn" ${nextDisabled} data-action="next" aria-label="Next page">
          <i data-lucide="chevron-right"></i>
        </button>
      </div>
    `;

    // Add event listeners for pagination buttons
    const handlePaginationClick = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn || btn.hasAttribute("disabled")) {
        return;
      }

      const exerciseGrid = document.getElementById("exerciseGrid");
      if (!exerciseGrid) {
        return;
      }

      const action = btn.dataset.action;
      if (action === "prev" && this.currentPage > 0) {
        this.currentPage--;
        this.displayExercises();
        this.updatePaginationControls();
        exerciseGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (action === "next" && this.currentPage < totalPages - 1) {
        this.currentPage++;
        this.displayExercises();
        this.updatePaginationControls();
        exerciseGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    this.eventListeners.set("pagination", () => {
      paginationContainer.removeEventListener("click", handlePaginationClick);
    });
    paginationContainer.addEventListener("click", handlePaginationClick);

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(paginationContainer);
    }
  }

  filterExercises() {
    this.filteredExercises = this.allExercises.filter(([name, exercise]) => {
      // Apply category filter
      const categoryMatch =
        this.currentFilter === "all" ||
        exercise.category === this.currentFilter;

      // Apply search filter
      const searchMatch =
        !this.searchTerm ||
        name.toLowerCase().includes(this.searchTerm) ||
        exercise.category.toLowerCase().includes(this.searchTerm) ||
        exercise.primaryMuscles?.some((muscle) =>
          muscle.toLowerCase().includes(this.searchTerm),
        ) ||
        exercise.equipment?.some((equip) =>
          equip.toLowerCase().includes(this.searchTerm),
        );

      return categoryMatch && searchMatch;
    });
  }

  displayExercises() {
    const exerciseGrid = document.getElementById("exerciseGrid");
    if (!exerciseGrid) {
      return;
    }

    const library = window.COMPLETE_EXERCISE_LIBRARY || {};
    if (!library || Object.keys(library).length === 0) {
      this.showLoading();
      return;
    }

    if (this.filteredExercises.length === 0) {
      this.showNoResults();
      return;
    }

    // Calculate pagination slice
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const paginatedExercises = this.filteredExercises.slice(start, end);

    // Use DocumentFragment for batch DOM operations
    const fragment = document.createDocumentFragment();

    paginatedExercises.forEach(([name, exercise]) => {
      const card = this.createExerciseCard(name, exercise);
      fragment.appendChild(card);
    });

    // Single DOM update - clear and append fragment
    exerciseGrid.textContent = '';
    exerciseGrid.appendChild(fragment);

    // Initialize Lucide icons for new cards
    if (typeof lucide !== "undefined") {
      lucide.createIcons(exerciseGrid);
    }
  }

  createExerciseCard(name, exercise) {
    // Add defensive checks
    if (!exercise || !name) {
      logger.warn("Invalid exercise data:", { name, exercise });
      return document.createTextNode(""); // Return empty node instead of crashing
    }

    const card = document.createElement("div");
    card.className = "exercise-card hover-lift";
    card.onclick = () => this.openExerciseModal(name);

    const icon = this.getExerciseIcon(exercise.category);
    const primaryMuscles = (exercise.primaryMuscles || [])
      .map(
        (muscle) =>
          `<span class="muscle-tag primary">${this.escapeHtml(muscle)}</span>`,
      )
      .join("");
    const secondaryMuscles = (exercise.secondaryMuscles || [])
      .map(
        (muscle) =>
          `<span class="muscle-tag">${this.escapeHtml(muscle)}</span>`,
      )
      .join("");
    const equipment = (exercise.equipment || []).slice(0, 2).join(", ");
    const equipmentMore = (exercise.equipment || []).length > 2 ? "..." : "";

    card.innerHTML = `
      <div class="exercise-video">${icon}</div>
      <div class="exercise-content">
        <div class="exercise-header">
          <div class="exercise-category">${exercise.category || ""}</div>
          <h3 class="exercise-title">${this.escapeHtml(name)}</h3>
        </div>
        <div class="muscle-tags">
          ${primaryMuscles}
          ${secondaryMuscles}
        </div>
        <p class="exercise-description">${this.escapeHtml(exercise.setup || "")}</p>
        <div class="exercise-meta">
          <span class="difficulty-badge difficulty-${exercise.difficulty || "intermediate"}">
            ${
              (exercise.difficulty || "intermediate").charAt(0).toUpperCase() +
              (exercise.difficulty || "intermediate").slice(1)
            }
          </span>
          <div class="equipment-list">${equipment}${equipmentMore}</div>
        </div>
      </div>
    `;

    return card;
  }

  getExerciseIcon(category) {
    const icons = {
      "Posterior Chain": "🦵",
      Plyometric:
        '<i data-lucide="zap" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i>',
      Sprint: "🏃‍♂️",
      Strength:
        '<i data-lucide="dumbbell" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i>',
      Core: '<i data-lucide="target" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i>',
      Recovery: "🧘",
      Agility:
        '<i data-lucide="activity" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i>',
    };
    return icons[category] || "🏋️‍♂️";
  }

  updateStats() {
    const library = window.COMPLETE_EXERCISE_LIBRARY || {};
    if (!library || Object.keys(library).length === 0) {
      return;
    }

    const exercises = Object.entries(library);
    const categories = [...new Set(exercises.map(([_, ex]) => ex.category))];
    const totalProgressions = exercises.reduce(
      (total, [_, ex]) => total + (ex.progressions?.length || 0),
      0,
    );
    const totalSafetyNotes = exercises.reduce(
      (total, [_, ex]) => total + (ex.safetyNotes?.length || 0),
      0,
    );

    const totalExercisesEl = document.getElementById("totalExercises");
    const categoriesCountEl = document.getElementById("categoriesCount");
    const progressionsCountEl = document.getElementById("progressionsCount");
    const safetyNotesCountEl = document.getElementById("safetyNotesCount");

    if (totalExercisesEl) {
      totalExercisesEl.textContent = exercises.length;
    }
    if (categoriesCountEl) {
      categoriesCountEl.textContent = categories.length;
    }
    if (progressionsCountEl) {
      progressionsCountEl.textContent = totalProgressions;
    }
    if (safetyNotesCountEl) {
      safetyNotesCountEl.textContent = totalSafetyNotes;
    }
  }

  showLoading() {
    const exerciseGrid = document.getElementById("exerciseGrid");
    if (!exerciseGrid) {
      return;
    }
    exerciseGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-12);">
        <div style="font-size: 2rem; margin-bottom: var(--space-4);">⏳</div>
        <h3>Loading exercises...</h3>
      </div>
    `;
  }

  showNoResults() {
    const exerciseGrid = document.getElementById("exerciseGrid");
    if (!exerciseGrid) {
      return;
    }
    exerciseGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-12); color: var(--color-text-secondary);">
        <div style="font-size: 3rem; margin-bottom: var(--space-4);">
          <i data-lucide="search" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i>
        </div>
        <h3>No exercises found</h3>
        <p>Try adjusting your search terms or filters</p>
      </div>
    `;
    if (typeof lucide !== "undefined") {
      lucide.createIcons(exerciseGrid);
    }
  }

  showError(message) {
    const exerciseGrid = document.getElementById("exerciseGrid");
    if (!exerciseGrid) {
      return;
    }
    exerciseGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-12); color: var(--color-error);">
        <div style="font-size: 2rem; margin-bottom: var(--space-4);">❌</div>
        <h3>${this.escapeHtml(message)}</h3>
        <p>Please refresh the page or try again later</p>
      </div>
    `;
  }

  openExerciseModal(name) {
    const library = window.COMPLETE_EXERCISE_LIBRARY || {};
    const exercise = library[name];
    if (!exercise) {
      return;
    }

    const modal = document.getElementById("exerciseModal");
    const modalTitle = document.getElementById("modalExerciseTitle");
    const modalCategory = document.getElementById("modalExerciseCategory");
    const modalBody = document.getElementById("modalBody");

    if (!modal || !modalTitle || !modalCategory || !modalBody) {
      return;
    }

    modalTitle.textContent = name;
    // SECURITY: Sanitize exercise category to prevent XSS
    const safeCategory = escapeHtml(exercise.category || "");
    modalCategory.innerHTML = `<span class="exercise-category">${safeCategory}</span>`;

    // Use DocumentFragment for modal content
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement("div");

    tempDiv.innerHTML = `
      <div class="exercise-video" style="margin-bottom: var(--space-6);">
        ${this.getExerciseIcon(exercise.category)}
        <div style="position: absolute; bottom: var(--space-2); right: var(--space-2); background: rgba(0,0,0,0.7); color: var(--color-text-primary); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); font-size: var(--text-xs);">
          Video Coming Soon
        </div>
      </div>
      <div style="margin-bottom: var(--space-6);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          <div>
            <h4 style="margin-bottom: var(--space-2);">Primary Muscles</h4>
            <div class="muscle-tags">
              ${(exercise.primaryMuscles || []).map((m) => `<span class="muscle-tag primary">${this.escapeHtml(m)}</span>`).join("")}
            </div>
          </div>
          <div>
            <h4 style="margin-bottom: var(--space-2);">Equipment Needed</h4>
            <ul style="list-style: none; padding: 0;">
              ${(exercise.equipment || []).map((item) => `<li>• ${this.escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
      <div class="instruction-section">
        <h3 class="instruction-title"><i data-lucide="target"></i> Setup</h3>
        <p>${this.escapeHtml(exercise.setup || "")}</p>
      </div>
      <div class="instruction-section">
        <h3 class="instruction-title"><i data-lucide="zap"></i> Execution</h3>
        <ol class="instruction-list">
          ${(exercise.execution || []).map((step) => `<li>${this.escapeHtml(step)}</li>`).join("")}
        </ol>
      </div>
      ${
        exercise.progressions
          ? `
        <div class="instruction-section">
          <h3 class="instruction-title"><i data-lucide="bar-chart-3"></i> Progressions</h3>
          <div class="progressions-grid">
            ${exercise.progressions
              .map(
                (progression, index) => `
              <div class="progression-card">
                <div class="progression-level">Level ${index + 1}</div>
                <div>${this.escapeHtml(progression)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }
      ${
        exercise.safetyNotes
          ? `
        <div class="safety-notes">
          <div class="safety-title">
            <span>⚠️</span>
            <span>Safety Notes</span>
          </div>
          <ul style="margin: 0; padding-left: var(--space-4);">
            ${exercise.safetyNotes.map((note) => `<li>${this.escapeHtml(note)}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
    `;

    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }

    modalBody.textContent = '';
    modalBody.appendChild(fragment);

    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(modal);
    }
  }

  escapeHtml(text) {
    if (!text) {
      return "";
    }
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Cleanup method for proper memory management
  cleanup() {
    // Cancel any pending requests
    this.abortController.abort();

    // Remove all event listeners
    this.eventListeners.forEach((cleanup) => cleanup());
    this.eventListeners.clear();

    // Clear references
    this.allExercises = [];
    this.filteredExercises = [];
  }
}

// Export singleton instance
export const exerciseLibraryPage = new ExerciseLibraryPage();

// Expose openExerciseModal globally for onclick handlers
window.openExerciseModal = (name) =>
  exerciseLibraryPage.openExerciseModal(name);
