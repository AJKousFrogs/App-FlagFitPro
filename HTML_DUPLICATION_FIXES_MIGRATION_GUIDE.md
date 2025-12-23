# HTML Duplication Fixes - Migration Guide

This guide explains how to update existing HTML files to use the new centralized configuration and bundled scripts.

## ✅ What Has Been Fixed

### 1. Template Syntax Errors Fixed

- ✅ `src/components/templates/dashboard-layout.html`
- ✅ `src/components/templates/auth-layout.html`
- ✅ `src/components/templates/admin-layout.html`

### 2. New Centralized Files Created

- ✅ `src/js/config/supabase-config.js` - Centralized Supabase configuration
- ✅ `src/js/components/common-loaders.js` - Bundled component loaders
- ✅ `src/js/bundles/common-head.js` - Bundled head scripts (for reference)

### 3. Templates Updated

- ✅ `src/components/templates/html-head-template.html` - Updated with new patterns

### 4. Example Files Updated

- ✅ `dashboard.html` - Demonstrates dashboard page pattern
- ✅ `login.html` - Demonstrates auth page pattern

---

## 📋 Migration Steps

### Step 1: Replace Supabase Configuration

**OLD (Remove this):**

```html
<!-- Supabase JS SDK from CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase Configuration -->
<script>
  // Set Supabase config in window for production/development
  window._env = {
    SUPABASE_URL: "https://pvziciccwxgftcielknm.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  };
</script>
```

**NEW (Use this):**

```html
<!-- Supabase Configuration (Centralized) -->
<script src="./src/js/config/supabase-config.js"></script>

<!-- Supabase JS SDK from CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Files to update:** All 28 files that currently have inline Supabase config

---

### Step 2: Replace Component Loaders (Dashboard Pages Only)

**OLD (Remove these individual loaders):**

```html
<!-- Sidebar Loader (Dynamic Component) -->
<script
  type="module"
  src="./src/js/components/sidebar-loader.js"
  defer
></script>
<!-- Top Bar Loader (Dynamic Component) -->
<script
  type="module"
  src="./src/js/components/top-bar-loader.js"
  defer
></script>
<!-- Footer Loader (Dynamic Component) -->
<script type="module" src="./src/js/components/footer-loader.js" defer></script>
```

**NEW (Use bundled loader):**

```html
<!-- Common Component Loaders (Sidebar, Top Bar, Footer) -->
<script
  type="module"
  src="./src/js/components/common-loaders.js"
  defer
></script>
```

**Files to update:** Dashboard pages that use sidebar, topbar, and footer:

- wellness.html
- roster.html
- settings.html
- community.html
- qb-throwing-tracker.html
- qb-assessment-tools.html
- tournaments.html
- coach-dashboard.html
- profile.html
- analytics.html
- training.html
- performance-tracking.html
- game-tracker.html
- exercise-library.html
- coach.html
- chat.html

**Note:** Auth pages (login.html, register.html) only need footer-loader, so keep individual loader for those.

---

### Step 3: Keep Common Scripts (No Change Needed)

These scripts should remain as-is (they're already optimized):

```html
<!-- Lucide Icons (CDN - must be script tag) -->
<script
  src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"
  crossorigin="anonymous"
  defer
></script>

<!-- Core Scripts -->
<script src="./src/icon-helper.js" defer></script>
<script src="./src/theme-switcher.js" defer></script>
```

---

## 📝 File-by-File Checklist

### Dashboard Pages (Need Both Fixes)

- [ ] wellness.html
- [ ] roster.html
- [ ] settings.html
- [ ] community.html
- [ ] qb-throwing-tracker.html
- [ ] qb-training-schedule.html
- [ ] qb-assessment-tools.html
- [ ] tournaments.html
- [ ] coach-dashboard.html
- [ ] profile.html
- [ ] analytics.html
- [ ] training.html
- [ ] performance-tracking.html
- [ ] game-tracker.html
- [ ] exercise-library.html
- [ ] coach.html
- [ ] chat.html
- [x] dashboard.html (Already updated)

### Auth Pages (Need Supabase Config Only)

- [x] login.html (Already updated)
- [ ] register.html
- [ ] reset-password.html
- [ ] verify-email.html
- [ ] accept-invitation.html
- [ ] team-create.html
- [ ] onboarding.html
- [ ] auth/callback.html

### Other Pages (Need Supabase Config Only)

- [ ] update-roster-data.html
- [ ] workout.html
- [ ] training-schedule.html

---

## 🎯 Quick Reference

### For Dashboard Pages:

1. Replace Supabase config block with centralized config
2. Replace 3 individual component loaders with 1 bundled loader
3. Keep all other scripts as-is

### For Auth Pages:

1. Replace Supabase config block with centralized config
2. Keep footer-loader individual (auth pages don't need sidebar/topbar)
3. Keep all other scripts as-is

### For Other Pages:

1. Replace Supabase config block with centralized config
2. Keep all other scripts as-is

---

## 🔍 Verification

After updating a file, verify:

1. ✅ Supabase config is loaded from `./src/js/config/supabase-config.js`
2. ✅ Dashboard pages use `common-loaders.js` instead of 3 individual loaders
3. ✅ No duplicate Supabase configuration blocks
4. ✅ Page still loads correctly in browser

---

## 📊 Benefits

After migration:

- ✅ **Reduced duplication:** ~15 lines per file × 28 files = ~420 lines removed
- ✅ **Easier maintenance:** Update Supabase config in one place
- ✅ **Consistent patterns:** All files use same configuration approach
- ✅ **Better performance:** Bundled loaders reduce HTTP requests

---

## 🚨 Important Notes

1. **Order matters:** Supabase config script must come BEFORE Supabase SDK script
2. **Dashboard vs Auth:** Dashboard pages use `common-loaders.js`, auth pages keep individual footer-loader
3. **Testing:** Test each page after migration to ensure components load correctly
4. **Environment variables:** For production, update `supabase-config.js` to read from environment variables

---

## 📞 Need Help?

Refer to:

- `dashboard.html` - Example of dashboard page pattern
- `login.html` - Example of auth page pattern
- `src/components/templates/html-head-template.html` - Complete head template reference

---

**Last Updated:** 2025-01-27  
**Status:** Migration in progress (2/28 files completed)
