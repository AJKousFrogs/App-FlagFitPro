// Accessibility Fixes - Applies fixes to existing HTML
// Run this after DOM is loaded to fix accessibility issues

import { logger } from "./logger.js";

export function applyAccessibilityFixes() {
  // Fix decorative icons
  fixDecorativeIcons();

  // Fix icon-only buttons
  fixIconOnlyButtons();

  // Fix redundant ARIA labels
  fixRedundantAriaLabels();

  // Fix heading structure
  fixHeadingStructure();

  // Fix form labels
  fixFormLabels();

  // Add required field indicators
  addRequiredFieldIndicators();
}

function fixDecorativeIcons() {
  // Find all Lucide icons
  const icons = document.querySelectorAll("[data-lucide]");

  icons.forEach((icon) => {
    // Skip if already has aria-label or aria-labelledby (meaningful icon)
    if (
      icon.hasAttribute("aria-label") ||
      icon.hasAttribute("aria-labelledby")
    ) {
      return;
    }

    const parent = icon.parentElement;
    const hasVisibleText =
      parent &&
      parent.textContent.trim().length > 0 &&
      parent.textContent.trim() !== icon.textContent.trim();

    // If icon is decorative (has visible text nearby), add aria-hidden
    if (
      hasVisibleText ||
      isDecorativeIconName(icon.getAttribute("data-lucide"))
    ) {
      icon.setAttribute("aria-hidden", "true");
    }
  });
}

function isDecorativeIconName(iconName) {
  const decorativeIcons = [
    "chevron-right",
    "chevron-left",
    "chevron-down",
    "chevron-up",
    "arrow-right",
    "arrow-left",
    "arrow-up",
    "arrow-down",
    "check",
    "x",
    "circle",
  ];
  return decorativeIcons.includes(iconName);
}

function fixIconOnlyButtons() {
  // Find buttons with only icons
  const buttons = document.querySelectorAll('button, a[role="button"]');

  buttons.forEach((button) => {
    const textContent = button.textContent.trim();
    const hasIcon = button.querySelector("[data-lucide]");

    // If button only has icon and no aria-label
    if (hasIcon && !textContent && !button.hasAttribute("aria-label")) {
      const icon = button.querySelector("[data-lucide]");
      const iconName = icon.getAttribute("data-lucide");
      const label = getIconLabel(iconName);

      if (label) {
        button.setAttribute("aria-label", label);
        icon.setAttribute("aria-hidden", "true");
      }
    }
  });
}

function getIconLabel(iconName) {
  const iconLabels = {
    settings: "Settings",
    user: "User menu",
    bell: "Notifications",
    search: "Search",
    menu: "Toggle navigation",
    x: "Close",
    "trash-2": "Delete",
    edit: "Edit",
    plus: "Add",
    home: "Go to dashboard",
    "log-out": "Logout",
    "log-in": "Login",
    lock: "Sign in",
    activity: "Activity",
  };

  return iconLabels[iconName] || null;
}

function fixRedundantAriaLabels() {
  // Find buttons with aria-label that duplicates visible text
  const buttons = document.querySelectorAll("button, a");

  buttons.forEach((button) => {
    const ariaLabel = button.getAttribute("aria-label");
    const textContent = button.textContent.trim();

    if (
      ariaLabel &&
      textContent &&
      ariaLabel.toLowerCase() === textContent.toLowerCase()
    ) {
      // Remove redundant aria-label
      button.removeAttribute("aria-label");
    }
  });
}

function fixHeadingStructure() {
  // Check for skipped heading levels
  const headings = Array.from(
    document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  );

  if (headings.length === 0) {
    return;
  }

  let currentLevel = 0;
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));

    if (index === 0) {
      // First heading should be h1
      if (level !== 1 && level < 3) {
        // Don't auto-fix, just log warning
        logger.warn(
          "Heading structure issue: First heading should be h1",
          heading,
        );
      }
      currentLevel = level;
    } else {
      // Check for skipped levels
      if (level > currentLevel + 1) {
        logger.warn(
          "Heading structure issue: Skipped level",
          heading,
          `Expected h${currentLevel + 1}, got h${level}`,
        );
      }
      currentLevel = level;
    }
  });

  // Check for multiple h1 elements
  const h1Elements = document.querySelectorAll("h1");
  if (h1Elements.length > 1) {
    logger.warn("Multiple h1 elements found:", h1Elements.length);
    // Convert extra h1s to h2
    Array.from(h1Elements)
      .slice(1)
      .forEach((h1) => {
        const h2 = document.createElement("h2");
        h2.className = h1.className;
        // Clone all child nodes safely
        Array.from(h1.childNodes).forEach((node) => {
          h2.appendChild(node.cloneNode(true));
        });
        h1.parentNode.replaceChild(h2, h1);
      });
  }
}

function fixFormLabels() {
  // Ensure all inputs have associated labels
  const inputs = document.querySelectorAll("input, textarea, select");

  inputs.forEach((input) => {
    // Skip if already has aria-label or aria-labelledby
    if (
      input.hasAttribute("aria-label") ||
      input.hasAttribute("aria-labelledby")
    ) {
      return;
    }

    // Check for label with matching for/id
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (!label) {
        // Try to find label that wraps input
        const parentLabel = input.closest("label");
        if (!parentLabel) {
          logger.warn("Input without label:", input);
        }
      }
    } else {
      // Input without id - try to find associated label
      const parentLabel = input.closest("label");
      if (!parentLabel) {
        logger.warn("Input without id or label:", input);
      }
    }
  });
}

function addRequiredFieldIndicators() {
  // Add visual indicators for required fields
  const requiredInputs = document.querySelectorAll(
    "input[required], textarea[required], select[required]",
  );

  requiredInputs.forEach((input) => {
    input.setAttribute("aria-required", "true");

    // Find associated label
    let label;
    if (input.id) {
      label = document.querySelector(`label[for="${input.id}"]`);
    }

    if (!label) {
      label = input.closest("label");
    }

    if (label && !label.querySelector(".required-indicator")) {
      const indicator = document.createElement("span");
      indicator.className = "required-indicator";
      indicator.textContent = " *";
      indicator.setAttribute("aria-label", "required");
      indicator.style.color = "var(--color-status-error, #ef4444)";
      label.appendChild(indicator);
    }
  });
}

// Run on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyAccessibilityFixes);
} else {
  applyAccessibilityFixes();
}

// Re-run after Lucide icons are created
if (typeof lucide !== "undefined") {
  const originalCreateIcons = lucide.createIcons;
  lucide.createIcons = function (...args) {
    const result = originalCreateIcons.apply(this, args);
    setTimeout(() => {
      fixDecorativeIcons();
      fixIconOnlyButtons();
    }, 100);
    return result;
  };
}
