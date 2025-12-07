/**
 * Top Bar Loader
 * Dynamically loads and injects the unified top bar component
 * Includes search, notifications, theme toggle, and user menu
 */

import { getInitials } from '../utils/shared.js';

class TopBarLoader {
  constructor() {
    this.topBarContainer = null;
    this.init();
  }

  /**
   * Initialize top bar loading
   */
  async init() {
    try {
      await this.loadTopBar();
      this.initializeLucideIcons();
      this.initializeUserAvatar();
    } catch (error) {
      console.error('[Top Bar Loader] Failed to load top bar:', error);
    }
  }

  /**
   * Load top bar HTML from component file
   */
  async loadTopBar() {
    try {
      const response = await fetch('./src/components/organisms/top-bar-unified.html');

      if (!response.ok) {
        throw new Error(`Failed to load top bar: ${response.status}`);
      }

      const topBarHTML = await response.text();

      // Find the top bar container or create one
      this.topBarContainer = document.querySelector('[data-topbar-container]');

      if (!this.topBarContainer) {
        // Find main-content element to insert before
        const mainContent = document.querySelector('#main-content, .main-content, main');

        if (mainContent) {
          // Create container and insert before main content
          this.topBarContainer = document.createElement('div');
          this.topBarContainer.setAttribute('data-topbar-container', '');
          mainContent.insertAdjacentElement('afterbegin', this.topBarContainer);
        } else {
          throw new Error('Main content element not found');
        }
      }

      // Inject top bar HTML
      this.topBarContainer.innerHTML = topBarHTML;

      console.log('[Top Bar Loader] Top bar loaded successfully');
    } catch (error) {
      console.error('[Top Bar Loader] Error loading top bar HTML:', error);
      throw error;
    }
  }

  /**
   * Initialize Lucide icons in top bar
   */
  initializeLucideIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    } else {
      // Wait for Lucide to load
      let attempts = 0;
      const maxAttempts = 50;
      const checkLucide = setInterval(() => {
        attempts++;
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          clearInterval(checkLucide);
          lucide.createIcons();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkLucide);
          console.warn('[Top Bar Loader] Lucide icons not loaded');
        }
      }, 100);
    }
  }

  /**
   * Initialize user avatar with initials from auth
   */
  initializeUserAvatar() {
    // Wait for auth manager to be available
    setTimeout(() => {
      const userAvatar = document.getElementById('user-avatar');
      if (!userAvatar) {return;}

      // Try to get user info from auth manager
      if (window.authManager && window.authManager.user) {
        const user = window.authManager.user;
        const initials = getInitials(user.name || user.email || 'User');
        userAvatar.textContent = initials;
      } else {
        // Default initials
        userAvatar.textContent = 'JD';
      }
    }, 500);
  }

}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.topBarLoader = new TopBarLoader();
  });
} else {
  // DOM already loaded
  window.topBarLoader = new TopBarLoader();
}

export { TopBarLoader };
