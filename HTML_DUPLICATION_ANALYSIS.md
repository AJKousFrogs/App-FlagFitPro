# HTML Code Duplication Analysis Report

**Date:** 2025-01-27  
**Scope:** All HTML files in the codebase  
**Total HTML Files Analyzed:** 91 files

---

## 🔴 CRITICAL DUPLICATIONS

### 1. Supabase Configuration Block (28 files)
**Duplicated Code Pattern:**
```html
<!-- Supabase JS SDK from CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase Configuration -->
<script>
  // Set Supabase config in window for production/development
  window._env = {
    SUPABASE_URL: 'https://pvziciccwxgftcielknm.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWNjd3hnZnRjaWVsa25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzcwNTgsImV4cCI6MjA3NTExMzA1OH0.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU'
  };
</script>
```

**Affected Files:**
- wellness.html
- roster.html
- settings.html
- community.html
- verify-email.html
- qb-throwing-tracker.html
- qb-training-schedule.html
- qb-assessment-tools.html
- login.html
- team-create.html
- tournaments.html
- register.html
- coach-dashboard.html
- onboarding.html
- profile.html
- analytics.html
- training.html
- dashboard.html
- training-schedule.html
- workout.html
- update-roster-data.html
- performance-tracking.html
- game-tracker.html
- exercise-library.html
- coach.html
- chat.html
- auth/callback.html
- accept-invitation.html

**Recommendation:** Extract to a shared script file (`src/js/config/supabase-config.js`) and include once in a base template or main.js.

---

### 2. Standard HTML Head Section (30+ files)
**Duplicated Code Pattern:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FlagFit Pro - [Page Name]</title>
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏈</text></svg>"
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <!-- New Modular CSS Architecture -->
    <link rel="stylesheet" href="./src/css/main.css" />
```

**Note:** A template exists at `src/components/templates/html-head-template.html` but is NOT being used consistently.

**Recommendation:** 
- Use the existing template via a build process or server-side includes
- Or create a JavaScript function to inject the head section dynamically

---

## 🟡 HIGH PRIORITY DUPLICATIONS

### 3. Component Loader Scripts (20+ files each)

#### 3a. Sidebar Loader (20 files)
```html
<!-- Sidebar Loader (Dynamic Component) -->
<script type="module" src="./src/js/components/sidebar-loader.js" defer></script>
```

**Affected Files:** wellness.html, roster.html, settings.html, community.html, qb-throwing-tracker.html, qb-training-schedule.html, qb-assessment-tools.html, tournaments.html, coach-dashboard.html, profile.html, analytics.html, training.html, dashboard.html, workout.html, performance-tracking.html, game-tracker.html, exercise-library.html, coach.html, chat.html

#### 3b. Top Bar Loader (17 files)
```html
<!-- Top Bar Loader (Dynamic Component) -->
<script type="module" src="./src/js/components/top-bar-loader.js" defer></script>
```

**Affected Files:** wellness.html, roster.html, settings.html, community.html, qb-throwing-tracker.html, qb-assessment-tools.html, tournaments.html, profile.html, analytics.html, training.html, dashboard.html, workout.html, performance-tracking.html, game-tracker.html, exercise-library.html, coach.html

#### 3c. Footer Loader (30 files)
```html
<!-- Footer Loader (Dynamic Component) -->
<script type="module" src="./src/js/components/footer-loader.js" defer></script>
```

**Affected Files:** wellness.html, roster.html, settings.html, community.html, qb-throwing-tracker.html, qb-training-schedule.html, qb-assessment-tools.html, login.html, team-create.html, reset-password.html, tournaments.html, register.html, coach-dashboard.html, profile.html, analytics.html, training.html, index.html, dashboard.html, training-schedule.html, workout.html, update-roster-data.html, performance-tracking.html, game-tracker.html, exercise-library.html, coach.html, chat.html, component-library.html, enhanced-analytics.html

**Recommendation:** Bundle these common loaders into a single script (`src/js/components/common-loaders.js`) that loads all three components.

---

### 4. Common Utility Scripts (30+ files each)

#### 4a. Lucide Icons (36 files)
```html
<!-- Lucide Icons - Modern icon library similar to Radix UI -->
<script
  src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"
  crossorigin="anonymous"
  defer
