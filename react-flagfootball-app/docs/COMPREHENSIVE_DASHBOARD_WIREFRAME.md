# Comprehensive Dashboard Wireframe Documentation

## Overview
The FlagFit Pro Training App features dual dashboard systems: one optimized for **Players** with position-specific customization, and another for **Coaches** with team management capabilities. Both dashboards support the Olympic 5v5 flag football format with comprehensive stats tracking, privacy controls, and team chemistry management.

## Technical Specifications

### Flag Football Context
- **Format**: Olympic 5v5 (5 players per side)
- **Field**: 70 yards total (50 yards + 2 endzones of 10 yards each), 25 yards wide
- **Rules**: 4 downs to midfield, 4 downs to endzone, rushing allowed
- **Target Pressure Time**: 2.5 seconds for blitzers
- **Age Restriction**: 18+ only (no youth leagues)

### User Roles & Access
- **Players**: Individual performance tracking, position-specific training
- **Coaches**: HC, OC, DC, Video Analysts (all can input stats)
- **Privacy**: Individual stats visible only to player and their coaches

## Player Dashboard Wireframe

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] MERLINS PLAYBOOK                    [Theme Toggle] [Avatar Menu]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📨 "Coach AJ just posted stats against Eagles. Check how you did!"  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Welcome back, Alex Rivera! 🏈 Position: QB/WR                     │   │
│  │  Next Practice: Tomorrow 7:00 PM vs Eagles Preparation              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Physical Profile & Universal Rankings                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │   Height    │ │   Weight    │ │  40-Yard    │ │     BMI     │  │   │
│  │  │    6'2"     │ │   185 lbs   │ │  Dash: 4.6s │ │    22.4     │  │   │
│  │  │ 78th %tile  │ │ 65th %tile  │ │ 42nd %tile  │ │ 71st %tile  │  │   │
│  │  │#2,234/10,001│ │#3,501/10,001│ │#5,801/10,001│ │#2,901/10,001│  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  │                                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐                                   │   │
│  │  │ Muscle Mass │ │Coach Rating │                                   │   │
│  │  │    42.3%    │ │   8.5/10    │                                   │   │
│  │  │ 89th %tile  │ │ 76th %tile  │                                   │   │
│  │  │#1,101/10,001│ │#2,401/10,001│                                   │   │
│  │  └─────────────┘ └─────────────┘                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Personal Game Stats (Private - Only You Can See)                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Latest Game vs Eagles                                       │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │   │
│  │  │ Primary Position (QB): 12/18 completions, 156 yards, 2 TDs │   │   │
│  │  │ Secondary Position (WR): 3/4 catches, 45 yards, 1 TD       │   │   │
│  │  │                                                             │   │   │
│  │  │ 💬 Coach Comment: "Great pocket presence in 4th quarter.   │   │   │
│  │  │    Work on intermediate timing routes."                    │   │   │
│  │  │                                                             │   │   │
│  │  │ 🤖 AI Insight: "Your completion rate improves 15% when     │   │   │
│  │  │    targeting crossing routes vs comeback routes."          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Season Combined Stats                                       │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │   │
│  │  │ Total Games: 8 │ Combined TDs: 10 │ Total Yards: 712       │   │   │
│  │  │ QB: 45/67 (67%)│ WR: 12/18 (67%) │ Turnovers: 3           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Position-Specific Training Focus (QB Primary)                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Current Focus Areas:                                                │   │
│  │  • Pocket Presence: Your decision time is 0.3s slower than elite   │   │
│  │  • Red Zone Efficiency: 67% success rate (target: 75%)             │   │
│  │  • Intermediate Routes: Timing needs improvement                    │   │
│  │                                                                     │   │
│  │  📈 This Week's Improvement: +12% accuracy on crossing patterns    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Team Chemistry Ratings                                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Your Chemistry with Teammates:                                     │   │
│  │  • Mike Johnson (WR): 8.3/10 (Communication, Timing, Trust)        │   │
│  │  • Chris Wilson (Center): 8.0/10 (Snap timing, Protection calls)   │   │
│  │  • Tyler Brown (DB): 7.5/10 (Practice intensity, Leadership)       │   │
│  │                                                                     │   │
│  │  ⚠️ Note: Players below 6.0 average face roster review              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Weekly Training Schedule                                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │   │
│  │  │ SUN │ │ MON │ │ TUE │ │ WED │ │ THU │ │ FRI │ │ SAT │          │   │
│  │  │Rest │ │ ✅  │ │ ✅  │ │ [ ] │ │ [ ] │ │ [ ] │ │Game │          │   │
│  │  │     │ │19:00│ │19:00│ │18:30│ │19:00│ │20:00│ │     │          │   │
│  │  │     │ │Team │ │Pos  │ │Cond │ │Team │ │Film │ │vs   │          │   │
│  │  │     │ │Prac │ │Work │ │     │ │Prac │ │Room │ │Eagles│         │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Quick Actions                                                       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │  │ Start   │ │ View    │ │ Team    │ │ Rate    │ │ Public  │      │   │
│  │  │Training │ │Playbook │ │ Chat    │ │Chemistry│ │Rankings │      │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Coach Dashboard Wireframe

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] MERLINS PLAYBOOK - COACH VIEW      [Theme Toggle] [Avatar Menu]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Coach Dashboard - Team: Hawks                    Next Game: Eagles  │   │
│  │  Active Roster: 23 Players │ Games Played: 8 │ Record: 6-2         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Team Status Overview                                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────┐ │   │
│  │  │   Player Health     │ │  Training Progress  │ │ Chemistry Alert │ │   │
│  │  │  ⚠️ 3 Injured       │ │  📈 18 On Track     │ │ ⚠️ 2 Below 6.0  │ │   │
│  │  │  🟡 2 Limited       │ │  ⚠️ 3 Behind        │ │ 🟢 21 Good      │ │   │
│  │  │  ✅ 18 Ready        │ │  🔥 2 Exceeding     │ │ Average: 7.8    │ │   │
│  │  └─────────────────────┘ └─────────────────────┘ └─────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Quick Stats Entry                                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Last Game vs Wolves - Drive 3 - 2nd & Goal                        │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Player Search: [Alex Rivera__________] 🔍                   │   │   │
│  │  │ Position: QB ▼ │ Down: 2nd ▼ │ Distance: Goal ▼           │   │   │
│  │  │                                                             │   │   │
│  │  │ ☑️ TD Pass      ☑️ 12 Yards    ☐ Interception             │   │   │
│  │  │ Target: Mike Johnson (WR) ▼                                │   │   │
│  │  │ ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │ │ Comment: "Perfect timing on back shoulder throw"    │   │   │   │
│  │  │ └─────────────────────────────────────────────────────┘   │   │   │
│  │  │ [Log Stat] [Next Play] [Finish Game]                       │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Player Performance Matrix                                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Position: QB                                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Player         │ Coach Standard  │ Current   │ Progress │ Pos │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │
│  │  │ Alex Rivera    │ 70% Completion  │ 67% ⚠️    │ -2%     │P/S  │   │
│  │  │ Tyler Smith    │ 70% Completion  │ 73% ✅    │ +5%     │ P  │   │
│  │  │ Mike Wilson    │ 70% Completion  │ 65% ⚠️    │ -3%     │ S  │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  Position: WR                                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Player         │ Coach Standard  │ Current   │ Progress │ Pos │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │
│  │  │ Mike Johnson   │ 80% Catch Rate  │ 85% 🔥    │ +8%     │ P  │   │
│  │  │ Chris Brown    │ 80% Catch Rate  │ 77% ⚠️    │ -1%     │P/S  │   │
│  │  │ Alex Rivera    │ 75% Catch Rate  │ 67% ⚠️    │ -4%     │ S  │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │  P=Primary, S=Secondary Position                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Custom Stats Configuration                                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Position: Center - Custom Stats Selection                   │   │   │
│  │  ├─────────────────────────────────────────────────────────────┤   │
│  │  │ ☑️ Catches      ☑️ Targets      ☑️ Snap Accuracy          │   │   │
│  │  │ ☑️ Rec Yards    ☑️ Speed Rating ☐ YAC                     │   │   │
│  │  │ ☑️ TDs          ☑️ QB Rating    ☐ Contested Catches       │   │   │
│  │  │ ☑️ Drops        ☑️ Route Precision                         │   │   │
│  │  │                                                             │   │   │
│  │  │ [Save Config] [Apply to All Centers] [Reset Defaults]      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Team Communication Hub                                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ [BROADCAST] New Message to Team                             │   │   │
│  │  │ ┌─────────────────────────────────────────────────────────┐ │   │   │
│  │  │ │ "Great win against Wolves! Focus areas for Eagles:     │ │   │   │
│  │  │ │ QBs: Work on red zone efficiency this week             │ │   │   │
│  │  │ │ WRs: Practice back shoulder catches                    │ │   │   │
│  │  │ │ Defense: Emphasis on coverage communication"           │ │   │   │
│  │  │ └─────────────────────────────────────────────────────────┘ │   │   │
│  │  │                                                             │   │   │
│  │  │ Target: ☑️ All Players ☐ QBs Only ☐ WRs Only ☐ Defense   │   │   │
│  │  │ [Send to Selected] [Schedule for Later] [Save Draft]       │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Pre-Game Team Goals Setup                                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  vs Eagles - Game Objectives:                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Offensive Goals:          │ Defensive Goals:                │   │   │
│  │  │ • 5 Total Touchdowns      │ • 3 Defensive Stops            │   │   │
│  │  │ • 300+ Total Yards        │ • 2 Sacks                      │   │   │
│  │  │ • <2 Turnovers           │ • 1 Interception               │   │   │
│  │  │ • 65%+ 3rd Down Conv     │ • Hold to <20 points           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │  [Set Goals] [Share with Team] [Copy from Previous]                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AI Insights & Analytics                                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  🤖 Team Performance Insights:                                      │   │
│  │  • Alex Rivera's completion rate improves 12% when Mike runs crosses│   │
│  │  • Defense allows 23% fewer yards when Tyler plays safety          │   │
│  │  • Red zone efficiency drops 18% in 4th quarter - conditioning?    │   │
│  │  • Chris Brown drops 35% fewer passes on comeback vs slant routes  │   │
│  │                                                                     │   │
│  │  📊 Recommended Focus Areas:                                        │   │
│  │  • QB-WR chemistry drills for Alex-Mike connection                  │   │
│  │  │  • Fourth quarter conditioning emphasis                             │   │
│  │  • Route-specific practice for Chris Brown                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Position-Specific Dashboard Variations

