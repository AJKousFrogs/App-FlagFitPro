/**
 * Sidebar Navigation Loader
 * Dynamically loads and injects the unified sidebar component
 * Handles active state based on current page
 */

class SidebarLoader {
  constructor() {
    this.sidebarContainer = null;
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  /**
   * Get current page name from URL
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'dashboard';
    return page;
  }

  /**
   * Initialize sidebar loading
   */
  async init() {
    try {
      await this.loadSidebar();
      this.setActivePage();
      this.initializeLucideIcons();
    } catch (error) {
      console.error('[Sidebar Loader] Failed to load sidebar:', error);
    }
  }

  /**
   * Load sidebar HTML from component file
   */
  async loadSidebar() {
    try {
      const response = await fetch('./src/components/organisms/sidebar-navigation.html');

      if (!response.ok) {
        throw new Error(`Failed to load sidebar: ${response.status}`);
      }

      const sidebarHTML = await response.text();

      // Find the sidebar container or create one
      this.sidebarContainer = document.querySelector('[data-sidebar-container]');

      if (!this.sidebarContainer) {
        // Create container if it doesn't exist
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
          this.sidebarContainer = document.createElement('div');
          this.sidebarContainer.setAttribute('data-sidebar-container', '');
          dashboardContainer.insertBefore(this.sidebarContainer, dashboardContainer.firstChild);
        } else {
          throw new Error('Dashboard container not found');
        }
      }

      // Inject sidebar HTML
      this.sidebarContainer.innerHTML = sidebarHTML;

      console.log('[Sidebar Loader] Sidebar loaded successfully');
    } catch (error) {
      console.error('[Sidebar Loader] Error loading sidebar HTML:', error);
      throw error;
    }
  }

  /**
   * Set active state for current page
   */
  setActivePage() {
    // Remove all active classes
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Add active class to current page
    const currentNavItem = document.querySelector(
      `.sidebar .nav-item[data-page="${this.currentPage}"]`
    );

    if (currentNavItem) {
      currentNavItem.classList.add('active');
      currentNavItem.setAttribute('aria-current', 'page');
    } else {
      // Fallback: try to match by href
      const fallbackItem = document.querySelector(
        `.sidebar .nav-item[href*="${this.currentPage}"]`
      );
      if (fallbackItem) {
        fallbackItem.classList.add('active');
        fallbackItem.setAttribute('aria-current', 'page');
      }
    }
  }

  /**
   * Initialize Lucide icons in sidebar
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
          console.warn('[Sidebar Loader] Lucide icons not loaded');
        }
      }, 100);
    }
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.sidebarLoader = new SidebarLoader();
  });
} else {
  // DOM already loaded
  window.sidebarLoader = new SidebarLoader();
}

export { SidebarLoader };
