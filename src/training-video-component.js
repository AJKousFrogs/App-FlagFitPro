// Training Video Component
// Displays YouTube training videos integrated with training sessions

import { youTubeTrainingService } from "./youtube-training-service.js";
import { ComponentWithCleanup } from "./event-cleanup-utils.js";
import { logger } from "./logger.js";

class TrainingVideoComponent extends ComponentWithCleanup {
  constructor(containerId) {
    super(); // Initialize cleanup management
    this.container = document.getElementById(containerId);
    this.currentCategory = null;
    this.currentVideos = [];
    this.selectedVideo = null;
    this.init();
  }

  init() {
    if (!this.container) {
      logger.error("Training video container not found");
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
            <div class="training-video-component">
                <div class="video-header">
                    <h3 class="video-title">Training Videos</h3>
                    <div class="video-controls">
                        <select id="video-category-select" class="category-select">
                            <option value="">Select Training Type</option>
                            <option value="warm-up">🔥 Warm-up & Activation</option>
                            <option value="sprint-drills">⚡ Sprint Technique</option>
                            <option value="agility">🏃 Agility & Change of Direction</option>
                            <option value="plyometrics">💪 Power & Plyometrics</option>
                            <option value="flag-specific">🏈 Flag Football Specific</option>
                            <option value="cool-down">😌 Cool-down & Recovery</option>
                        </select>
                        <button id="search-custom-btn" class="btn btn-secondary">
                            🔍 Search Exercise
                        </button>
                    </div>
                </div>

                <div class="video-content">
                    <div class="video-player-section">
                        <div id="video-player" class="video-player">
                            <div class="video-placeholder">
                                <div class="placeholder-content">
                                    <span class="placeholder-icon">📺</span>
                                    <h4>Select a training video</h4>
                                    <p>Choose a category to browse warm-up drills, sprint techniques, and more</p>
                                </div>
                            </div>
                        </div>
                        <div id="video-info" class="video-info hidden">
                            <h4 id="current-video-title"></h4>
                            <p id="current-video-description"></p>
                            <div class="video-meta">
                                <span id="video-channel"></span>
                                <span id="video-duration"></span>
                                <a id="video-youtube-link" target="_blank" class="youtube-link">
                                    📺 Watch on YouTube
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="video-grid-section">
                        <div id="video-loading" class="video-loading hidden">
                            <div class="loading-spinner"></div>
                            <p>Finding the best training videos...</p>
                        </div>

                        <div id="video-grid" class="video-grid">
                            <!-- Video thumbnails will be populated here -->
                        </div>

                        <div id="video-error" class="video-error hidden">
                            <div class="error-content">
                                <span class="error-icon">⚠️</span>
                                <h4>Unable to load videos</h4>
                                <p>Please check your internet connection or try again later</p>
                                <button id="retry-btn" class="btn btn-primary">Try Again</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="training-playlists">
                    <h4>Quick Training Sessions</h4>
                    <div class="playlist-buttons">
                        <button class="playlist-btn" data-playlist="speed-focused">
                            ⚡ Speed Focus (30 min)
                        </button>
                        <button class="playlist-btn" data-playlist="agility-focused">
                            🏃 Agility Focus (35 min)
                        </button>
                        <button class="playlist-btn" data-playlist="complete">
                            🎯 Complete Session (60 min)
                        </button>
                        <button class="playlist-btn" data-playlist="recovery">
                            😌 Recovery Session (20 min)
                        </button>
                    </div>
                </div>
            </div>

            <style>
                .training-video-component {
                    background: var(--white);
                    border-radius: var(--radius-xl);
                    padding: var(--space-6);
                    border: 1px solid var(--border-light);
                    box-shadow: var(--shadow-sm);
                }

                .video-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--space-6);
                    flex-wrap: wrap;
                    gap: var(--space-4);
                }

                .video-title {
                    font-size: var(--text-xl);
                    font-weight: var(--font-bold);
                    color: var(--gray-900);
                    margin: 0;
                }

                .video-controls {
                    display: flex;
                    gap: var(--space-3);
                    align-items: center;
                }

                .category-select {
                    padding: var(--space-2) var(--space-3);
                    border: 1px solid var(--color-border-primary);
                    border-radius: var(--radius-md);
                    background: var(--white);
                    font-size: var(--text-sm);
                    min-width: 200px;
                }