></script>
```

#### 4b. Icon Helper (34 files)
```html
<script src="./src/icon-helper.js" defer></script>
```

#### 4c. Theme Switcher (31 files)
```html
<script src="./src/theme-switcher.js" defer></script>
```

**Recommendation:** Include these in a shared head template or bundle them into main.js.

---

### 5. Navigation Container Patterns (18 files)

#### 5a. Sidebar Container (18 files)
```html
<!-- Unified Sidebar Navigation (Loaded Dynamically) -->
<div data-sidebar-container></div>
```

**Affected Files:** wellness.html, roster.html, settings.html, community.html, qb-throwing-tracker.html, qb-training-schedule.html, qb-assessment-tools.html, tournaments.html, coach-dashboard.html, profile.html, analytics.html, training.html, dashboard.html, performance-tracking.html, game-tracker.html, exercise-library.html, coach.html, chat.html

#### 5b. Top Bar Container (14 files)
```html
<!-- Top Bar (Loaded Dynamically) -->
<div data-topbar-container></div>
```

**Affected Files:** wellness.html, roster.html, settings.html, community.html, qb-throwing-tracker.html, qb-assessment-tools.html, tournaments.html, profile.html, analytics.html, training.html, dashboard.html, performance-tracking.html, exercise-library.html, coach.html

**Recommendation:** These are already using dynamic loading, which is good. Consider creating a layout wrapper component.

---

### 6. Chatbot Preload Pattern (5 files)
**Duplicated Code Pattern:**
```html
<!-- Preload Chatbot Component -->
<script type="module">
  // Preload chatbot for faster access
  import("./src/js/components/chatbot.js")
    .then((module) => {
      // Ensure chatbot is available globally
      if (module.flagFitChatbot) {
        window.flagFitChatbot = module.flagFitChatbot;
        console.log("Chatbot loaded successfully");
      }
    })
    .catch((error) => {
      console.warn("Chatbot preload failed:", error);
    });
</script>
```

**Affected Files:** roster.html, tournaments.html, analytics.html, training.html, dashboard.html

**Recommendation:** Extract to a shared script file or include in main.js.

---

### 7. Font Preconnect Pattern (30+ files)
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Recommendation:** Include in shared head template.

---

## 🟢 MEDIUM PRIORITY DUPLICATIONS

### 8. Dashboard Container Structure (15+ files)
```html
<div class="dashboard-container">
  <!-- Unified Sidebar Navigation (Loaded Dynamically) -->
  <div data-sidebar-container></div>
  
  <main class="main-content">
    <!-- Top Bar (Loaded Dynamically) -->
    <div data-topbar-container></div>
    <!-- Page content -->
  </main>
</div>
```

**Recommendation:** Create a reusable layout component or template.

---

### 9. Favicon Pattern (30+ files)
```html
<link
  rel="icon"
  href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏈</text></svg>"
