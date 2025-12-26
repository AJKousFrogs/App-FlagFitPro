#!/usr/bin/env node
/**
 * Update Sidebars Script
 * Replaces old icon-only sidebars with unified sidebar structure
 */

const fs = require("fs");
const path = require("path");

// Unified sidebar template
function getUnifiedSidebar(activePage) {
  const navMap = {
    "dashboard.html": "nav-dashboard",
    "analytics.html": "nav-analytics",
    "roster.html": "nav-roster",
    "training.html": "nav-training",
    "tournaments.html": "nav-tournaments",
    "community.html": "nav-community",
    "chat.html": "nav-chat",
    "settings.html": "nav-settings",
    "profile.html": "nav-profile",
  };

  const activeId = navMap[activePage] || "";

  return `        <!-- Unified Sidebar Navigation -->
        <div class="sidebar">
            <div class="sidebar-logo" onclick="window.location.href='/dashboard.html'" title="FlagFit Pro">
                <i data-lucide="activity" style="width: 20px; height: 20px; color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i>
            </div>
            
            <nav class="nav-section" aria-label="Dashboard navigation">
                <a href="/dashboard.html" class="nav-item${activeId === "nav-dashboard" ? " active" : ""}" aria-label="Dashboard Overview" id="nav-dashboard">
                    <span class="nav-item-icon">
                        <i data-lucide="layout-dashboard" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Overview</span>
                </a>
                <a href="/analytics.html" class="nav-item${activeId === "nav-analytics" ? " active" : ""}" aria-label="Analytics" id="nav-analytics">
                    <span class="nav-item-icon">
                        <i data-lucide="bar-chart-3" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Analytics</span>
                </a>
            </nav>
            
            <nav class="nav-section" aria-label="Team navigation">
                <a href="/roster.html" class="nav-item${activeId === "nav-roster" ? " active" : ""}" aria-label="Team Roster" id="nav-roster">
                    <span class="nav-item-icon">
                        <i data-lucide="users" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Roster</span>
                </a>
                <a href="/training.html" class="nav-item${activeId === "nav-training" ? " active" : ""}" aria-label="Training" id="nav-training">
                    <span class="nav-item-icon">
                        <i data-lucide="zap" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Training</span>
                </a>
                <a href="/tournaments.html" class="nav-item${activeId === "nav-tournaments" ? " active" : ""}" aria-label="Tournaments" id="nav-tournaments">
                    <span class="nav-item-icon">
                        <i data-lucide="trophy" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Tournaments</span>
                </a>
            </nav>
            
            <nav class="nav-section" aria-label="Community navigation">
                <a href="/community.html" class="nav-item${activeId === "nav-community" ? " active" : ""}" aria-label="Community" id="nav-community">
                    <span class="nav-item-icon">
                        <i data-lucide="message-circle" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Community</span>
                </a>
                <a href="/chat.html" class="nav-item${activeId === "nav-chat" ? " active" : ""}" aria-label="Chat" id="nav-chat">
                    <span class="nav-item-icon">
                        <i data-lucide="message-square" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Chat</span>
                </a>
            </nav>
            
            <nav class="nav-section" aria-label="Personal navigation">
                <a href="/settings.html" class="nav-item${activeId === "nav-settings" ? " active" : ""}" aria-label="Settings" id="nav-settings">
                    <span class="nav-item-icon">
                        <i data-lucide="settings" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Settings</span>
                </a>
                <a href="/profile.html" class="nav-item${activeId === "nav-profile" ? " active" : ""}" aria-label="Profile" id="nav-profile">
                    <span class="nav-item-icon">
                        <i data-lucide="user" style="width: 24px; height: 24px;"></i>
                    </span>
                    <span class="nav-item-label">Profile</span>
                </a>
            </nav>
        </div>`;
}

// Old sidebar pattern to replace
const oldSidebarPattern =
  /<div class="sidebar">[\s\S]*?<\/div>\s*(?=<main|<!--)/;

const filesToUpdate = [
  { file: "settings.html", active: "nav-settings" },
  { file: "community.html", active: "nav-community" },
  { file: "coach.html", active: "nav-dashboard" },
  { file: "chat.html", active: "nav-chat" },
  { file: "training-schedule.html", active: "nav-training" },
  { file: "qb-training-schedule.html", active: "nav-training" },
  { file: "exercise-library.html", active: "nav-training" },
];

filesToUpdate.forEach(({ file, active: _active }) => {
  const filePath = path.join(__dirname, "..", file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file}: FILE NOT FOUND`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const activePage = file;
  const newSidebar = getUnifiedSidebar(activePage);

  // Replace old sidebar
  content = content.replace(oldSidebarPattern, newSidebar + "\n\n");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Updated ${file}`);
});

console.log("\n✅ All sidebars updated!");
