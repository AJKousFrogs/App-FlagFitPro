# 🔄 TODO to GitHub Issue Reference Mapping

**Purpose**: Replace inline TODOs with GitHub issue references  
**Status**: Ready to apply  
**Files Affected**: 15 TypeScript files

---

## 📋 File-by-File TODO Replacements

### 1. `evidence-config.service.ts`
```typescript
// BEFORE:
// TODO: Implement logging to backend

// AFTER:
// See issue #21 - Implement backend logging service
```

---

### 2. `recovery.service.ts`
```typescript
// BEFORE:
// TODO: Store protocols in recovery_protocols table

// AFTER:
// See issue #22 - Migrate recovery protocols to dedicated table
```

---

### 3. `acwr-alerts.service.ts` (4 TODOs)
```typescript
// BEFORE (line 138):
playerId: "current-player", // TODO: Get from context

// AFTER:
playerId: "current-player", // See issue #26 - Get player context from auth

// BEFORE (line 139):
playerName: "Current Player", // TODO: Get from player service

// AFTER:
playerName: "Current Player", // See issue #27 - Get player name from auth

// BEFORE (line 173):
// TODO: Integrate with your notification system

// AFTER:
// See issue #23 - Integrate ACWR alerts with notification system

// BEFORE (line 191):
// TODO: Send email/SMS to coach

// AFTER:
// See issue #24 - Implement email/SMS coach alerts
```

---

### 4. `nutrition.service.ts`
```typescript
// BEFORE (line 605):
/**
 * TODO: Implement via Supabase Edge Function with OpenAI
 */

// AFTER:
/**
 * See issue #25 - Implement OpenAI nutrition AI assistant
 * Requires: Supabase Edge Function, OpenAI API key, budget approval
 */
```

---

### 5. `performance-data.service.ts`
```typescript
// BEFORE:
// TODO: Implement data export by fetching all tables and formatting

// AFTER:
// See issue #12 - Implement performance data export API (CSV, JSON, PDF)
```

---

### 6. `verify-email.component.ts` (2 TODOs)
```typescript
// BEFORE (line 186):
// TODO: Call API to verify email token

// AFTER:
// See issue #1 - Implement email verification API endpoint

// BEFORE (line 217):
// TODO: Call API to resend verification email

// AFTER:
// See issue #2 - Implement resend verification email API
```

---

### 7. `training.component.ts` (2 TODOs)
```typescript
// BEFORE (lines 718, 727):
// TODO: Update workout status in backend

// AFTER:
// See issue #6 - Implement workout status update API
```

---

### 8. `smart-training-form.component.ts` (3 TODOs)
```typescript
// BEFORE (line 445):
recentPerformance: [], // TODO: Load from API

// AFTER:
recentPerformance: [], // See issue #14 - Load recent performance API

// BEFORE (line 446):
upcomingGames: [], // TODO: Load from API

// AFTER:
upcomingGames: [], // See issue #14 - Load upcoming games API

// BEFORE (line 547):
// TODO: Submit to API

// AFTER:
// See issue #7 - Implement training form submission API
```

---

### 9. `ai-training-scheduler.component.ts` (3 TODOs)
```typescript
// BEFORE (line 190):
// TODO: Call API to load AI suggestions

// AFTER:
// See issue #10 - Implement AI training scheduler API (load suggestions)

// BEFORE (line 218):
// TODO: Apply suggestion

// AFTER:
// See issue #10 - Implement AI training scheduler API (apply)

// BEFORE (line 228):
// TODO: Dismiss suggestion

// AFTER:
// See issue #10 - Implement AI training scheduler API (dismiss)
```

---

### 10. `qb-throwing-tracker.component.ts` (2 TODOs)
```typescript
// BEFORE (line 156):
// TODO: Load weekly throwing stats

// AFTER:
// See issue #9 - Implement QB throwing tracker API (load stats)

// BEFORE (line 164):
// TODO: Save throwing session

// AFTER:
// See issue #9 - Implement QB throwing tracker API (save session)
```

---

### 11. `training-schedule.component.ts`
```typescript
// BEFORE:
// TODO: Call API to load training sessions

// AFTER:
// See issue #8 - Implement training schedule API
```

---

