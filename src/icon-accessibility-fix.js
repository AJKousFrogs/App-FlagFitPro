// Icon Accessibility Fix
// Automatically adds aria-hidden="true" to decorative icons
// and ensures icon-only buttons have proper aria-labels

export function fixIconAccessibility() {
  // Find all Lucide icons
  const icons = document.querySelectorAll('[data-lucide]');
  
  icons.forEach(icon => {
    const iconName = icon.getAttribute('data-lucide');
    const parent = icon.parentElement;
    
    // Check if icon is decorative or meaningful
    const isDecorative = isDecorativeIcon(icon, parent);
    
    if (isDecorative) {
      // Add aria-hidden for decorative icons
      if (!icon.hasAttribute('aria-label') && !icon.hasAttribute('aria-labelledby')) {
        icon.setAttribute('aria-hidden', 'true');
      }
    } else {
      // Ensure meaningful icons have accessible names
      if (!icon.hasAttribute('aria-label') && !icon.hasAttribute('aria-labelledby')) {
        const accessibleName = getAccessibleName(iconName, parent);
        if (accessibleName) {
          icon.setAttribute('aria-label', accessibleName);
        } else {
          icon.setAttribute('aria-hidden', 'true');
        }
      }
    }
    
    // Fix icon-only buttons
    if (parent && parent.tagName === 'BUTTON' && !parent.textContent.trim()) {
      if (!parent.hasAttribute('aria-label')) {
        const label = getButtonLabel(iconName);
        if (label) {
          parent.setAttribute('aria-label', label);
        }
      }
    }
  });
}

function isDecorativeIcon(icon, parent) {
  // Icon is decorative if:
  // 1. It's inside a button/link with visible text
  // 2. It's purely visual (like chevrons, arrows in context)
  // 3. It's next to descriptive text
  
  if (parent) {
    const textContent = parent.textContent.trim();
    const hasVisibleText = textContent.length > 0 && 
                          textContent !== icon.textContent.trim();
    
    if (hasVisibleText) {
      return true; // Decorative if there's visible text
    }
    
    // Check if it's a structural icon (chevron, arrow in list)
    const structuralIcons = ['chevron-right', 'chevron-left', 'chevron-down', 
                             'chevron-up', 'arrow-right', 'arrow-left'];
    if (structuralIcons.includes(icon.getAttribute('data-lucide'))) {
      return true;
    }
  }
  
  return false;
}

function getAccessibleName(iconName, parent) {
  // Map common icons to accessible names
  const iconMap = {
    'settings': 'Settings',
    'user': 'User',
    'bell': 'Notifications',
    'search': 'Search',
    'menu': 'Menu',
    'x': 'Close',
    'check': 'Check',
    'trash-2': 'Delete',
    'edit': 'Edit',
    'plus': 'Add',
    'minus': 'Remove',
    'home': 'Home',
    'log-out': 'Logout',
    'log-in': 'Login'
  };
  
  return iconMap[iconName] || null;
}

function getButtonLabel(iconName) {
  const buttonLabels = {
    'settings': 'Settings',
    'user': 'User menu',
    'bell': 'Notifications',
    'search': 'Search',
    'menu': 'Toggle navigation',
    'x': 'Close',
    'trash-2': 'Delete',
    'edit': 'Edit',
    'plus': 'Add',
    'home': 'Go to dashboard',
    'log-out': 'Logout'
  };
  
  return buttonLabels[iconName] || null;
}

// Run on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fixIconAccessibility);
} else {
  fixIconAccessibility();
}

// Re-run after Lucide icons are created
if (typeof lucide !== 'undefined') {
  const originalCreateIcons = lucide.createIcons;
  lucide.createIcons = function(...args) {
    const result = originalCreateIcons.apply(this, args);
    setTimeout(fixIconAccessibility, 100);
    return result;
  };
}

