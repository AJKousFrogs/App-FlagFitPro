# Profile Page Wireframe Documentation

## Page Overview
The Profile page provides users with comprehensive personal information management, performance statistics, achievement tracking, and account settings for the FlagFit Pro Training App. Updated to support position-specific customization, physical metrics with universal rankings, game stats integration, and team chemistry ratings.

## Current Implementation Status: 🚧 UPDATING FOR COMPREHENSIVE DASHBOARD

---

## Wireframe Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] MERLINS PLAYBOOK                    [Theme Toggle] [Avatar Menu]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  Navigation Tabs: [Profile] [Stats] [Achievements] [Settings]│   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Profile Information                                │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🏈 [Avatar Selection Menu]                 │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Name: [Alex Rivera] [Edit]                 │   │   │   │   │
│  │  │  │  │  Email: [alex.rivera@email.com] [Edit]      │   │   │   │   │
│  │  │  │  │  Team: [Hawks] [Edit]                       │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Position Configuration:                     │   │   │   │   │
│  │  │  │  │  • Primary: [QB ▼] [Edit]                   │   │   │   │   │
│  │  │  │  │  • Secondary 1: [WR ▼] [Edit]               │   │   │   │   │
│  │  │  │  │  • Secondary 2: [None ▼] [Edit]             │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Experience: [Intermediate ▼] [Edit]        │   │   │   │   │
│  │  │  │  │  Preferred Hand: [Right ▼] [Edit]           │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Physical Metrics & Universal Rankings      │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │   │   │   │   │
│  │  │  │  │  │   Height    │ │   Weight    │ │  40-Yard│ │   │   │   │   │
│  │  │  │  │  │    6'2"     │ │   185 lbs   │ │  Dash   │ │   │   │   │   │
│  │  │  │  │  │ 78th %tile  │ │ 65th %tile  │ │  4.6s   │ │   │   │   │   │
│  │  │  │  │  │#2,234/10,001│ │#3,501/10,001│ │42nd %tile│ │   │   │   │   │
│  │  │  │  │  └─────────────┘ └─────────────┘ └─────────┘ │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │   │   │   │   │
│  │  │  │  │  │     BMI     │ │   Muscle    │ │ Coach   │ │   │   │   │   │
│  │  │  │  │  │    22.4     │ │    Mass     │ │ Rating  │ │   │   │   │   │
│  │  │  │  │  │ 71st %tile  │ │    42.3%    │ │ 8.5/10  │ │   │   │   │   │
│  │  │  │  │  │#2,901/10,001│ │ 89th %tile  │ │76th %tile│ │   │   │   │   │
│  │  │  │  │  └─────────────┘ └─────────────┘ └─────────┘ │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Bio: [Personal description...] [Edit]      │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Goals: [Speed improvement, Team captain]   │   │   │   │   │
│  │  │  │  │  [Add Goal] [Edit]                          │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  [Save Changes] [Cancel]                           │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Game Statistics (Private - Only You Can See)       │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Season Summary (8 Games)                   │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Primary Position (QB):                     │   │   │   │   │
│  │  │  │  │  • 45/67 completions (67%)                  │   │   │   │   │
│  │  │  │  │  • 456 passing yards                        │   │   │   │   │
│  │  │  │  │  • 7 passing TDs, 2 INTs                    │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Secondary Position (WR):                   │   │   │   │   │
│  │  │  │  │  • 12/18 catches (67%)                      │   │   │   │   │
│  │  │  │  │  • 256 receiving yards                      │   │   │   │   │
│  │  │  │  │  • 3 receiving TDs                          │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Combined: 10 total TDs, 712 total yards    │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Latest Game vs Eagles                      │   │   │   │   │
│  │  │  │  │  💬 Coach Comment: "Great pocket presence   │   │   │   │   │
│  │  │  │  │     in 4th quarter. Work on intermediate   │   │   │   │   │
│  │  │  │  │     timing routes."                         │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🤖 AI Insight: "Your completion rate       │   │   │   │   │
│  │  │  │  │     improves 15% when targeting crossing    │   │   │   │   │
│  │  │  │  │     routes vs comeback routes."             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Team Chemistry Ratings                             │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Your Chemistry with Teammates:                     │   │   │   │   │
│  │  │  │  • Mike Johnson (WR): 8.3/10                        │   │   │   │   │
│  │  │  │    Communication: 9/10, Timing: 8/10, Trust: 8/10  │   │   │   │   │
│  │  │  │                                                     │   │   │   │   │
│  │  │  │  • Chris Wilson (Center): 8.0/10                    │   │   │   │   │
│  │  │  │    Snap timing: 9/10, Protection calls: 8/10        │   │   │   │   │
│  │  │  │                                                     │   │   │   │   │
│  │  │  │  • Tyler Brown (DB): 7.5/10                         │   │   │   │   │
│  │  │  │    Practice intensity: 8/10, Leadership: 7/10      │   │   │   │   │
│  │  │  │                                                     │   │   │   │   │
│  │  │  │  ⚠️ Note: Players below 6.0 average face roster    │   │   │   │   │
│  │  │  │     review                                          │   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Training Performance Statistics                     │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │   │   │
│  │  │  │  │             │ │             │ │             │   │   │   │   │
│  │  │  │  │   Total     │ │   Total     │ │   Current   │   │   │   │   │
│  │  │  │  │  Sessions   │ │   Hours     │ │   Streak    │   │   │   │   │   │
│  │  │  │  │             │ │             │ │             │   │   │   │   │
│  │  │  │  │     47      │ │    23.5     │ │    12       │   │   │   │   │
│  │  │  │  │             │ │             │ │   days      │   │   │   │   │
│  │  │  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Level: 8 • XP: 2340/2500                   │   │   │   │   │
│  │  │  │  │  [████████░░] 94% Complete                  │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Recent Activity                                    │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🏆 Achievement Unlocked: "Route Master"    │   │   │   │   │
│  │  │  │  │  Completed 50 route running drills          │   │   │   │   │
│  │  │  │  │  [2 hours ago]                              │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  📊 Game Stats Updated vs Eagles            │   │   │   │   │
│  │  │  │  │  Coach AJ posted your performance data      │   │   │   │   │
│  │  │  │  │  [1 day ago]                                │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🏈 Training Session Completed              │   │   │   │   │
│  │  │  │  │  "QB Accuracy Drills" - 45 minutes          │   │   │   │   │
│  │  │  │  │  [2 days ago]                               │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Updates Made

