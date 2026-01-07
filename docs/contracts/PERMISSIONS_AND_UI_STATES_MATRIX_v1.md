# Permissions and UI States Matrix — v1

**Contract Version:** 1.0  
**Date:** 2026-01-29  
**Status:** Normative (Binding)  
**Scope:** Exact permissions and UI states for all staff roles  
**Maintained By:** Product Architecture + Engineering

---

## SECTION 1 — Read Permissions Matrix

### 1.1 Data Category Permissions

| Data Category | Head Coach | Physio | S&C | Nutrition | Psych | Assistant Coach |
|---------------|------------|--------|-----|-----------|-------|-----------------|
| **Compliance Data** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Readiness Score** | ⚠️ Opt-in | ✅ Full | ⚠️ Opt-in | ⚠️ Opt-in | ✅ Full | ⚠️ Opt-in |
| **Wellness Answers** | ⚠️ Opt-in | ✅ Full | ⚠️ Opt-in | ⚠️ Opt-in | ✅ Full | ❌ No |
| **Pain Detail** | ⚠️ Safety only | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No |
| **Load Metrics** | ✅ Summary | ✅ Summary | ✅ Full | ✅ Summary | ✅ Summary | ✅ Summary |
| **Medical Status** | ✅ Summary | ✅ Full | ✅ Summary | ❌ No | ❌ No | ✅ Summary |
| **Rehab Protocols** | ✅ Active only | ✅ Full | ✅ Constraints | ❌ No | ❌ No | ✅ Active only |
| **Nutrition Data** | ❌ No | ❌ No | ❌ No | ✅ Full | ❌ No | ❌ No |
| **Mental Readiness** | ⚠️ Opt-in | ❌ No | ❌ No | ❌ No | ✅ Full | ⚠️ Opt-in |
| **Decision Ledger** | ✅ Full | ✅ Domain only | ✅ Domain only | ✅ Domain only | ✅ Domain only | ✅ Read-only |

**Legend:**
- ✅ **Full** — Complete access
- ⚠️ **Opt-in** — Requires athlete consent
- ✅ **Summary** — Summary/aggregate data only
- ✅ **Active only** — Active protocols/restrictions only
- ✅ **Constraints** — Constraints only, not full protocol
- ✅ **Safety only** — Safety flags only, not detail
- ✅ **Domain only** — Own domain decisions only
- ✅ **Read-only** — Can view, cannot create
- ❌ **No** — No access

### 1.2 Read Permission UI States

**State 1: Full Access**
- Data displayed: Complete data
- Badge: None (normal display)
- Tooltip: None
- Icon: None

**State 2: Opt-in Required**
- Data displayed: Partial data (compliance only)
- Badge: ⚠️ "Consent Required"
- Tooltip: "Athlete consent required to view full data"
- Icon: ⚠️ Warning icon

**State 3: Summary Only**
- Data displayed: Summary/aggregate data
- Badge: ℹ️ "Summary"
- Tooltip: "Showing summary data only"
- Icon: ℹ️ Info icon

**State 4: Safety Override**
- Data displayed: Safety flags only
- Badge: 🔴 "Safety Override"
- Tooltip: "Showing safety flags only (medical detail hidden)"
- Icon: 🔴 Safety icon

**State 5: No Access**
- Data displayed: "Data not available"
- Badge: 🔒 "Restricted"
- Tooltip: "You do not have permission to view this data"
- Icon: 🔒 Lock icon

---

## SECTION 2 — Write Permissions Matrix

### 2.1 Action Permissions

| Action | Head Coach | Physio | S&C | Nutrition | Psych | Assistant Coach |
|--------|------------|--------|-----|-----------|-------|-----------------|
| **Modify Sessions** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes (tactical only) |
| **Assign Programs** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Set Rehab Protocols** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Set Load Constraints** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Set Nutrition Plans** | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Set Mental Protocols** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Override ACWR** | ✅ Yes (with acknowledgment) | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Override Rehab** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Log Decisions** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Resolve Conflicts** | ✅ Yes (all) | ✅ Yes (medical) | ✅ Yes (load) | ✅ Yes (nutrition) | ✅ Yes (mental) | ❌ No |
| **Escalate Issues** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Legend:**
- ✅ **Yes** — Action allowed
- ✅ **Yes (with acknowledgment)** — Action allowed but requires acknowledgment
- ✅ **Yes (domain)** — Action allowed for own domain only
- ✅ **Yes (all)** — Action allowed for all domains
- ❌ **No** — Action not allowed

### 2.2 Write Permission UI States

**State 1: Allowed Action**
- Button: Enabled, primary color
- Tooltip: None (action is allowed)
- Icon: Standard action icon
- Badge: None

**State 2: Requires Consent**
- Button: Enabled, but with ⚠️ warning icon
- Tooltip: "Athlete consent required. Some data may be hidden."
- Icon: ⚠️ Warning icon
- Badge: ⚠️ "Consent Required"