### Quarterback Dashboard Focus
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  QB-Specific Metrics & Training                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Primary Metrics: Completion %, Passing Yards, TDs, INTs, Pocket Time      │
│  Training Modules: Footwork, Throwing Mechanics, Field Vision, Leadership  │
│  AI Focus: "Your accuracy improves 15% on 3-step drops vs 5-step drops"   │
│                                                                             │
│  Chemistry Ratings with:                                                    │
│  • Centers (Snap timing, Protection calls)                                 │
│  • Receivers (Route timing, Target accuracy)                               │
│  • Backs (Handoff timing, Check-down options)                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Wide Receiver Dashboard Focus
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WR-Specific Metrics & Training                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Primary Metrics: Catches, Targets, Catch %, Receiving Yards, TDs, Drops   │
│  Training Modules: Route Running, Hand-Eye Coordination, Speed Development  │
│  AI Focus: "You catch 23% more passes on crossing routes vs comebacks"     │
│                                                                             │
│  Route-Specific Performance:                                                │
│  • Slants: 89% success rate                                                │
│  • Crossings: 87% success rate                                             │
│  • Comebacks: 67% success rate ⚠️ (needs work)                            │
│  • Go Routes: 45% success rate                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Center Dashboard Focus
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Center-Specific Metrics & Training                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Combined Stats: All WR stats + Snap Accuracy + Speed Rating (from QB)     │
│  Training Modules: Snap Mechanics, Route Running, Communication, Blocking  │
│  AI Focus: "Your snap accuracy improves when you use wider stance"         │
│                                                                             │
│  Center-Specific Metrics:                                                   │
│  • Snap Accuracy: 94%                                                      │
│  • Speed Rating (QB feedback): 8.5/10                                      │
│  • Communication Rating: 9.2/10                                            │
│  • Route Precision: 78%                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Defensive Back Dashboard Focus
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DB-Specific Metrics & Training                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Primary Metrics: Passes Defended, INTs, Tackles, Coverage %, Breakups     │
│  Training Modules: Backpedal, Ball Skills, Hip Flexibility, Coverage       │
│  AI Focus: "Your INT rate increases 34% in man vs zone coverage"           │
│                                                                             │
│  Coverage Performance:                                                       │
│  • Man Coverage: 78% success rate                                          │
│  • Zone Coverage: 82% success rate                                         │
│  • Red Zone: 89% success rate                                              │
│  • Third Down: 76% success rate                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Shared Features & Public Elements

