# Chatbot Knowledge Governance Implementation Summary

## ✅ Implementation Complete

The chatbot now includes a comprehensive knowledge governance system that:

- **Categorizes knowledge** by approval status (approved, pending, experimental, rejected)
- **Tracks quality scores** based on research article quality
- **Shows evidence indicators** in responses
- **Filters by approval level** (league-approved, coach-reviewed, research-based, experimental)
- **Maintains audit trail** of all approval/rejection actions

---

## What Was Implemented

### 1. Database Migration (`040_knowledge_base_governance.sql`)

**New Fields on `knowledge_base_entries`:**

- `approval_status` - 'pending', 'approved', 'rejected', 'experimental'
- `approval_level` - 'league', 'coach', 'research', 'experimental'
- `approved_by` - User ID of approver
- `approved_at` - Timestamp of approval
- `approval_notes` - Notes from approver
- `research_source_ids` - Additional research article IDs
- `source_quality_score` - Quality score (0.0-1.0) based on article quality

**New Table: `knowledge_base_governance_log`**

- Audit trail of all governance actions
- Tracks who approved/rejected entries and when
- Stores status changes and notes

**Database Functions:**

- `calculate_source_quality_score()` - Auto-calculates quality score from articles
- `log_governance_action()` - Logs approval/rejection actions
- Trigger: Auto-updates quality score when articles change

### 2. Knowledge Base Service Updates (`src/js/services/knowledge-base-service.js`)

**New Features:**

- `searchKnowledgeBase()` now accepts governance options:
  - `requireApproval` - Only return approved entries (default: true)
  - `includeExperimental` - Include experimental entries (default: false)
  - `minQualityScore` - Minimum quality score filter (default: 0.0)

### 3. Knowledge Search API Updates (`netlify/functions/knowledge-search.cjs`)

**Governance Filters:**

- Filters by `approval_status` (approved, experimental, or all)
- Filters by `source_quality_score` (minimum threshold)
- Orders results by approval status, quality score, evidence strength

**Query Options:**

```javascript
{
  requireApproval: true,      // Only approved entries
  includeExperimental: false, // Exclude experimental
  minQualityScore: 0.3        // Minimum 30% quality
}
```

### 4. Response Enhancer Updates (`src/js/utils/response-enhancer.js`)

**New Method: `addEvidenceIndicators()`**

- Adds evidence information footer to responses
- Shows approval status (✅ League-Approved, 🔬 Experimental, ⏳ Pending)
- Shows evidence level (🟢 Strong, 🟡 Moderate, 🟠 Limited)
- Shows consensus level (High, Moderate, Low)
- Shows source quality score (0-100%)
- Shows approval level (League Guidelines, Coach-Reviewed, Research-Based)

### 5. Chatbot Integration

**Default Behavior:**

- Only shows approved entries by default
- Excludes experimental entries
- Minimum quality score: 30%
- Evidence indicators added to all knowledge base responses

---

## How It Works

### Flow Diagram

```
User Asks Question
    ↓
Search Knowledge Base
    ↓
Apply Governance Filters
    ├─→ Only approved entries
    ├─→ Minimum quality score (30%)
    └─→ Exclude experimental
    ↓
Return Filtered Results
    ↓
Generate Response
    ↓
Add Evidence Indicators
    ├─→ Approval status
    ├─→ Evidence level
    ├─→ Quality score
    └─→ Approval level
    ↓
Return Response with Evidence Info
```

### Example Response with Evidence Indicators

```
[Base response about iron supplementation]

---
📚 Evidence Information:
✅ League-Approved - This information has been reviewed and approved.
🟢 Evidence Level: Strong Evidence
🟢 Consensus: High
🟢 Source Quality: 85%
📋 Source: Research-Based

⚠️ Disclaimer: Always consult with healthcare professionals before making significant changes to your training or nutrition.
```

### Experimental Entry Example

```
[Base response about experimental protocol]

---
📚 Evidence Information:
🔬 Experimental - This is emerging research, use with caution.
🟡 Evidence Level: Moderate Evidence
🟡 Consensus: Moderate
🟡 Source Quality: 60%
📋 Source: Experimental Protocol

⚠️ Disclaimer: Always consult with healthcare professionals before making significant changes to your training or nutrition.
```

---

## Governance Fields Explained

### Approval Status

- **`approved`** - Reviewed and approved for use
  - Shown by default in chatbot
  - Marked with ✅ League-Approved indicator

- **`pending`** - Awaiting review
  - Not shown by default
  - Can be included with `includeExperimental: true`
  - Marked with ⏳ Pending Review indicator

- **`experimental`** - Emerging research, use with caution
  - Not shown by default
  - Can be included with `includeExperimental: true`
  - Marked with 🔬 Experimental indicator

- **`rejected`** - Not suitable for use
  - Never shown in chatbot
  - Logged in governance log for audit trail

### Approval Level

- **`league`** - Official league guidelines
  - Highest authority level
  - Typically from official sports organizations

- **`coach`** - Coach-reviewed protocol
  - Reviewed by qualified coaches
  - Practical, field-tested protocols

- **`research`** - Research-based
  - Based on peer-reviewed research
  - Most common approval level

- **`experimental`** - Experimental protocol
  - Emerging research
  - Requires caution

### Source Quality Score

Calculated automatically based on:

- **Evidence Level** (A=1.0, B=0.75, C=0.5, D=0.25)
- **Impact Factor** (+0.1 if > 5)
- **Sample Size** (+0.1 if > 100)
- **Study Type** (+0.15 for meta-analysis/systematic review)

Score range: 0.0 (lowest) to 1.0 (highest)

---

## Database Queries

