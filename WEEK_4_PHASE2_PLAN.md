# Week 4: Phase 2 - Consolidation Action Plan 🎯

**Date**: January 11, 2026  
**Status**: Ready to Execute

---

## 🎯 **Consolidation Strategy**

### **Priority 1: CRITICAL - Breakpoint Standardization** 🔴

**Problem**: 147 files use hardcoded `@media (max-width: 768px)`

**Solution**: Replace with `@include respond-to(md)` mixin

**Benefits**:
- ✅ Single source of truth
- ✅ Easy to adjust globally
- ✅ Consistent behavior
- ✅ Better maintainability

**Estimated Files**: 147 files to update

---

## 📋 **Execution Plan**

### **Batch Strategy**

Given 147 files, I'll process them in batches of **20 files** to maintain quality and allow verification.

**Batch Size Reasoning**:
- Manageable review scope
- Prevents token exhaustion
- Allows testing between batches
- Git history stays clean

---

## 🔧 **Phase 2.1: Breakpoint Migration (Batch by Batch)**

### **Common Replacements**

| Hardcoded | Mixin Replacement | Breakpoint |
|-----------|-------------------|------------|
| `@media (max-width: 768px)` | `@include respond-to(md)` | ≤768px |
| `@media (max-width: 1024px)` | `@include respond-to(lg)` | ≤1024px |
| `@media (max-width: 640px)` | `@include respond-to(sm)` | ≤640px |
| `@media (max-width: 576px)` | `@include respond-to(xs)` | ≤576px |
| `@media (max-width: 480px)` | `@include respond-to(sm)` | ≤640px |
| `@media (max-width: 414px)` | `@include respond-to(xs)` | ≤576px |
| `@media (max-width: 430px)` | `@include respond-to(sm)` | ≤640px |
| `@media (min-width: 769px)` | `@include respond-above(md)` | >768px |
| `@media (min-width: 1025px)` | `@include respond-above(lg)` | >1024px |

**Note**: Device-specific sizes (414px, 430px) will be consolidated to standard breakpoints.

---

### **Batch 1: Feature Components (20 files)**
**Files**: exercisedb, team-calendar, settings, ai-coach, landing, payments, data-import, playbook, chat, achievements, wellness, roster (various), not-found, sleep-debt, training (video-curation)

**Estimated Time**: 20 minutes  
**Commit Message**: "fix(week4-batch1): standardize 768px breakpoints in 20 feature files"

---

### **Batch 2: Training Components (20 files)**
**Files**: Remaining training components, video-suggestion, periodization-dashboard, etc.

**Estimated Time**: 20 minutes

---

### **Batch 3-8: Remaining Files**
**147 files total** / 20 per batch = **~7-8 batches**

**Total Estimated Time**: 2-3 hours

---

## 🎯 **Phase 2.2: Touch Target Audit**

**After breakpoint migration**, I'll audit interactive elements:

### **Elements to Check**:
- [ ] All buttons
- [ ] All form inputs
- [ ] All links in content
- [ ] All checkboxes/radio buttons
- [ ] All icon buttons
- [ ] All navigation items
- [ ] All tab buttons
- [ ] All toggle switches

**Target**: 100% WCAG 2.5.5 compliance (44×44px minimum)

---

## 🎯 **Phase 2.3: Device-Specific Removal**

**Remove**:
- `max-width: 414px` (iPhone 11 Pro)
- `max-width: 430px` (iPhone 14 Pro Max)
- `max-width: 380px` (Small mobile)

**Replace with**:
- Standard `xs` (576px) or `sm` (640px) breakpoints
- Content-based breakpoints instead of device-based

---

## ✅ **Success Criteria**

**Phase 2 Complete When**:
- ✅ Mixin usage > 95% (from 7%)
- ✅ All 768px breakpoints converted
- ✅ All 1024px breakpoints converted
- ✅ All touch targets ≥ 44×44px
- ✅ Device-specific breakpoints removed
- ✅ All changes tested
- ✅ No visual regressions

---

## 🚀 **Ready to Start!**

**Batch 1 ready to execute** - 20 files  
**Pattern**: Replace `@media (max-width: 768px)` with `@include respond-to(md)`

**Shall I begin?** 🎯