### Public Leaderboards (Visible to All)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Public League Rankings                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🏆 Touchdown Leaders          🛡️ Interception Leaders                      │
│  1. Mike Wilson (Dragons) - 23  1. Chris Johnson (Wolves) - 8              │
│  2. Alex Rivera (Hawks) - 21    2. Tyler Brown (Hawks) - 7                 │
│  3. James Smith (Eagles) - 19   3. Mike Davis (Eagles) - 6                 │
│                                                                             │
│  📊 Team Performance Rankings                                               │
│  • Hawks: 156 points for, 89 against (Record: 6-2)                        │
│  • Eagles: 142 points for, 95 against (Record: 5-3)                       │
│  • Dragons: 134 points for, 112 against (Record: 4-4)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Database Schema
```javascript
// Player Profile with Position Flexibility
const playerProfile = {
  userId: "string",
  primaryPosition: "QB|WR|CENTER|DB|S|BLITZER", 
  secondaryPositions: ["string"],
  physicalMetrics: {
    height: "number",
    weight: "number", 
    fortyYardDash: "number",
    bmi: "number",
    muscleMass: "number",
    universalRankings: {
      percentile: "number",
      rank: "number",
      total: "number",
      ageAdjusted: "boolean"
    }
  },
  gameStats: {
    primary: { position: "string", stats: {} },
    secondary: { position: "string", stats: {} },
    combined: { totalGames: "number", totalStats: {} }
  },
  chemistryRatings: [{
    withPlayer: "userId",
    rating: "number",
    categories: { communication: "number", timing: "number", trust: "number" }
  }],
  coachStandards: {
    [metric]: { target: "number", current: "number", progress: "number" }
  }
};

// Coach Dashboard Configuration
const coachConfig = {
  teamId: "string",
  coachRole: "HC|OC|DC|ANALYST",
  customStatsConfig: {
    [position]: {
      enabledStats: ["string"],
      customMetrics: [{ name: "string", type: "string" }],
      displayPriority: ["string"]
    }
  },
  teamGoals: {
    gameId: "string",
    offensiveGoals: ["string"],
    defensiveGoals: ["string"],
    shared: "boolean"
  }
};
```

