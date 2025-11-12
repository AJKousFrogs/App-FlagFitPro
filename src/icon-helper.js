// Icon Helper - Maps emoji icons to Lucide Icons
// Usage: getIcon('dashboard') returns SVG string for Dashboard icon

const iconMap = {
  // Navigation
  dashboard: "LayoutDashboard",
  "team-roster": "Users",
  training: "Zap",
  tournaments: "Trophy",
  analytics: "BarChart3",
  community: "MessageCircle",
  settings: "Settings",
  help: "HelpCircle",
  coach: "ClipboardList",
  chat: "MessageSquare",
  schedule: "Calendar",

  // Actions
  search: "Search",
  notification: "Bell",
  user: "User",
  logout: "LogOut",
  add: "Plus",
  edit: "Edit",
  delete: "Trash2",
  save: "Save",
  cancel: "X",
  check: "Check",
  "arrow-right": "ArrowRight",
  "arrow-left": "ArrowLeft",
  "arrow-up": "ArrowUp",
  "arrow-down": "ArrowDown",

  // Stats & Performance
  chart: "BarChart3",
  "trending-up": "TrendingUp",
  "trending-down": "TrendingDown",
  target: "Target",
  activity: "Activity",
  award: "Award",
  star: "Star",

  // Training
  strength: "Dumbbell",
  speed: "Zap",
  recovery: "Heart",
  measurement: "Ruler",
  wellness: "HeartPulse",
  supplement: "Pill",
  injury: "Bandage",
  performance: "Gauge",

  // Sports
  football: "Activity", // Lucide doesn't have Football icon, using Activity instead
  flag: "Flag",

  // Other
  send: "Send",
  export: "Download",
  import: "Upload",
  filter: "Filter",
  menu: "Menu",
  close: "X",
  info: "Info",
  warning: "AlertTriangle",
  error: "AlertCircle",
  success: "CheckCircle",
};

// Generate Lucide icon SVG
function getIcon(iconName, size = 20, color = "currentColor", strokeWidth = 2) {
  const iconType = iconMap[iconName] || "Circle";

  // We'll use Lucide Icons via CDN, so we return a data structure
  // that can be used to render the icon
  return {
    name: iconType,
    size,
    color,
    strokeWidth,
  };
}

// Render icon as SVG element (requires Lucide Icons to be loaded)
function renderIcon(
  iconName,
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
) {
  const icon = getIcon(iconName, size, color, strokeWidth);

  // Create a container for the icon
  const container = document.createElement("span");
  container.className = `lucide-icon lucide-${icon.name.toLowerCase()}`;
  container.setAttribute("data-icon", icon.name);
  container.style.display = "inline-flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.width = `${size}px`;
  container.style.height = `${size}px`;
  container.style.color = color;

  // The actual icon will be rendered by Lucide Icons library
  return container;
}

// Replace emoji with icon in element
function replaceEmojiWithIcon(element, emoji, iconName, size = 20) {
  if (element.textContent && element.textContent.includes(emoji)) {
    element.innerHTML = element.innerHTML.replace(
      emoji,
      `<i data-lucide="${iconMap[iconName] || iconName}" style="width: ${size}px; height: ${size}px;"></i>`,
    );
  }
}

// Initialize all Lucide icons on page load
function initLucideIcons() {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  } else {
    // Wait for Lucide to load
    const checkLucide = setInterval(() => {
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
        clearInterval(checkLucide);
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkLucide), 5000);
  }
}

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getIcon,
    renderIcon,
    replaceEmojiWithIcon,
    initLucideIcons,
    iconMap,
  };
}

// Make available globally
window.IconHelper = {
  getIcon,
  renderIcon,
  replaceEmojiWithIcon,
  initLucideIcons,
  iconMap,
};
