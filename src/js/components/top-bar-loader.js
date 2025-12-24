/**
 * Top Bar Loader
 * Dynamically loads and injects the unified top bar component
 * Includes search, notifications, theme toggle, and user menu
 */

import { BaseComponentLoader } from "./base-component-loader.js";
import { onDOMReady } from "../utils/dom-ready.js";
import { getInitials } from "../utils/shared.js";

class TopBarLoader extends BaseComponentLoader {
  constructor() {
    super({
      containerSelector: "[data-topbar-container]",
      componentPath: "./src/components/organisms/top-bar-unified.html",
      componentName: "Top Bar",
      createContainer: TopBarLoader.createTopBarContainer,
      autoInit: false, // We'll handle initialization manually
    });

    this.init();
  }

  /**
   * Create top bar container if it doesn't exist
   */
  static createContainer() {
    const mainContent = document.querySelector(
      "#main-content, .main-content, main",
    );
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    const container = document.createElement("div");
    container.setAttribute("data-topbar-container", "");
    mainContent.insertAdjacentElement("afterbegin", container);
    return container;
  }

  /**
   * Override afterLoad to initialize user avatar
   */
  afterLoad() {
    super.afterLoad();
    this.initializeUserAvatar();
  }

  /**
   * Initialize user avatar with initials from auth
   */
  initializeUserAvatar() {
    // Wait for auth manager to be available
    setTimeout(() => {
      const userAvatar = document.getElementById("user-avatar");
      if (!userAvatar) {
        return;
      }

      // Try to get user info from auth manager
      if (window.authManager && window.authManager.user) {
        const user = window.authManager.user;
        const initials = getInitials(user.name || user.email || "User");
        userAvatar.textContent = initials;
      } else {
        // Default initials
        userAvatar.textContent = "JD";
      }
    }, 500);
  }
}

// Auto-initialize on DOM ready
onDOMReady(() => {
  window.topBarLoader = new TopBarLoader();
});

export { TopBarLoader };
