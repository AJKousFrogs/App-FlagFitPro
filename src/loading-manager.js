// Loading Manager for FlagFit Pro
// Provides consistent loading states, skeleton screens, and progress indicators

export class LoadingManager {
  constructor() {
    this.activeLoaders = new Map();
  }

  // Show loading overlay
  showLoading(message = 'Loading...', id = null) {
    const loaderId = id || `loader-${Date.now()}`;
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = loaderId;
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-label', message);

    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-message">${message}</div>
    `;

    document.body.appendChild(overlay);
    this.activeLoaders.set(loaderId, overlay);

    return loaderId;
  }

  // Hide loading overlay
  hideLoading(id = null) {
    if (id) {
      const loader = this.activeLoaders.get(id);
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.remove();
          this.activeLoaders.delete(id);
        }, 300);
      }
    } else {
      // Hide all loaders
      this.activeLoaders.forEach((loader) => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 300);
      });
      this.activeLoaders.clear();
    }
  }

  // Show skeleton screen
  showSkeleton(container, count = 1) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) return;

    const skeletons = [];
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-item';
      skeleton.innerHTML = `
        <div class="skeleton-header"></div>
        <div class="skeleton-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      `;
      container.appendChild(skeleton);
      skeletons.push(skeleton);
    }

    return skeletons;
  }

  // Hide skeleton screens
  hideSkeleton(skeletons) {
    if (Array.isArray(skeletons)) {
      skeletons.forEach(skeleton => {
        skeleton.style.opacity = '0';
        setTimeout(() => skeleton.remove(), 300);
      });
    } else if (skeletons) {
      skeletons.style.opacity = '0';
      setTimeout(() => skeletons.remove(), 300);
    }
  }

  // Show progress bar
  showProgress(container, current, total, message = null) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) return;

    const progressId = `progress-${Date.now()}`;
    const percentage = Math.round((current / total) * 100);

    const progressBar = document.createElement('div');
    progressBar.id = progressId;
    progressBar.className = 'progress-container';
    progressBar.innerHTML = `
      ${message ? `<div class="progress-message">${message}</div>` : ''}
      <div class="progress-bar-wrapper">
        <div class="progress-bar" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-text">${current} of ${total} (${percentage}%)</div>
    `;

    container.appendChild(progressBar);
    return progressId;
  }

  // Update progress
  updateProgress(progressId, current, total) {
    const progressBar = document.getElementById(progressId);
    if (!progressBar) return;

    const percentage = Math.round((current / total) * 100);
    const bar = progressBar.querySelector('.progress-bar');
    const text = progressBar.querySelector('.progress-text');

    if (bar) bar.style.width = `${percentage}%`;
    if (text) text.textContent = `${current} of ${total} (${percentage}%)`;
  }

  // Show inline loading state
  setLoadingState(element, isLoading, message = null) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) return;

    if (isLoading) {
      element.classList.add('is-loading');
      element.setAttribute('aria-busy', 'true');
      if (message) {
        element.setAttribute('aria-label', message);
      }
    } else {
      element.classList.remove('is-loading');
      element.removeAttribute('aria-busy');
      element.removeAttribute('aria-label');
    }
  }

  // Show saving indicator
  showSaving(element, message = 'Saving...') {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) return;

    const savingId = `saving-${Date.now()}`;
    const indicator = document.createElement('div');
    indicator.id = savingId;
    indicator.className = 'saving-indicator';
    indicator.innerHTML = `
      <i data-lucide="loader-2"></i>
      <span>${message}</span>
    `;

    element.appendChild(indicator);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    return savingId;
  }

  // Hide saving indicator
  hideSaving(savingId) {
    const indicator = document.getElementById(savingId);
    if (indicator) {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }
  }
}

// Global instance
export const loadingManager = new LoadingManager();