### **1. Position-Specific Configuration**
- **Primary Position**: QB (Quarterback)
- **Secondary Position 1**: WR (Wide Receiver)  
- **Secondary Position 2**: None (expandable)
- **Team Assignment**: Hawks team integration

### **2. Physical Metrics with Universal Rankings**
- **Height**: 6'2" (78th percentile, #2,234/10,001)
- **Weight**: 185 lbs (65th percentile, #3,501/10,001)
- **40-Yard Dash**: 4.6s (42nd percentile, #5,801/10,001)
- **BMI**: 22.4 (71st percentile, #2,901/10,001)
- **Muscle Mass**: 42.3% (89th percentile, #1,101/10,001)
- **Coach Rating**: 8.5/10 (76th percentile, #2,401/10,001)

### **3. Game Statistics Integration**
- **Season Summary**: 8 games with combined stats
- **Primary Position (QB)**: 45/67 completions (67%), 456 yards, 7 TDs, 2 INTs
- **Secondary Position (WR)**: 12/18 catches (67%), 256 yards, 3 TDs
- **Coach Comments**: Personalized feedback from coaches
- **AI Insights**: Data-driven performance analysis

### **4. Team Chemistry Ratings**
- **Mike Johnson (WR)**: 8.3/10 overall
  - Communication: 9/10, Timing: 8/10, Trust: 8/10
- **Chris Wilson (Center)**: 8.0/10 overall
  - Snap timing: 9/10, Protection calls: 8/10
- **Tyler Brown (DB)**: 7.5/10 overall
  - Practice intensity: 8/10, Leadership: 7/10

### **5. Privacy Controls**
- **Game Statistics**: Marked as "Private - Only You Can See"
- **Individual Stats**: Visible only to player and their coaches
- **Public Elements**: Training performance and achievements

---

## Technical Implementation Notes

### **Database Integration**
- Player profiles with position flexibility
- Game statistics with position-specific data
- Chemistry ratings with teammate relationships
- Physical metrics with universal benchmarking

### **Access Control**
- Individual stats visible only to player and coaches
- Public training performance data
- Team chemistry ratings for team cohesion

### **Position-Specific Logic**
- QB: Completion %, passing yards, TDs, INTs
- WR: Catches, targets, receiving yards, TDs
- Combined stats for multi-position players

---

## User Experience Features

### **Profile Management**
- **Avatar Selection**: 20+ emoji avatar options
- **Position Configuration**: Primary + 2 secondary positions
- **Physical Metrics**: Comprehensive fitness tracking
- **Team Integration**: Team assignment and chemistry

### **Performance Tracking**
- **Game Statistics**: Position-specific performance data
- **Training Progress**: Session tracking and achievements
- **Chemistry Ratings**: Team relationship management
- **Universal Rankings**: Age-adjusted performance benchmarking

### **Privacy & Security**
- **Individual Stats**: Private to player and coaches
- **Public Elements**: Training achievements and progress
- **Team Data**: Shared within team context

---

## Integration Points

### **Dashboard Connection**
- Profile data feeds dashboard metrics
- Game stats appear in dashboard summaries
- Chemistry ratings influence team recommendations

### **Community Integration**
- Team chemistry affects community interactions
- Position-specific training recommendations
- Team-based communication features

### **Training System**
- Position-specific training focus areas
- Performance-based drill recommendations
- Achievement tracking and progression

---

## Future Enhancements

- [ ] **Advanced Analytics**: Detailed performance insights
- [ ] **Social Features**: Share achievements with team
- [ ] **AI Recommendations**: Personalized training suggestions
- [ ] **Integration**: Wearable device connectivity
- [ ] **Gamification**: Enhanced achievement system
- [ ] **Team Dashboard**: Coach and team management
- [ ] **Weather Integration**: Training condition alerts
- [ ] **Nutrition Tracking**: Meal and hydration logging 