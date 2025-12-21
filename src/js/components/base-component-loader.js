/**
 * Base Component Loader Class - FlagFit Pro
 * Provides common functionality for component loaders (footer, sidebar, top-bar)
 * Reduces code duplication across loader implementations
 */

import { onDOMReady } from '../utils/dom-ready.js';
import { initializeLucideIcons, setSafeContent } from '../utils/shared.js';
import { logger } from '../../logger.js';

export class BaseComponentLoader {
  constructor(config) {
    this.config = {
      containerSelector: config.containerSelector,
      componentPath: config.componentPath,
      componentName: config.componentName || 'Component',
      autoInit: config.autoInit !== false, // Default to true
      ...config
    };
    
    this.container = null;
    
    if (this.config.autoInit) {
      this.init();
    }
  }

  /**
   * Initialize component loading
   */
  async init() {
    try {
      await this.loadComponent();
      // Call afterLoad - can be async or sync
      const result = this.afterLoad();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      logger.error(`[${this.config.componentName} Loader] Failed to load:`, error);
    }
  }

  /**
   * Load component HTML from file
   */
  async loadComponent() {
    const response = await fetch(this.config.componentPath);

    if (!response.ok) {
      throw new Error(`Failed to load ${this.config.componentName}: ${response.status}`);
    }

    const componentHTML = await response.text();

    // Find or create container
    this.container = document.querySelector(this.config.containerSelector);

    if (!this.container && this.config.createContainer) {
      this.container = this.createContainer();
    }

    if (!this.container) {
      throw new Error(`${this.config.componentName} container not found`);
    }

    // Inject component HTML using setSafeContent
    // HTML files from server are trusted, but we sanitize for safety
    setSafeContent(this.container, componentHTML, true, true);

    logger.info(`[${this.config.componentName} Loader] Loaded successfully`);
  }

  /**
   * Create container element (override in subclasses if needed)
   */
  createContainer() {
    const container = document.createElement('div');
    container.setAttribute(this.config.containerSelector.replace(/[\[\]]/g, ''), '');
    return container;
  }

  /**
   * Called after component is loaded (override in subclasses)
   */
  afterLoad() {
    this.initializeLucideIcons();
  }

  /**
   * Initialize Lucide icons in the loaded component
   */
  initializeLucideIcons() {
    if (this.container) {
      initializeLucideIcons(this.container, {
        initialDelay: 100,
        maxAttempts: 50,
        pollInterval: 100
      });
    }
  }

  /**
   * Static helper to auto-initialize loader on DOM ready
   */
  static autoInit(LoaderClass, config) {
    onDOMReady(() => {
      window[config.instanceName || config.componentName.toLowerCase() + 'Loader'] = new LoaderClass(config);
    });
  }
}