### Access Control Logic
```javascript
const checkStatsAccess = (requestingUserId, statsOwnerId, userRole) => {
  // Players can only see their own detailed stats
  if (requestingUserId === statsOwnerId) {
    return { access: true, level: 'FULL_DETAIL' };
  }
  
  // Coaches can see summary data for their players
  if (userRole === 'COACH' && isCoachOfPlayer(requestingUserId, statsOwnerId)) {
    return { access: true, level: 'COACH_SUMMARY' };
  }
  
  // Public data (leaderboards only)
  return { access: true, level: 'PUBLIC_ONLY' };
};
```

### Position-Specific Logic
```javascript
const getPositionConfig = (position) => {
  const configs = {
    QB: {
      primaryStats: ['completions', 'attempts', 'passingYards', 'passingTDs', 'ints'],
      trainingFocus: ['pocketPresence', 'accuracy', 'fieldVision'],
      chemistryWith: ['WR', 'CENTER', 'BACKS']
    },
    CENTER: {
      primaryStats: ['catches', 'targets', 'receivingYards', 'snapAccuracy', 'speedRating'],
      trainingFocus: ['snapMechanics', 'routeRunning', 'communication'],
      specialMetrics: ['qbRating', 'snapConsistency']
    }
    // ... other positions
  };
  
  return configs[position] || configs.default;
};
```

## Implementation Status: 🚧 IN DEVELOPMENT

This comprehensive wireframe document combines all the discussed features into a cohesive system that addresses:

- **Dual Dashboard System**: Separate interfaces for players and coaches
- **Position-Specific Customization**: Tailored content based on player positions
- **Privacy Controls**: Individual stats visible only to player and coaches
- **Flag Football Specifics**: Olympic 5v5 format with appropriate rules and metrics
- **Team Chemistry**: Post-tournament rating system for team cohesion
- **Universal Benchmarking**: Age-adjusted performance rankings
- **Coach Flexibility**: Customizable stats tracking per position
- **Public Elements**: Leaderboards and team standings for competitive motivation
- **AI Insights**: Performance analysis for both players and coaches

The system maintains trust-based stat entry while providing comprehensive performance tracking and team management tools specifically designed for competitive flag football. 