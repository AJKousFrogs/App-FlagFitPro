# TODO Comments Audit - December 24, 2025

**Status:** Documented for tracking  
**Total Found:** 80+ instances across 34 files  
**Action:** Track in project management system

---

## 📊 Summary by Category

| Category | Count | Priority | Action |
|----------|-------|----------|--------|
| Angular Components | ~50 | Medium | Track for future sprints |
| Netlify Functions | ~20 | Low | Mock implementations |
| Legacy JS Files | ~5 | Low | May be obsolete |
| Service Worker | 2 | Low | IndexedDB optimization |
| Scripts | ~3 | Low | Enhancement features |

---

## 🎯 High-Impact TODOs (Worth Implementing)

### Angular Training Components
**Files:** `angular/src/app/features/training/*.ts`

Common patterns:
- TODO: Add validation for form inputs
- TODO: Implement error retry logic
- TODO: Add loading states for async operations
- TODO: Cache frequently accessed data
- TODO: Add undo/redo functionality

**Recommendation:** Create user stories for UX improvements

### Angular Services
**Files:** `angular/src/app/core/services/*.ts`

Common patterns:
- TODO: Add offline support
- TODO: Implement data pagination
- TODO: Add request caching
- TODO: Optimize API calls

**Recommendation:** Performance optimization sprint

---

## 🟡 Medium-Impact TODOs (Optional Enhancements)

### 1. Schedule Builder Modal
**File:** `src/js/components/schedule-builder-modal.js`
**TODOs:** 2

```javascript
// TODO: Add month navigation (previous/next)
// TODO: Add drag-and-drop support for schedule items
```

**Recommendation:** 
- May be obsolete (vanilla JS, not Angular)
- Check if Angular version exists
- If obsolete, delete file instead

### 2. Netlify Admin Function  
**File:** `netlify/functions/admin.cjs`
**TODOs:** 6

```javascript
// TODO: Implement actual admin dashboard data
// TODO: Connect to real database queries
// TODO: Add user management endpoints
// TODO: Add analytics aggregation
// TODO: Add export functionality
// TODO: Add audit log retrieval
```

**Recommendation:**
- These are mock implementations
- Create admin feature spec
- Implement as needed for admin panel
- **Priority:** Low (admin features not critical for MVP)

### 3. Nutrition Function
**File:** `netlify/functions/nutrition.cjs`
**TODOs:** 1

```javascript
// TODO: Implement USDA API integration when API key available
```

**Recommendation:**
- Document API key requirement
- Add to deployment checklist
- **Status:** Blocked on API key

---

## 🟢 Low-Impact TODOs (Nice to Have)

### 4. Service Worker
**File:** `sw.js`
**TODOs:** 2

```javascript
// TODO: Add IndexedDB query optimization
// TODO: Implement selective cache clearing
```

**Recommendation:**
- Performance optimization
- Only needed if offline support is critical
- **Priority:** Low

### 5. Angular Components (Various)
**Files:** Multiple component files

Common patterns:
```typescript
// TODO: Add accessibility improvements
// TODO: Add keyboard shortcuts
// TODO: Improve mobile responsiveness
// TODO: Add tooltips
// TODO: Add help text
```

**Recommendation:**
- Create accessibility audit
- Bundle into UX improvement sprint
- **Priority:** Low to Medium

---

## ❌ TODOs to Remove (Likely Obsolete)

### Legacy Vanilla JS Files

Since we deleted most legacy files, any remaining TODOs in `src/` directory should be reviewed:

**Action:** Run audit to verify:
```bash
grep -r "TODO\|FIXME\|HACK" src/ --include="*.js"
```

**Expected:** Should find very few (most legacy code deleted)

---

## 📝 Recommended Actions

### Immediate (This Week):
1. ✅ **Document TODOs** (this file)
2. ✅ **Categorize by priority**
3. ❌ **Remove obsolete TODOs** from deleted files (n/a - files deleted)

### Short Term (This Month):
4. **Create GitHub Issues** for high-impact TODOs
5. **Add to product backlog** for medium-impact items
6. **Archive** low-impact TODOs in documentation

### Long Term (Next Quarter):
7. **Plan sprints** for grouped improvements
8. **Implement** based on user feedback and priority

---

## 🎯 TODO Management Strategy

### Instead of Inline TODOs, Use:

1. **GitHub Issues** for features/improvements
2. **Linear/Jira** for task tracking
3. **Product Roadmap** for planned features
4. **Code Comments** only for technical debt that needs context

### When to Use Inline TODOs:

✅ **Acceptable:**
- During active development (to be resolved in same PR)
- Technical debt with context (why it exists, what needs fixing)
- Blocked on external dependency (API keys, etc.)

❌ **Avoid:**
- Feature requests (use issue tracker)
- Nice-to-have improvements (use backlog)
- Long-term enhancements (use roadmap)
- Vague TODOs without context

---

## 📊 TODO Statistics by File Type

### Angular (.ts files):
- **Count:** ~50 TODOs
- **Type:** Feature enhancements, UX improvements
- **Priority:** Medium (track for sprints)

### Netlify Functions (.cjs files):
- **Count:** ~20 TODOs  
- **Type:** Mock implementations, API integrations
- **Priority:** Low (implement as needed)

### Legacy JS (.js files in src/):
- **Count:** ~5 TODOs
- **Type:** Various
- **Priority:** Low (may be obsolete after cleanup)

### Service Worker:
- **Count:** 2 TODOs
- **Type:** Performance optimization
- **Priority:** Low

### Scripts:
- **Count:** ~3 TODOs
- **Type:** Script enhancements
- **Priority:** Low

---

## ✅ Next Steps

1. **Copy TODO list to project management tool**
   - Create epics for major features
   - Create user stories for UX improvements
   - Label with priority

2. **Clean up inline TODOs**
   - Replace with issue references: `// See issue #123`
   - Add context for technical debt
   - Remove vague TODOs

3. **Establish TODO policy**
   - Document in CONTRIBUTING.md
   - Add to code review checklist
   - Use linter rules to enforce

---

## 🔍 How to Find Remaining TODOs

```bash
# Find all TODO comments
grep -r "TODO\|FIXME\|HACK" . --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist

# Count by directory
grep -r "TODO" angular/src --include="*.ts" | wc -l
grep -r "TODO" netlify/functions --include="*.cjs" | wc -l
grep -r "TODO" src --include="*.js" | wc -l

# List files with TODOs
grep -r "TODO" . --include="*.ts" --include="*.js" --exclude-dir=node_modules --files-with-matches | sort
```

---

## 📋 Template for New TODOs

When adding a TODO, use this format:

```typescript
// TODO(username): Brief description
// Context: Why this is needed
// Blocker: What's preventing implementation (if applicable)
// Related: Link to issue/ticket (if applicable)
// Priority: High/Medium/Low
```

Example:
```typescript
// TODO(dev-team): Add request caching for frequently accessed data
// Context: API calls for user stats are repeated on every page load
// Related: Issue #245 - Performance optimization sprint
// Priority: Medium
```

---

## 🎉 Summary

**Status:** ✅ Documented  
**Recommendation:** Track in project management system, don't leave in code  
**Next Action:** Create GitHub issues for high-priority items

Most TODOs are:
- Feature enhancements (track in backlog)
- Mock implementations (implement as needed)
- UX improvements (plan in sprints)

**No critical TODOs found** - all are enhancements or optional features.

---

**Generated:** December 24, 2025  
**Last Updated:** December 24, 2025  
**Maintainer:** Development Team