/>
```

**Recommendation:** Include in shared head template.

---

### 10. Main.js Import Pattern (30+ files)
```html
<!-- Universal Components -->
<script type="module" src="./src/js/main.js"></script>
```

**Recommendation:** This is already centralized, which is good. Ensure all pages use it consistently.

---

## 📊 DUPLICATION STATISTICS

| Category | Duplication Count | Files Affected | Priority |
|----------|------------------|----------------|----------|
| Supabase Config | ~15 lines | 28 files | 🔴 Critical |
| HTML Head Section | ~20 lines | 30+ files | 🔴 Critical |
| Sidebar Loader | 1 line | 20 files | 🟡 High |
| Top Bar Loader | 1 line | 17 files | 🟡 High |
| Footer Loader | 1 line | 30 files | 🟡 High |
| Lucide Icons | 3 lines | 36 files | 🟡 High |
| Icon Helper | 1 line | 34 files | 🟡 High |
| Theme Switcher | 1 line | 31 files | 🟡 High |
| Sidebar Container | 1 line | 18 files | 🟡 High |
| Top Bar Container | 1 line | 14 files | 🟡 High |
| Chatbot Preload | ~15 lines | 5 files | 🟡 High |
| Font Preconnect | 2 lines | 30+ files | 🟡 High |
| Dashboard Container | ~5 lines | 15+ files | 🟢 Medium |
| Favicon | 3 lines | 30+ files | 🟢 Medium |

**Total Estimated Duplicated Lines:** ~500+ lines across all HTML files

---

## 🎯 RECOMMENDED SOLUTIONS

### Solution 1: Use Existing Head Template
The project already has `src/components/templates/html-head-template.html`. Create a build process or server-side include to use it.

### Solution 2: Create Shared Script Bundles
- `src/js/bundles/common-head.js` - Loads all common head scripts (Lucide, icon-helper, theme-switcher)
- `src/js/bundles/common-components.js` - Loads sidebar, topbar, footer loaders
- `src/js/config/supabase-config.js` - Centralized Supabase configuration

### Solution 3: Create Layout Templates
- `src/components/templates/dashboard-layout.html` - Already exists, ensure consistent usage
- `src/components/templates/auth-layout.html` - Already exists, ensure consistent usage

### Solution 4: Build-Time Template Processing
Use a build tool (e.g., Eleventy, Handlebars, or a simple Node.js script) to:
1. Inject head template into all HTML files
2. Inject layout templates where appropriate
3. Bundle common scripts automatically

---

## ✅ IMMEDIATE ACTION ITEMS

1. **Fix Existing Templates** (Priority: Critical)
   - Fix malformed script tags in `dashboard-layout.html`, `auth-layout.html`, `admin-layout.html`
   - Ensure templates are syntactically correct

2. **Extract Supabase Config** (Priority: Critical)
   - Create `src/js/config/supabase-config.js`
   - Update all 28 files to use it

3. **Standardize Head Section** (Priority: Critical)
   - Use `src/components/templates/html-head-template.html` consistently
   - Or create a JavaScript function to inject it
   - Fix any syntax issues in the template

4. **Bundle Component Loaders** (Priority: High)
   - Create `src/js/components/common-loaders.js`
   - Replace individual loader scripts with single import

5. **Bundle Utility Scripts** (Priority: High)
   - Create `src/js/bundles/common-head.js`
   - Include Lucide, icon-helper, theme-switcher

6. **Extract Chatbot Preload** (Priority: High)
   - Move chatbot preload logic to main.js or a shared component loader

7. **Create Build Process** (Priority: Medium)
   - Implement template injection system
   - Use build tool (Eleventy, Handlebars, or Node.js script) to inject templates
   - Ensure consistent usage across all HTML files

---

## 📝 NOTES

- The project already has some good patterns (dynamic component loading, templates)
- The main issue is inconsistent usage of existing templates
- Consider implementing a build step to automate template injection
- Some duplication is acceptable for standalone HTML files, but should be minimized

### Template Issues Found

1. **Existing Templates Have Syntax Errors:**
   - `src/components/templates/dashboard-layout.html` - Line 24: Malformed script tag (`<script src="./src/icon-helper.js">` missing closing tag)
   - `src/components/templates/auth-layout.html` - Line 24: Same issue
   - `src/components/templates/admin-layout.html` - Same pattern

2. **Templates Not Being Used:**
   - Templates exist but HTML files are copying code instead of using them
   - No build process to inject templates into HTML files
   - Manual copy-paste leads to inconsistencies

3. **Template Structure:**
   - `src/components/templates/html-head-template.html` - Good template, but not used
   - `src/components/templates/dashboard-layout.html` - Has structure but needs fixes
   - `src/components/templates/auth-layout.html` - Has structure but needs fixes

---

## 🔍 FILES TO REVIEW

1. `src/components/templates/html-head-template.html` - Already exists, needs consistent usage
2. `src/components/templates/dashboard-layout.html` - Review and standardize
3. `src/components/templates/auth-layout.html` - Review and standardize
4. `src/js/main.js` - Consider adding common script loading here

---

**Report Generated:** 2025-01-27  
**Next Review:** After implementing recommended solutions