**State 3: Requires Acknowledgment**
- Button: Enabled, but opens acknowledgment dialog first
- Tooltip: "This action requires acknowledgment of risks."
- Icon: ℹ️ Info icon
- Badge: ℹ️ "Acknowledgment Required"

**State 4: Blocked Action**
- Button: Disabled, grayed out
- Tooltip: "This action is not permitted for your role."
- Icon: 🔒 Lock icon
- Badge: 🔒 "Restricted"

**State 5: Escalation Required**
- Button: Enabled, but opens escalation dialog first
- Tooltip: "This action requires escalation to [Role]."
- Icon: ⬆️ Escalation icon
- Badge: ⬆️ "Escalation Required"

**State 6: Domain-Specific**
- Button: Enabled, but only for own domain
- Tooltip: "This action is only available for your domain."
- Icon: 🎯 Domain icon
- Badge: 🎯 "Domain Only"

---

## SECTION 3 — Session Modification Permissions

### 3.1 Session State Permissions

| Session State | Head Coach | Assistant Coach | Physio | S&C | Nutrition | Psych |
|---------------|------------|-----------------|--------|-----|-----------|-------|
| **PLANNED** | ✅ Modify | ✅ Modify (tactical) | ❌ No | ❌ No | ❌ No | ❌ No |
| **GENERATED** | ✅ Modify | ✅ Modify (tactical) | ❌ No | ❌ No | ❌ No | ❌ No |
| **VISIBLE** | ✅ Modify | ✅ Modify (tactical) | ❌ No | ❌ No | ❌ No | ❌ No |
| **IN_PROGRESS** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **COMPLETED** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **LOCKED** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

### 3.2 Session Modification UI States

**State 1: Can Modify**
- Button: "Modify Session" (enabled)
- Tooltip: None
- Icon: ✏️ Edit icon
- Badge: None

**State 2: Cannot Modify (State)**
- Button: "Modify Session" (disabled)
- Tooltip: "Cannot modify session in [STATE] state"
- Icon: 🔒 Lock icon
- Badge: 🔒 "Locked"

**State 3: Cannot Modify (Role)**
- Button: "Modify Session" (disabled)
- Tooltip: "This action is not permitted for your role"
- Icon: 🔒 Lock icon
- Badge: 🔒 "Restricted"

**State 4: Requires Acknowledgment**
- Button: "Modify Session" (enabled, opens dialog)
- Tooltip: "This modification requires acknowledgment"
- Icon: ⚠️ Warning icon
- Badge: ⚠️ "Acknowledgment Required"

**State 5: Conflict Detected**
- Button: "Modify Session" (disabled)
- Tooltip: "Session was modified by [Coach] at [Time]"
- Icon: ⚠️ Conflict icon
- Badge: ⚠️ "Conflict"

---

## SECTION 4 — Escalation Permissions

### 4.1 Escalation Authority

| Escalation Type | Head Coach | Physio | S&C | Nutrition | Psych | Assistant Coach |
|-----------------|------------|--------|-----|-----------|-------|-----------------|
| **Medical Safety** | ✅ View | ✅ Respond | ✅ View | ❌ No | ❌ No | ❌ No |
| **Load Safety** | ✅ View | ✅ View | ✅ Respond | ❌ No | ❌ No | ❌ No |
| **Compliance** | ✅ Respond | ✅ View | ✅ View | ✅ View | ✅ View | ✅ View |
| **Nutrition** | ✅ View | ❌ No | ❌ No | ✅ Respond | ❌ No | ❌ No |
| **Mental** | ✅ View | ❌ No | ❌ No | ❌ No | ✅ Respond | ✅ View |

### 4.2 Escalation UI States

**State 1: Can Respond**
- Button: "Respond" (enabled)
- Tooltip: None
- Icon: ✅ Respond icon
- Badge: None
- Timer: Countdown to deadline

**State 2: Can View**
- Button: "View Details" (enabled)
- Tooltip: "You can view but not respond"
- Icon: 👁️ View icon
- Badge: 👁️ "View Only"
- Timer: None

**State 3: Cannot Access**
- Button: "View Details" (disabled)
- Tooltip: "You do not have permission to view this escalation"
- Icon: 🔒 Lock icon
- Badge: 🔒 "Restricted"
- Timer: None

**State 4: Overdue**
- Button: "Respond" (enabled, urgent)
- Tooltip: "Response overdue by [X] hours"
- Icon: 🔴 Urgent icon
- Badge: 🔴 "OVERDUE"
- Timer: Shows hours overdue

---

## SECTION 5 — Conflict Resolution Permissions

### 5.1 Conflict Resolution Authority

| Conflict Type | Head Coach | Physio | S&C | Nutrition | Psych | Assistant Coach |
|---------------|------------|--------|-----|-----------|-------|-----------------|
| **Domain Override** | ✅ Resolve (all) | ✅ Resolve (medical) | ✅ Resolve (load) | ✅ Resolve (nutrition) | ✅ Resolve (mental) | ❌ No |
| **Simultaneous Modification** | ✅ Resolve | ✅ View | ✅ View | ❌ No | ❌ No | ✅ View |
| **Constraint Violation** | ✅ Resolve | ✅ Resolve (medical) | ✅ Resolve (load) | ✅ Resolve (nutrition) | ✅ Resolve (mental) | ❌ No |
| **Schedule Conflict** | ✅ Resolve | ✅ View | ✅ View | ❌ No | ❌ No | ✅ View |
| **Decision Conflict** | ✅ Resolve | ✅ Resolve (medical) | ✅ Resolve (load) | ✅ Resolve (nutrition) | ✅ Resolve (mental) | ❌ No |

