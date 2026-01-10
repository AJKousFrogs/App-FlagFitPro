# Remaining Issues Report 📋

**Date**: January 11, 2026  
**Status**: Minor issues found

---

## 🔍 **Issues Found**

### **1. Hardcoded Media Queries** 🟡 MEDIUM

**Count**: 209 instances in SCSS files, 21 in TypeScript files

**SCSS Files with Hardcoded Breakpoints**:
- `landing.component.scss` - 380px
- `roster-overview.component.scss` - 374px (iPhone SE specific)
- `roster.component.scss` - 374px
- `video-curation.component.scss` - 374px
- `video-suggestion.component.scss` - 900px, 600px
- `training-schedule.component.scss` - 767px, 479px, 1023px (many instances)

**TypeScript Files** (21 instances):
- Component styles defined inline in TypeScript files

**Issue**: These weren't caught in our batch conversion because they use:
- Off-by-one values (767px instead of 768px, 479px instead of 480px)
- Device-specific values (374px for iPhone SE, 380px, 900px, 600px)
- Inline styles in TypeScript `@Component` decorators

**Impact**: Medium - inconsistent with the new standardized system

---

### **2. ::ng-deep Usage** 🟡 MEDIUM

**Count**: 53 instances

**Issue**: `::ng-deep` is deprecated in Angular and will be removed in future versions

**Location**: Various component SCSS files

**Impact**: Medium - will cause warnings, eventual breaking change

---

### **3. !important Overuse** 🟢 LOW

**Count**: 378 instances

**Issue**: Excessive use of `!important` suggests specificity issues

**Impact**: Low - works but indicates potential CSS architecture issues

---

### **4. Documentation Files** 📝 INFO

**Count**: 55 markdown files

**Issue**: Many documentation files from this session

**Files Created Today**:
- WEEK_4_* files (11 files)
- Previous audit files
- Migration files

**Impact**: None - informational only

---

## 🎯 **Recommended Actions**

### **Priority 1: Convert Remaining Hardcoded Breakpoints** 🔴

**Estimated Time**: 30-45 minutes

**Files to Fix**:
1. `training-schedule.component.scss` (highest count)
2. `video-suggestion.component.scss`
3. `roster-overview.component.scss`
4. `landing.component.scss`
5. TypeScript inline styles (21 files)

**Strategy**:
```scss
// Convert these patterns:
@media (max-width: 767px) → @include respond-to(md)  // 767 ≈ 768
@media (max-width: 479px) → @include respond-to(sm)  // 479 ≈ 480
@media (max-width: 1023px) → @include respond-to(lg) // 1023 ≈ 1024
@media (max-width: 374px) → @include respond-to(xs)  // iPhone SE
@media (max-width: 380px) → @include respond-to(xs)  // Small mobile
@media (max-width: 600px) → @include respond-to(sm)  // Content-based
@media (max-width: 900px) → @include respond-to(md)  // Content-based
```

---

### **Priority 2: Replace ::ng-deep** 🟡

**Estimated Time**: 1-2 hours

**Issue**: Deprecated Angular feature

**Solution**:
1. Move styles to global stylesheets where appropriate
2. Use `::part()` for web components
3. Use CSS custom properties (CSS variables) for theming
4. Use `ViewEncapsulation.None` sparingly when needed

---

### **Priority 3: Reduce !important Usage** 🟢 OPTIONAL

**Estimated Time**: 2-3 hours

**Issue**: Overuse suggests specificity issues

**Solution**:
- Review CSS cascade
- Increase selector specificity properly
- Refactor component hierarchy
- Use CSS layers more effectively

---

### **Priority 4: Clean Up Documentation** 📝 OPTIONAL

**Estimated Time**: 10 minutes

**Issue**: Many documentation files

**Solution**:
- Move to `/docs` folder
- Archive completed week files
- Keep only active documentation in root

---

## 📊 **Current Status**

| Issue | Count | Priority | Est. Time |
|-------|-------|----------|-----------|
| Hardcoded media queries | 230 | 🔴 High | 30-45 min |
| ::ng-deep usage | 53 | 🟡 Medium | 1-2 hrs |
| !important overuse | 378 | 🟢 Low | 2-3 hrs |
| Documentation files | 55 | 📝 Info | 10 min |

---

## 🎯 **Recommendation**

**Next Steps** (in order):

1. **Fix remaining hardcoded breakpoints** (30-45 min)
   - High impact, quick win
   - Completes Week 4 to 100%

2. **Address ::ng-deep deprecation** (1-2 hrs)
   - Future-proofing
   - Prevents future breaking changes

3. **Optional: Reduce !important** (2-3 hrs)
   - Code quality improvement
   - Not urgent

4. **Optional: Organize docs** (10 min)
   - Housekeeping
   - Can be done anytime

---

**Shall I proceed with fixing the remaining hardcoded breakpoints?** 🚀
