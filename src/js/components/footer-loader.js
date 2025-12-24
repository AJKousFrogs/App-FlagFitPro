/**
 * Footer Loader
 * Dynamically loads and injects the unified footer component
 * Supports both main footer and landing page footer variants
 */

import { BaseComponentLoader } from "./base-component-loader.js";
import { onDOMReady } from "../utils/dom-ready.js";

import { logger } from '../../logger.js';

class FooterLoader extends BaseComponentLoader {
  constructor() {
    const footerType = FooterLoader.detectFooterType();
    const footerFile =
      footerType === "landing"
        ? "./src/components/organisms/footer-landing.html"
        : "./src/components/organisms/footer-unified.html";

    super({
      containerSelector: "[data-footer-container]",
      componentPath: footerFile,
      componentName: "Footer",
      createContainer: FooterLoader.createContainer,
      autoInit: false, // We'll handle initialization manually
    });

    this.footerType = footerType;
    this.init();
  }

  /**
   * Detect which footer type to load based on page
   */
  static detectFooterType() {
    const path = window.location.pathname;
    const page = path.split("/").pop().replace(".html", "") || "index";

    // Landing pages use the enhanced footer
    const landingPages = ["index", "login", "register", "reset-password"];

    return landingPages.includes(page) ? "landing" : "main";
  }

  /**
   * Create footer container if it doesn't exist
   */
  static createContainer() {
    const container = document.createElement("div");
    container.setAttribute("data-footer-container", "");
    document.body.appendChild(container);
    return container;
  }

  /**
   * Override afterLoad to add footer-specific logic
   */
  afterLoad() {
    super.afterLoad();
    logger.info(
      `[Footer Loader] Footer loaded successfully (${this.footerType})`,
    );
  }
}

// Auto-initialize on DOM ready
onDOMReady(() => {
  window.footerLoader = new FooterLoader();
});

export { FooterLoader };