### 5.2 Conflict Resolution UI States

**State 1: Can Resolve**
- Button: "Resolve Conflict" (enabled)
- Tooltip: None
- Icon: ✅ Resolve icon
- Badge: None

**State 2: Can View**
- Button: "View Conflict" (enabled)
- Tooltip: "You can view but not resolve"
- Icon: 👁️ View icon
- Badge: 👁️ "View Only"

**State 3: Cannot Access**
- Button: "View Conflict" (disabled)
- Tooltip: "You do not have permission to view this conflict"
- Icon: 🔒 Lock icon
- Badge: 🔒 "Restricted"

**State 4: Escalation Required**
- Button: "Escalate" (enabled)
- Tooltip: "This conflict requires escalation"
- Icon: ⬆️ Escalation icon
- Badge: ⬆️ "Escalation Required"

---

## SECTION 6 — Decision Ledger Permissions

### 6.1 Decision Ledger Access

| Action | Head Coach | Physio | S&C | Nutrition | Psych | Assistant Coach |
|--------|------------|--------|-----|-----------|-------|-----------------|
| **Create Decision** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Own Decisions** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Domain Decisions** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View All Decisions** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Review Decisions** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Supersede Decisions** | ✅ Yes | ✅ Yes (own domain) | ✅ Yes (own domain) | ✅ Yes (own domain) | ✅ Yes (own domain) | ❌ No |

### 6.2 Decision Ledger UI States

**State 1: Can Create**
- Button: "Create Decision" (enabled)
- Tooltip: None
- Icon: ➕ Create icon
- Badge: None

**State 2: Can View**
- Button: "View Decision" (enabled)
- Tooltip: None
- Icon: 👁️ View icon
- Badge: None

**State 3: Can Review**
- Button: "Review Decision" (enabled)
- Tooltip: "Review due on [DATE]"
- Icon: ✅ Review icon
- Badge: ⏰ "Review Due"

**State 4: Can Supersede**
- Button: "Supersede Decision" (enabled)
- Tooltip: "This will supersede the existing decision"
- Icon: 🔄 Supersede icon
- Badge: 🔄 "Supersede"

**State 5: Cannot Access**
- Button: "View Decision" (disabled)
- Tooltip: "You do not have permission to view this decision"
- Icon: 🔒 Lock icon
- Badge: 🔒 "Restricted"

---

## SECTION 7 — UI State Implementation

### 7.1 State Machine

```typescript
enum PermissionState {
  ALLOWED = 'allowed',
  REQUIRES_CONSENT = 'requires_consent',
  REQUIRES_ACKNOWLEDGMENT = 'requires_acknowledgment',
  BLOCKED = 'blocked',
  ESCALATION_REQUIRED = 'escalation_required',
  DOMAIN_SPECIFIC = 'domain_specific',
  CONFLICT_DETECTED = 'conflict_detected',
  OVERDUE = 'overdue',
  VIEW_ONLY = 'view_only',
  RESTRICTED = 'restricted'
}
```

### 7.2 State Transitions

```
ALLOWED → REQUIRES_ACKNOWLEDGMENT (if risk threshold exceeded)
ALLOWED → BLOCKED (if session state changes)
ALLOWED → CONFLICT_DETECTED (if simultaneous modification)
REQUIRES_CONSENT → ALLOWED (if consent granted)
REQUIRES_ACKNOWLEDGMENT → ALLOWED (if acknowledged)
ESCALATION_REQUIRED → ALLOWED (if escalation approved)
```

### 7.3 UI Component Props

```typescript
interface PermissionAwareButtonProps {
  action: string;
  currentRole: StaffRole;
  targetResource: Resource;
  permissionState: PermissionState;
  onAction: () => void;
  onEscalate?: () => void;
  onAcknowledge?: () => void;
}
```

---

## SECTION 8 — Implementation Requirements

### 8.1 Permission Check Function

```typescript
function checkPermission(
  role: StaffRole,
  action: string,
  resource: Resource,
  context: PermissionContext
): PermissionState {
  // Check role permissions
  // Check resource state
  // Check constraints
  // Check conflicts
  // Return permission state
}
```

### 8.2 UI Component Requirements

- All action buttons must check permissions before rendering
- Permission states must be visually distinct
- Tooltips must explain why action is blocked/allowed
- Icons must match permission state
- Badges must be clear and informative

### 8.3 Real-Time Updates

- Permission states update in real-time via WebSocket
- UI reflects permission changes immediately
- Conflicts update permission states automatically

---

## End of Document

**This matrix is law. Permission implementations that deviate are system failures.**