                .video-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--space-6);
                    margin-bottom: var(--space-6);
                }

                .video-player {
                    aspect-ratio: 16/9;
                    background: var(--gray-100);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    position: relative;
                }

                .video-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                }

                .placeholder-content {
                    color: var(--gray-500);
                }

                .placeholder-icon {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: var(--space-3);
                }

                .placeholder-content h4 {
                    margin: 0 0 var(--space-2) 0;
                    color: var(--gray-700);
                }

                .placeholder-content p {
                    margin: 0;
                    font-size: var(--text-sm);
                }

                .video-info {
                    margin-top: var(--space-4);
                    padding-top: var(--space-4);
                    border-top: 1px solid var(--border-light);
                }

                .video-info h4 {
                    margin: 0 0 var(--space-2) 0;
                    color: var(--gray-900);
                    font-size: var(--text-lg);
                }

                .video-info p {
                    margin: 0 0 var(--space-3) 0;
                    color: var(--gray-600);
                    font-size: var(--text-sm);
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .video-meta {
                    display: flex;
                    gap: var(--space-4);
                    align-items: center;
                    font-size: var(--text-xs);
                    color: var(--gray-500);
                    flex-wrap: wrap;
                }

                .youtube-link {
                    color: var(--primary);
                    text-decoration: none;
                    font-weight: var(--font-medium);
                }

                .youtube-link:hover {
                    text-decoration: underline;
                }

                .video-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: var(--space-8);
                    text-align: center;
                    color: var(--gray-500);
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--gray-200);
                    border-top: 4px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: var(--space-3);
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .video-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--space-4);
                    max-height: 600px;
                    overflow-y: auto;
                }

                .video-card {
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    background: var(--white);
                }

                .video-card:hover {
                    border-color: var(--primary);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }

                .video-card.selected {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
                }

                .video-thumbnail {
                    width: 100%;
                    aspect-ratio: 16/9;
                    object-fit: cover;
                    background: var(--gray-100);
                }

                .video-card-content {
                    padding: var(--space-3);
                }

                .video-card-title {
                    font-size: var(--text-sm);
                    font-weight: var(--font-medium);
                    color: var(--gray-900);
                    margin: 0 0 var(--space-1) 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.3;
                }

                .video-card-channel {
                    font-size: var(--text-xs);
                    color: var(--gray-500);
                    margin: 0;
                }

                .video-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: var(--space-8);
                    text-align: center;
                    color: var(--gray-500);
                }

                .error-icon {
                    font-size: 3rem;
                    margin-bottom: var(--space-3);
                    color: var(--error);
                }

                .error-content h4 {
                    margin: 0 0 var(--space-2) 0;
                    color: var(--gray-700);
                }

                .error-content p {
                    margin: 0 0 var(--space-4) 0;
                    font-size: var(--text-sm);
                }

                .training-playlists {
                    border-top: 1px solid var(--border-light);
                    padding-top: var(--space-4);
                }

                .training-playlists h4 {
                    margin: 0 0 var(--space-3) 0;
                    color: var(--gray-900);
                    font-size: var(--text-lg);
                }

                .playlist-buttons {
                    display: flex;
                    gap: var(--space-3);
                    flex-wrap: wrap;
                }

                .playlist-btn {
                    padding: var(--space-2) var(--space-4);
                    border: 1px solid var(--color-border-primary);
                    border-radius: var(--radius-md);
                    background: var(--white);
                    color: var(--gray-700);
                    font-size: var(--text-sm);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }

                .playlist-btn:hover {
                    border-color: var(--primary);
                    background: var(--primary);
                    color: var(--white);
                }

                .hidden {
                    display: none !important;
                }

                @media (max-width: 768px) {
                    .video-content {
                        grid-template-columns: 1fr;
                    }

                    .video-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .video-controls {
                        flex-direction: column;
                    }

                    .category-select {
                        min-width: auto;
                    }

                    .playlist-buttons {
                        flex-direction: column;
                    }
                }
            </style>
        `;
  }

  attachEventListeners() {
    // Category selection
    const categorySelect = document.getElementById("video-category-select");
    if (categorySelect) {
      this.addEventListener(categorySelect, "change", (e) => {
        if (e.target.value) {
          this.loadVideoCategory(e.target.value);
        } else {
          this.clearVideoGrid();
        }
      });
    }

    // Custom search
    const searchBtn = document.getElementById("search-custom-btn");
    if (searchBtn) {
      this.addEventListener(searchBtn, "click", () => {
        this.showCustomSearchModal();
      });
    }

    // Playlist buttons
    const playlistBtns = document.querySelectorAll(".playlist-btn");
    playlistBtns.forEach((btn) => {
      this.addEventListener(btn, "click", (e) => {
        const playlistType = e.target.dataset.playlist;
        this.loadTrainingPlaylist(playlistType);
      });
    });

    // Retry button
    const retryBtn = document.getElementById("retry-btn");
    if (retryBtn) {
      this.addEventListener(retryBtn, "click", () => {
        if (this.currentCategory) {
          this.loadVideoCategory(this.currentCategory);
        }
      });
    }
  }

  async loadVideoCategory(category) {
    this.currentCategory = category;
    this.showLoading();

    try {
      logger.debug(`📺 Loading ${category} videos...`);
      const videos = await youTubeTrainingService.getTrainingVideos(
        category,
        12,
      );
      this.currentVideos = videos;
      this.renderVideoGrid(videos);
      this.hideLoading();
    } catch (error) {
      logger.error("Error loading videos:", error);
      this.showError();
    }
  }

  async loadTrainingPlaylist(playlistType) {
    this.showLoading();

    try {
      logger.debug(`📺 Loading ${playlistType} playlist...`);
      const playlist =
        await youTubeTrainingService.getTrainingPlaylist(playlistType);
      this.renderPlaylist(playlist);
      this.hideLoading();
    } catch (error) {
      logger.error("Error loading playlist:", error);
      this.showError();
    }
  }

  renderVideoGrid(videos) {
    const videoGrid = document.getElementById("video-grid");

    if (videos.length === 0) {
      videoGrid.innerHTML = `
                <div class="no-videos">
                    <span style="font-size: 2rem;">📺</span>
                    <p>No videos found for this category</p>
                </div>
            `;
      return;
    }

    videoGrid.innerHTML = videos
      .map(
        (video) => `
            <div class="video-card" data-video-id="${video.id}">
                <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"320\" height=\"180\" viewBox=\"0 0 320 180\"><rect width=\"320\" height=\"180\" fill=\"%23f3f4f6\"/><text x=\"160\" y=\"90\" text-anchor=\"middle\" dy=\".3em\" fill=\"%236b7280\">📺</text></svg>'">
                <div class="video-card-content">
                    <h5 class="video-card-title">${video.title}</h5>
                    <p class="video-card-channel">${video.channelTitle}</p>
                </div>
            </div>
        `,
      )
      .join("");

    // Add click handlers to video cards
    videoGrid.querySelectorAll(".video-card").forEach((card) => {
      card.addEventListener("click", () => {
        const videoId = card.dataset.videoId;
        const video = videos.find((v) => v.id === videoId);
        if (video) {
          this.selectVideo(video);
        }
      });
    });
  }

  renderPlaylist(playlist) {
    const videoGrid = document.getElementById("video-grid");

    let playlistHTML = "";
    playlist.forEach((section) => {
      playlistHTML += `
                <div class="playlist-section">
                    <h5 class="playlist-section-title">${section.categoryName}</h5>
                    <div class="playlist-videos">
                        ${section.videos
                          .map(
                            (video) => `
                            <div class="video-card playlist-video" data-video-id="${video.id}">
                                <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                                <div class="video-card-content">
                                    <h6 class="video-card-title">${video.title}</h6>
                                    <p class="video-card-channel">${video.channelTitle}</p>
                                </div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            `;
    });

    videoGrid.innerHTML = playlistHTML;

    // Add click handlers
    videoGrid.querySelectorAll(".video-card").forEach((card) => {
      card.addEventListener("click", () => {
        const videoId = card.dataset.videoId;
        let video = null;
        playlist.forEach((section) => {
          const found = section.videos.find((v) => v.id === videoId);
          if (found) video = found;
        });
        if (video) {
          this.selectVideo(video);
        }
      });
    });
  }

  selectVideo(video) {
    // Remove previous selection
    document.querySelectorAll(".video-card").forEach((card) => {
      card.classList.remove("selected");
    });

    // Select current video
    document
      .querySelector(`[data-video-id="${video.id}"]`)
      ?.classList.add("selected");

    this.selectedVideo = video;
    this.renderVideoPlayer(video);
  }

  renderVideoPlayer(video) {
    const videoPlayer = document.getElementById("video-player");
    const videoInfo = document.getElementById("video-info");

    if (video.fallback) {
      // Show placeholder for fallback videos
      videoPlayer.innerHTML = `
                <div class="video-placeholder">
                    <div class="placeholder-content">
                        <span class="placeholder-icon">📺</span>
                        <h4>${video.title}</h4>
                        <p>This is a demo video. Configure YouTube API for real videos.</p>
                        <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}"
                           target="_blank" class="btn btn-primary">Search on YouTube</a>
                    </div>
                </div>
            `;
    } else {
      // Embed real video
      videoPlayer.innerHTML = `
                <iframe
                    src="${video.embedUrl}?autoplay=0&rel=0&modestbranding=1"
                    frameborder="0"
                    allowfullscreen
                    style="width: 100%; height: 100%;">
                </iframe>
            `;
    }

    // Update video info
    document.getElementById("current-video-title").textContent = video.title;
    document.getElementById("current-video-description").textContent =
      video.description.length > 200
        ? video.description.substring(0, 200) + "..."
        : video.description;
    document.getElementById("video-channel").textContent = video.channelTitle;
    document.getElementById("video-duration").textContent =
      video.duration || "";

    const youtubeLink = document.getElementById("video-youtube-link");
    youtubeLink.href = video.url;

    videoInfo.classList.remove("hidden");
  }

  showCustomSearchModal() {
    const modal = document.createElement("div");
    modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        `;

    modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px;">
                <h3 style="margin-bottom: 1rem;">Search Training Exercise</h3>
                <form id="exercise-search-form">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                            Search for specific exercise or technique:
                        </label>
                        <input type="text" id="exercise-search" placeholder="e.g., A skips, B skips, sprint starts"
                               style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" onclick="this.closest('div[style*=\"position: fixed\"]').remove()"
                                style="background: #f3f4f6; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                            Cancel
                        </button>
                        <button type="submit" style="background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                            Search
                        </button>
                    </div>
                </form>
            </div>
        `;

    modal
      .querySelector("#exercise-search-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const searchTerm = document
          .getElementById("exercise-search")
          .value.trim();
        if (searchTerm) {
          modal.remove();
          await this.searchCustomExercise(searchTerm);
        }
      });

    document.body.appendChild(modal);
    document.getElementById("exercise-search").focus();
  }

  async searchCustomExercise(searchTerm) {
    this.showLoading();

    try {
      logger.debug(`📺 Searching for: ${searchTerm}`);
      const videos = await youTubeTrainingService.searchSpecificExercise(
        searchTerm,
        8,
      );
      this.currentVideos = videos;
      this.renderVideoGrid(videos);
      this.hideLoading();

      // Update category select to show custom search
      const categorySelect = document.getElementById("video-category-select");
      categorySelect.value = "";
    } catch (error) {
      logger.error("Error searching exercise:", error);
      this.showError();
    }
  }

  showLoading() {
    document.getElementById("video-loading").classList.remove("hidden");
    document.getElementById("video-grid").style.opacity = "0.3";
    document.getElementById("video-error").classList.add("hidden");
  }

  hideLoading() {
    document.getElementById("video-loading").classList.add("hidden");
    document.getElementById("video-grid").style.opacity = "1";
  }

  showError() {
    this.hideLoading();
    document.getElementById("video-error").classList.remove("hidden");
    document.getElementById("video-grid").innerHTML = "";
  }

  clearVideoGrid() {
    document.getElementById("video-grid").innerHTML = "";
    document.getElementById("video-player").innerHTML = `
            <div class="video-placeholder">
                <div class="placeholder-content">
                    <span class="placeholder-icon">📺</span>
                    <h4>Select a training video</h4>
                    <p>Choose a category to browse warm-up drills, sprint techniques, and more</p>
                </div>
            </div>
        `;
    document.getElementById("video-info").classList.add("hidden");
  }

  /**
   * Clean up component resources
   */
  destroy() {
    this.onDestroy(); // Calls parent cleanup method
    this.currentVideos = [];
    this.selectedVideo = null;
    this.currentCategory = null;
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    logger.debug('TrainingVideoComponent destroyed and cleaned up');
  }
}

export default TrainingVideoComponent;
