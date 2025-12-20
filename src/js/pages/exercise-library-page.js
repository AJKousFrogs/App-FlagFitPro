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
    if (!searchInput) {return;}

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
        if (!tab) {return;}

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
    if (!exerciseGrid) {return;}

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
    if (!paginationContainer) {return;}

    const totalPages = Math.ceil(
      this.filteredExercises.length / this.itemsPerPage,
    );

    if (totalPages <= 1) {
      paginationContainer.textContent = "";
      return;
    }

    const prevDisabled = this.currentPage === 0;
    const nextDisabled = this.currentPage >= totalPages - 1;

    paginationContainer.textContent = "";
    
    const info = document.createElement("div");
    info.className = "pagination-info";
    const start = this.currentPage * this.itemsPerPage + 1;
    const end = Math.min((this.currentPage + 1) * this.itemsPerPage, this.filteredExercises.length);
    info.textContent = `Showing ${start}-${end} of ${this.filteredExercises.length} exercises`;
    
    const controls = document.createElement("div");
    controls.className = "pagination-controls";
    
    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    if (prevDisabled) prevBtn.disabled = true;
    prevBtn.setAttribute("data-action", "prev");
    prevBtn.setAttribute("aria-label", "Previous page");
    const prevIcon = document.createElement("i");
    prevIcon.setAttribute("data-lucide", "chevron-left");
    prevBtn.appendChild(prevIcon);
    
    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-page-info";
    pageInfo.textContent = `Page ${this.currentPage + 1} of ${totalPages}`;
    
    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    if (nextDisabled) nextBtn.disabled = true;
    nextBtn.setAttribute("data-action", "next");
    nextBtn.setAttribute("aria-label", "Next page");
    const nextIcon = document.createElement("i");
    nextIcon.setAttribute("data-lucide", "chevron-right");
    nextBtn.appendChild(nextIcon);
    
    controls.appendChild(prevBtn);
    controls.appendChild(pageInfo);
    controls.appendChild(nextBtn);
    
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(controls);
    
    if (typeof lucide !== "undefined") {
      lucide.createIcons(paginationContainer);
    }

    // Add event listeners for pagination buttons
    const handlePaginationClick = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn || btn.hasAttribute("disabled")) {return;}

      const exerciseGrid = document.getElementById("exerciseGrid");
      if (!exerciseGrid) {return;}

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
    if (!exerciseGrid) {return;}

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
    exerciseGrid.textContent = "";
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

    // Create video div with icon
    const videoDiv = document.createElement("div");
    videoDiv.className = "exercise-video";
    // getExerciseIcon returns HTML string, use temp container
    const iconTemp = document.createElement("div");
    iconTemp.innerHTML = this.getExerciseIcon(exercise.category);
    while (iconTemp.firstChild) {
      videoDiv.appendChild(iconTemp.firstChild);
    }
    
    const content = document.createElement("div");
    content.className = "exercise-content";
    
    const header = document.createElement("div");
    header.className = "exercise-header";
    const category = document.createElement("div");
    category.className = "exercise-category";
    category.textContent = exercise.category || "";
    const title = document.createElement("h3");
    title.className = "exercise-title";
    title.textContent = name;
    header.appendChild(category);
    header.appendChild(title);
    
    const muscleTags = document.createElement("div");
    muscleTags.className = "muscle-tags";
    (exercise.primaryMuscles || []).forEach(muscle => {
      const tag = document.createElement("span");
      tag.className = "muscle-tag primary";
      tag.textContent = muscle;
      muscleTags.appendChild(tag);
    });
    (exercise.secondaryMuscles || []).forEach(muscle => {
      const tag = document.createElement("span");
      tag.className = "muscle-tag";
      tag.textContent = muscle;
      muscleTags.appendChild(tag);
    });
    
    const description = document.createElement("p");
    description.className = "exercise-description";
    description.textContent = exercise.setup || "";
    
    const meta = document.createElement("div");
    meta.className = "exercise-meta";
    const difficulty = document.createElement("span");
    const difficultyLevel = exercise.difficulty || "intermediate";
    difficulty.className = `difficulty-badge difficulty-${difficultyLevel}`;
    difficulty.textContent = difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1);
    const equipmentList = document.createElement("div");
    equipmentList.className = "equipment-list";
    const equipment = (exercise.equipment || []).slice(0, 2).join(", ");
    const equipmentMore = (exercise.equipment || []).length > 2 ? "..." : "";
    equipmentList.textContent = equipment + equipmentMore;
    meta.appendChild(difficulty);
    meta.appendChild(equipmentList);
    
    content.appendChild(header);
    content.appendChild(muscleTags);
    content.appendChild(description);
    content.appendChild(meta);
    
    card.appendChild(videoDiv);
    card.appendChild(content);

    return card;
  }

  getExerciseIcon(category) {
    const iconStyle = 'width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--icon-color-primary); stroke: var(--icon-color-primary);';
    const icons = {
      "Posterior Chain": '<i data-lucide="leg" style="' + iconStyle + '"></i>',
      Plyometric: '<i data-lucide="zap" style="' + iconStyle + '"></i>',
      Sprint: '<i data-lucide="running" style="' + iconStyle + '"></i>',
      Strength: '<i data-lucide="dumbbell" style="' + iconStyle + '"></i>',
      Core: '<i data-lucide="target" style="' + iconStyle + '"></i>',
      Recovery: '<i data-lucide="heart" style="' + iconStyle + '"></i>',
      Agility: '<i data-lucide="activity" style="' + iconStyle + '"></i>',
    };
    return icons[category] || '<i data-lucide="dumbbell" style="' + iconStyle + '"></i>';
  }

  updateStats() {
    const library = window.COMPLETE_EXERCISE_LIBRARY || {};
    if (!library || Object.keys(library).length === 0) {return;}

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

    if (totalExercisesEl) {totalExercisesEl.textContent = exercises.length;}
    if (categoriesCountEl) {categoriesCountEl.textContent = categories.length;}
    if (progressionsCountEl) {progressionsCountEl.textContent = totalProgressions;}
    if (safetyNotesCountEl) {safetyNotesCountEl.textContent = totalSafetyNotes;}
  }

  showLoading() {
    const exerciseGrid = document.getElementById("exerciseGrid");
    if (!exerciseGrid) {return;}
    exerciseGrid.textContent = "";
    const loadingDiv = document.createElement("div");
    loadingDiv.style.cssText = "grid-column: 1 / -1; text-align: center; padding: var(--space-12);";
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "loader-2");
    icon.style.cssText = "width: 48px; height: 48px; display: inline-block; margin-bottom: var(--space-4); color: var(--icon-color-primary);";
    icon.classList.add("icon-spin");
    const h3 = document.createElement("h3");
    h3.textContent = "Loading exercises...";
    loadingDiv.appendChild(icon);
    loadingDiv.appendChild(h3);
    exerciseGrid.appendChild(loadingDiv);
    if (typeof lucide !== "undefined") {
      lucide.createIcons(exerciseGrid);
    }
  }

  showNoResults() {
    const exerciseGrid = document.getElementById("exerciseGrid");
    if (!exerciseGrid) {return;}
    exerciseGrid.textContent = "";
    const noResultsDiv = document.createElement("div");
    noResultsDiv.style.cssText = "grid-column: 1 / -1; text-align: center; padding: var(--space-12); color: var(--color-text-secondary);";
    const iconDiv = document.createElement("div");
    iconDiv.style.cssText = "font-size: 3rem; margin-bottom: var(--space-4);";
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "search");
    icon.style.cssText = "width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--icon-color-primary); stroke: var(--icon-color-primary);";
    iconDiv.appendChild(icon);
    const h3 = document.createElement("h3");
    h3.textContent = "No exercises found";
    const p = document.createElement("p");
    p.textContent = "Try adjusting your search terms or filters";
    noResultsDiv.appendChild(iconDiv);
    noResultsDiv.appendChild(h3);
    noResultsDiv.appendChild(p);
    exerciseGrid.appendChild(noResultsDiv);
    if (typeof lucide !== "undefined") {
      lucide.createIcons(exerciseGrid);
    }
  }

  showError(message) {
    const exerciseGrid = document.getElementById("exerciseGrid");
    if (!exerciseGrid) {return;}
    exerciseGrid.textContent = "";
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = "grid-column: 1 / -1; text-align: center; padding: var(--space-12); color: var(--color-error);";
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "x-circle");
    icon.style.cssText = "width: 48px; height: 48px; display: inline-block; margin-bottom: var(--space-4); color: var(--color-error);";
    const h3 = document.createElement("h3");
    h3.textContent = message;
    const p = document.createElement("p");
    p.textContent = "Please refresh the page or try again later";
    errorDiv.appendChild(icon);
    errorDiv.appendChild(h3);
    errorDiv.appendChild(p);
    exerciseGrid.appendChild(errorDiv);
    if (typeof lucide !== "undefined") {
      lucide.createIcons(exerciseGrid);
    }
  }

  openExerciseModal(name) {
    const library = window.COMPLETE_EXERCISE_LIBRARY || {};
    const exercise = library[name];
    if (!exercise) {return;}

    const modal = document.getElementById("exerciseModal");
    const modalTitle = document.getElementById("modalExerciseTitle");
    const modalCategory = document.getElementById("modalExerciseCategory");
    const modalBody = document.getElementById("modalBody");

    if (!modal || !modalTitle || !modalCategory || !modalBody) {return;}

    modalTitle.textContent = name;
    // SECURITY: Sanitize exercise category to prevent XSS
    modalCategory.textContent = "";
    const categorySpan = document.createElement("span");
    categorySpan.className = "exercise-category";
    categorySpan.textContent = exercise.category || "";
    modalCategory.appendChild(categorySpan);

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
            <i data-lucide="alert-triangle" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px; color: var(--color-warning);"></i>
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

    modalBody.textContent = "";
    modalBody.appendChild(fragment);

    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(modal);
    }
  }

  escapeHtml(text) {
    if (!text) {return "";}
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
