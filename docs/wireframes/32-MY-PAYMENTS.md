# Wireframe: My Payments (Player View)

**Route:** `/payments`  
**Users:** Players (view their dues, payment history)  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §47

---

## Purpose

Allows players to view their current balance, see what fees are owed, track payment history, and understand cost breakdowns for tournaments and team events.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  💳 My Payments                                                                │  │
│  │     View your team dues and payment history                                   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               ACCOUNT SUMMARY                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                                                                          │ │  │
│  │  │                       CURRENT BALANCE                                    │ │  │
│  │  │                                                                          │ │  │
│  │  │                          $165.00                                         │ │  │
│  │  │                           owed                                           │ │  │
│  │  │                                                                          │ │  │
│  │  │                    ━━━━━━━━━━━━━━━━━━━━                                  │ │  │
│  │  │                                                                          │ │  │
│  │  │  Total Paid This Season: $320.00                                        │ │  │
│  │  │  Upcoming Dues: 2 items                                                 │ │  │
│  │  │                                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 💰 Total Owed   │  │ ✅ Total Paid   │  │ 🔴 Overdue      │  │ 📅 Due Soon     │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │    $165.00      │  │    $320.00      │  │    $0.00        │  │    $85.00       │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  2 items        │  │  This season    │  │  None! 🎉       │  │  Due in 5 days  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              OUTSTANDING FEES                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🔴 DUE IN 5 DAYS                                                        │  │  │
│  │  │ ─────────────────────────────────────────────────────────────────────── │  │  │
│  │  │                                                                         │  │  │
│  │  │  🏆 Spring Championship Tournament                                      │  │  │
│  │  │                                                                         │  │  │
│  │  │  Base Fee:                                           $85.00             │  │  │
│  │  │  Guest Fee (1 guest × $45):                          $45.00             │  │  │
│  │  │  ─────────────────────────────────────────────────────────────          │  │  │
│  │  │  Total Due:                                         $130.00             │  │  │
│  │  │                                                                         │  │  │
│  │  │  Due Date: January 10, 2026                                             │  │  │
│  │  │                                                                         │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────────────┐   │  │  │
│  │  │  │ 💡 Cost Breakdown                                                │   │  │  │
│  │  │  │ • Registration: $40                                              │   │  │  │
│  │  │  │ • Team tent rental: $15                                          │   │  │  │
│  │  │  │ • Snacks/water: $20                                              │   │  │  │
│  │  │  │ • Photographer: $10                                              │   │  │  │
│  │  │  └──────────────────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                                         │  │  │
│  │  │  Payment Methods:                                                       │  │  │
│  │  │  • Venmo: @TeamTreasurer                                                │  │  │
│  │  │  • Zelle: treasurer@team.com                                            │  │  │
│  │  │  • Cash: Give to Jake at practice                                       │  │  │
│  │  │                                                                         │  │  │
│  │  │                                                 [View Tournament →]    │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🟡 DUE IN 25 DAYS                                                       │  │  │
│  │  │ ─────────────────────────────────────────────────────────────────────── │  │  │
│  │  │                                                                         │  │  │
│  │  │  📋 February Team Dues                                                  │  │  │
│  │  │                                                                         │  │  │
│  │  │  Monthly Dues:                                       $35.00             │  │  │
│  │  │                                                                         │  │  │
│  │  │  Due Date: February 1, 2026                                             │  │  │
│  │  │                                                                         │  │  │
│  │  │  💡 Covers: Field rental, equipment, coaching fees                      │  │  │
│  │  │                                                                         │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              PAYMENT HISTORY                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Date        │ Description                    │ Amount   │ Status             │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  Dec 28      │ January Team Dues              │  $35.00  │ ✅ Paid            │  │
│  │  Dec 15      │ Winter League Entry            │  $120.00 │ ✅ Paid            │  │
│  │  Dec 1       │ December Team Dues             │  $35.00  │ ✅ Paid            │  │
│  │  Nov 15      │ Team Jersey                    │  $65.00  │ ✅ Paid            │  │
│  │  Nov 1       │ November Team Dues             │  $35.00  │ ✅ Paid            │  │
│  │  Oct 1       │ Fall Season Registration       │  $30.00  │ ✅ Paid            │  │
│  │                                                                                │  │
│  │                                                          [View All →]         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              SEASON SUMMARY                                          │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 2025-2026 Season                                                            │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌────────────────────────────┐  ┌────────────────────────────┐               │  │
│  │  │ Category         │ Amount │  │ Payment Status             │               │  │
│  │  │──────────────────│────────│  │                            │               │  │
│  │  │ Team Dues        │ $175.00│  │  ████████████████░░ 85%    │               │  │
│  │  │ Tournament Fees  │ $205.00│  │                            │               │  │
│  │  │ Equipment        │ $65.00 │  │  Paid: $320 / $485 total   │               │  │
│  │  │ Registration     │ $30.00 │  │  Remaining: $165           │               │  │
│  │  │ Other            │ $10.00 │  │                            │               │  │
│  │  │──────────────────│────────│  └────────────────────────────┘               │  │
│  │  │ TOTAL            │ $485.00│                                               │  │
│  │  └────────────────────────────┘                                               │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Fee Types

| Type | Icon | Examples |
|------|------|----------|
| Team Dues | 📋 | Monthly/seasonal dues |
| Tournament Fee | 🏆 | Tournament entry + costs |
| Equipment | 🎽 | Jersey, gear |
| Travel | ✈️ | Hotel, flights |
| Team Event | 🎉 | Team dinner |
| Registration | 📝 | Season signup |

---

## Payment Status

| Status | Color | Description |
|--------|-------|-------------|
| Paid | 🟢 Green | Fully paid |
| Partial | 🟡 Yellow | Partially paid |
| Unpaid | ⚪ Gray | Not yet due |
| Due Soon | 🟠 Orange | Due within 7 days |
| Overdue | 🔴 Red | Past due date |

---

## Features to Implement

| Feature | Status | Priority |
|---------|--------|----------|
| Account Balance Summary | ❌ | HIGH |
| Outstanding Fees List | ❌ | HIGH |
| Cost Breakdown | ❌ | MEDIUM |
| Payment Instructions | ❌ | HIGH |
| Payment History | ❌ | MEDIUM |
| Season Summary | ❌ | LOW |
| Guest Fee Calculation | ❌ | MEDIUM |
| Overdue Alerts | ❌ | MEDIUM |
| Link to Events | ❌ | LOW |

---

## Guest Fee Calculation

```typescript
// When player RSVPs with guests
function calculatePlayerCost(fee: Fee, guestCount: number): PlayerCost {
  const baseCost = fee.amount;
  const guestCost = (fee.guestFee || 0) * guestCount;
  
  return {
    baseCost,
    guestCost,
    totalCost: baseCost + guestCost
  };
}
```

---

## Data Sources

| Data | Service | Table |
|------|---------|-------|
| Fees | `PaymentService` | `team_fees` |
| Player balance | `PaymentService` | `player_balances` |
| Payments | `PaymentService` | `payments` |
| RSVP (for guests) | `CalendarService` | `event_rsvps` |

---

## Related Pages

| Page | Route | Relationship |
|------|-------|--------------|
| Team Calendar | `/calendar` | Event fees |
| Tournaments | `/tournaments` | Tournament costs |
| Settings | `/settings` | Payment preferences |
