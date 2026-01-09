# Route Redirects Documentation

**Generated:** January 9, 2026  
**Purpose:** Document all route redirects for clarity and maintenance

---

## Overview

FlagFit Pro uses route redirects to maintain backward compatibility and consolidate navigation. This document lists all redirects, their destinations, and deprecation status.

---

## Active Redirects

### Training Routes

| Old Route | New Route | Reason | Status | Deprecation Date |
|-----------|-----------|--------|--------|------------------|
| `/training/daily` | `/todays-practice` | Route consolidation | ✅ Active | 2026-01-09 |
| `/training/protocol` | `/todays-practice` | Route consolidation | ✅ Active | 2026-01-09 |
| `/training/protocol/:date` | `/todays-practice` | Route consolidation | ✅ Active | 2026-01-09 |
| `/training/schedule` | `/training` | Duplicate route | ✅ Active | 2026-01-09 |
| `/training/qb/schedule` | `/training/qb` | Route consolidation | ✅ Active | 2026-01-09 |
| `/training/qb/throwing` | `/training/qb` | Route consolidation | ✅ Active | 2026-01-09 |
| `/training/qb/assessment` | `/training/qb` | Route consolidation | ✅ Active | 2026-01-09 |
| `/training/ai-companion` | `/training/advanced` | Feature consolidation | ✅ Active | 2026-01-09 |
| `/load-monitoring` | `/acwr` | Route consolidation | ✅ Active | 2026-01-09 |
| `/injury-prevention` | `/acwr` | Route consolidation | ✅ Active | 2026-01-09 |

### Dashboard Routes

| Old Route | New Route | Reason | Status | Deprecation Date |
|-----------|-----------|--------|--------|------------------|
| `/athlete-dashboard` | `/player-dashboard` | Terminology update | ✅ Active | 2026-01-09 |

### AI Coach Routes

| Old Route | New Route | Reason | Status | Deprecation Date |
|-----------|-----------|--------|--------|------------------|
| `/ai-coach` | `/chat` | Rebranding to "Merlin" | ✅ Active | 2026-01-09 |

### Team Management Routes

| Old Route | New Route | Reason | Status | Deprecation Date |
|-----------|-----------|--------|--------|------------------|
| `/coach` | `/team/workspace` | Route consolidation | ✅ Active | 2026-01-09 |
| `/admin` | `/superadmin` | Route consolidation | ✅ Active | 2026-01-09 |

---

## Implementation Details

### Redirect Configuration

All redirects are configured in `angular/src/app/core/routes/feature-routes.ts`:

```typescript
{
  path: "old-route",
  redirectTo: "new-route",
  pathMatch: "full",
}
```

### Redirect Behavior

- **Path Match:** All redirects use `pathMatch: "full"` to ensure exact matches
- **Query Parameters:** Query parameters are preserved during redirect
- **Hash Fragments:** Hash fragments are preserved during redirect

---

## Migration Guide

### For Developers

When updating navigation or links:

1. **Use Canonical Routes:** Always use the new route in new code
2. **Update Existing Links:** Gradually update existing links to use new routes
3. **Test Redirects:** Verify redirects work correctly after changes

### For Users

- Old bookmarks will automatically redirect to new routes
- No action required from users
- All functionality remains the same

---

## Deprecation Timeline

### Phase 1: Active Redirects (Current)
- **Duration:** 3 months from deprecation date
- **Status:** Redirects active, old routes still accessible
- **Action:** Update navigation to use canonical routes

### Phase 2: Warning Period (Future)
- **Duration:** 1 month
- **Status:** Redirects active with console warnings
- **Action:** Final migration push

### Phase 3: Removal (Future)
- **Duration:** Permanent
- **Status:** Old routes return 404, suggest correct route
- **Action:** Complete migration

---

## Route Consolidation Rationale

### Training Routes
- **Consolidation:** Multiple training entry points consolidated to `/todays-practice`
- **Benefit:** Single source of truth for daily training protocol
- **Impact:** Improved navigation consistency

### Dashboard Routes
- **Consolidation:** `/athlete-dashboard` → `/player-dashboard`
- **Benefit:** Consistent terminology across application
- **Impact:** Better alignment with user roles

### AI Coach Routes
- **Consolidation:** `/ai-coach` → `/chat`
- **Benefit:** Simpler, more intuitive route
- **Impact:** Better user experience

---

## Monitoring

### Redirect Usage Tracking

To monitor redirect usage:

1. **Analytics:** Track route access patterns
2. **Logs:** Monitor redirect frequency
3. **User Feedback:** Collect feedback on navigation

### Metrics to Track

- Redirect frequency per route
- User confusion indicators
- Navigation patterns

---

## Future Considerations

### Potential New Redirects

- None planned at this time

### Routes to Deprecate

- Review after 3 months of redirect activity
- Consider deprecating low-usage redirects first

---

## Related Documentation

- [Feature Routes Configuration](../angular/src/app/core/routes/feature-routes.ts)
- [API Documentation](./API.md)
- [Feature Documentation](./FEATURE_DOCUMENTATION.md)
- [Audits Summary](./AUDITS.md)

---

**Last Updated:** January 9, 2026  
**Next Review:** April 9, 2026