### Search with Governance Filters

```sql
SELECT kbe.*
FROM knowledge_base_entries kbe
WHERE
  (kbe.answer ILIKE '%query%' OR kbe.topic ILIKE '%query%')
  AND kbe.approval_status = 'approved'
  AND (kbe.source_quality_score IS NULL OR kbe.source_quality_score >= 0.3)
ORDER BY
  kbe.approval_status = 'approved' DESC,
  kbe.source_quality_score DESC NULLS LAST,
  kbe.evidence_strength DESC
LIMIT 5;
```

### Calculate Quality Score

```sql
SELECT calculate_source_quality_score(entry_id);
```

### Log Governance Action

```sql
SELECT log_governance_action(
  entry_id,
  'approved',
  user_id,
  'Approved based on strong evidence',
  'approved',
  'research'
);
```

---

## Configuration

### Default Filters

The chatbot uses these default filters:

```javascript
{
  requireApproval: true,      // Only approved entries
  includeExperimental: false, // Exclude experimental
  minQualityScore: 0.3        // Minimum 30% quality
}
```

### Adjusting Filters

To show experimental entries:

```javascript
knowledgeBaseService.searchKnowledgeBase(query, category, {
  requireApproval: true,
  includeExperimental: true, // Include experimental
  minQualityScore: 0.0,
});
```

To show all entries (including pending):

```javascript
knowledgeBaseService.searchKnowledgeBase(query, category, {
  requireApproval: false, // Show all statuses
  includeExperimental: true,
  minQualityScore: 0.0,
});
```

---

## Admin Functions

### Approve Entry

```sql
UPDATE knowledge_base_entries
SET
  approval_status = 'approved',
  approval_level = 'research',
  approved_by = 'user_id',
  approved_at = NOW(),
  approval_notes = 'Approved based on strong evidence'
WHERE id = 'entry_id';

-- Log the action
SELECT log_governance_action(
  'entry_id',
  'approved',
  'user_id',
  'Approved based on strong evidence',
  'approved',
  'research'
);
```

### Reject Entry

```sql
UPDATE knowledge_base_entries
SET
  approval_status = 'rejected',
  approved_by = 'user_id',
  approved_at = NOW(),
  approval_notes = 'Rejected: Insufficient evidence'
WHERE id = 'entry_id';

-- Log the action
SELECT log_governance_action(
  'entry_id',
  'rejected',
  'user_id',
  'Rejected: Insufficient evidence',
  'rejected',
  NULL
);
```

### Mark as Experimental

```sql
UPDATE knowledge_base_entries
SET
  approval_status = 'experimental',
  approval_level = 'experimental',
  approved_by = 'user_id',
  approved_at = NOW(),
  approval_notes = 'Emerging research, use with caution'
WHERE id = 'entry_id';

-- Log the action
SELECT log_governance_action(
  'entry_id',
  'experimental',
  'user_id',
  'Emerging research, use with caution',
  'experimental',
  'experimental'
);
```

---

## Testing Checklist

### Governance Filtering

- [ ] Only approved entries shown by default
- [ ] Experimental entries excluded by default
- [ ] Quality score filter works correctly
- [ ] Pending entries not shown by default
- [ ] Rejected entries never shown

### Evidence Indicators

- [ ] Approval status displays correctly
- [ ] Evidence level displays correctly
- [ ] Quality score displays correctly
- [ ] Consensus level displays correctly
- [ ] Approval level displays correctly
- [ ] Indicators only shown for knowledge base entries

### Quality Score Calculation

- [ ] Quality score calculated from evidence level
- [ ] Impact factor bonus applied correctly
- [ ] Sample size bonus applied correctly
- [ ] Study type bonus applied correctly
- [ ] Score capped at 1.0

### Governance Logging

- [ ] Approval actions logged
- [ ] Rejection actions logged
- [ ] Status changes tracked
- [ ] Performer tracked correctly

---

## Future Enhancements

Potential improvements:

1. **Admin UI** - Web interface for approving/rejecting entries
2. **Bulk Operations** - Approve/reject multiple entries at once
3. **Quality Score Manual Override** - Allow manual quality score adjustment
4. **Review Queue** - Dashboard showing pending entries
5. **Approval Workflow** - Multi-step approval process
6. **Quality Metrics Dashboard** - Analytics on knowledge base quality
7. **Auto-Approval Rules** - Auto-approve entries meeting criteria
8. **Version History** - Track changes to entries over time

---

## Files Created/Modified

### New Files

- `database/migrations/040_knowledge_base_governance.sql`

### Modified Files

- `src/js/services/knowledge-base-service.js` - Added governance options
- `src/js/utils/response-enhancer.js` - Added evidence indicators
- `netlify/functions/knowledge-search.cjs` - Added governance filters
- `src/api-config.js` - Updated to pass options parameter
- `src/js/components/chatbot.js` - Uses governance filters

---

## Database Migration

To apply the governance changes:

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i database/migrations/040_knowledge_base_governance.sql
```

Or using a migration tool:

```bash
psql $DATABASE_URL -f database/migrations/040_knowledge_base_governance.sql
```

**Note:** The migration will:

- Set existing entries with strong evidence to 'approved'
- Set entries with moderate evidence to 'pending'
- Set other entries to 'experimental'
- Calculate quality scores for all entries with supporting articles

---

## Support

If you encounter issues:

1. Check database migration ran successfully
2. Verify governance fields exist on `knowledge_base_entries` table
3. Check API endpoint logs for filter errors
4. Verify quality scores are calculated correctly
5. Check governance log table for audit trail

---

**Status**: ✅ Ready for Testing
**Last Updated**: 2025-01-XX