### 12. `team-create.component.ts`
```typescript
// BEFORE:
// TODO: Call API to create team

// AFTER:
// See issue #3 - Implement team creation API
```

---

### 13. `accept-invitation.component.ts` (3 TODOs)
```typescript
// BEFORE (line 200):
// TODO: Call API to load invitation data

// AFTER:
// See issue #4 - Implement team invitation API (load)

// BEFORE (line 229):
// TODO: Call API to accept invitation

// AFTER:
// See issue #4 - Implement team invitation API (accept)

// BEFORE (line 265):
// TODO: Call API to decline invitation

// AFTER:
// See issue #4 - Implement team invitation API (decline)
```

---

### 14. `acwr-dashboard.component.ts` (3 TODOs)
```typescript
// BEFORE (line 583):
// TODO: Open session logging modal

// AFTER:
// See issue #15 - Implement ACWR session logging modal

// BEFORE (line 588):
// TODO: Navigate to history page

// AFTER:
// See issue #16 - Implement ACWR history navigation

// BEFORE (line 593):
// TODO: Generate PDF report

// AFTER:
// See issue #17 - Implement PDF report generation
```

---

### 15. `onboarding.component.ts`
```typescript
// BEFORE:
// TODO: Call API to save onboarding data

// AFTER:
// See issue #5 - Implement onboarding data persistence API
```

---

### 16. `enhanced-analytics.component.ts` (2 TODOs)
```typescript
// BEFORE (line 156):
// TODO: Call API to load enhanced analytics

// AFTER:
// See issue #11 - Implement enhanced analytics API

// BEFORE (line 185):
// TODO: Implement report export

// AFTER:
// See issue #13 - Implement report export API (PDF with charts)
```

---

### 17. `training-builder.component.ts` (2 TODOs)
```typescript
// BEFORE (line 702):
recentPerformance: [], // TODO: Load from API

// AFTER:
recentPerformance: [], // See issue #14 - Load recent performance API

// BEFORE (line 703):
upcomingGames: [], // TODO: Load from API

// AFTER:
upcomingGames: [], // See issue #14 - Load upcoming games API
```

---

### 18. `interactive-skills-radar.component.ts`
```typescript
// BEFORE:
// TODO: Implement skill drill functionality

// AFTER:
// See issue #18 - Implement skill drill functionality with video demos
```

---

### 19. `header.component.ts` (2 TODOs)
```typescript
// BEFORE (line 468):
// TODO: Navigate to search results or trigger search service

// AFTER:
// See issue #19 - Implement global search functionality

// BEFORE (line 474):
// TODO: Implement notifications panel toggle

// AFTER:
// See issue #20 - Implement notifications panel toggle
```

---

## 📊 Summary

**Total Replacements**: 36 TODOs → 27 GitHub issues  
**Files to Update**: 19 TypeScript files  
**Pattern**: `// TODO: X` → `// See issue #N - X`

---

## 🚀 Batch Update Commands

### Option 1: Manual Updates (Recommended for Review)
Update each file individually using the replacements above.

### Option 2: Automated Script (Use with caution)
```bash
# Example for one file:
sed -i '' 's|// TODO: Implement logging to backend|// See issue #21 - Implement backend logging service|g' \
  angular/src/app/core/services/evidence-config.service.ts
```

**Note**: Manual updates recommended to ensure accuracy and review each change.

---

## ✅ Verification Checklist

After updating inline TODOs:
- [ ] All 36 TODOs replaced with issue references
- [ ] Issue numbers match GitHub issues
- [ ] Descriptions are clear and concise
- [ ] No TODO comments remain (except in docs)
- [ ] Code still compiles
- [ ] No linter errors introduced

---

## 📋 Next Steps

1. **Create GitHub Issues**:
   - Copy issue templates to GitHub
   - Add labels, milestones, assignees
   - Link related issues

2. **Update Inline TODOs**:
   - Apply replacements above
   - Review each change
   - Commit with message: "docs: Replace inline TODOs with GitHub issue references"

3. **Create Project Board**:
   - Add all issues to board
   - Organize by priority
   - Plan sprints

4. **Team Communication**:
   - Share issue list with team
   - Discuss priorities
   - Assign ownership

---

**Generated**: December 24, 2025  
**Status**: Ready to apply  
**Next**: Create GitHub issues, then update inline TODOs

