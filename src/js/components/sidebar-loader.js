/**
 * Sidebar Navigation Loader
 * Dynamically loads and injects the unified sidebar component
 * Handles active state based on current page
 */

import { BaseComponentLoader } from './base-component-loader.js';
import { onDOMReady } from '../utils/dom-ready.js';

class SidebarLoader extends BaseComponentLoader {
  constructor() {
    super({
      containerSelector: '[data-sidebar-container]',
      componentPath: './src/components/organisms/sidebar-navigation.html',
      componentName: 'Sidebar',
      createContainer: SidebarLoader.createSidebarContainer,
      autoInit: false // We'll handle initialization manually
    });

    this.currentPage = SidebarLoader.getCurrentPage();
    this.init();
  }

  /**
   * Get current page name from URL
   */
  static getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'dashboard';
    return page;
  }

  /**
   * Create sidebar container if it doesn't exist
   */
  static createContainer() {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) {
      throw new Error('Dashboard container not found');
    }

    const container = document.createElement('div');
    container.setAttribute('data-sidebar-container', '');
    dashboardContainer.insertBefore(container, dashboardContainer.firstChild);
    return container;
  }

  /**
   * Override afterLoad to set active page and initialize enhanced features
   */
  afterLoad() {
    super.afterLoad();
    this.setActivePage();
    // Initialize enhanced features after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeEnhancedFeatures();
    }, 100);
  }

  /**
   * Initialize enhanced sidebar features
   */
  async initializeEnhancedFeatures() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Ensure Lucide icons are initialized (base loader handles this, but double-check)
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons(sidebar);
    }

    // Load and initialize enhanced sidebar navigation
    try {
      const { EnhancedSidebarNav } = await import('./enhanced-sidebar-nav.js');
      // The EnhancedSidebarNav auto-initializes, but we ensure it's set up
      if (!window.enhancedSidebarNav) {
        window.enhancedSidebarNav = new EnhancedSidebarNav();
      }
    } catch (error) {
      console.warn('[Sidebar Loader] Could not load enhanced sidebar navigation:', error);
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
}

// Auto-initialize on DOM ready
onDOMReady(() => {
  window.sidebarLoader = new SidebarLoader();
});

export { SidebarLoader };
