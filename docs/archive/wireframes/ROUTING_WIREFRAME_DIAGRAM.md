# Routing Wireframe Diagram - FlagFit Pro

## 🎯 **Visual Routing Structure**

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLAGFIT PRO HEADER                      │
├─────────────────────────────────────────────────────────────────┤
│ 🏈 FlagFit Pro │ Dashboard │ Training │ Community │ Tournaments │ Profile │ 🌙 Theme │ 👤 Avatar │ 🚪 Logout │
└─────────────────────────────────────────────────────────────────┘
         │              │            │            │              │         │          │           │
         ▼              ▼            ▼            ▼              ▼         ▼          ▼           ▼
    Dashboard        Training    Community    Tournaments    Profile   Toggle    Profile    Login Page
         │              │            │            │              │         Mode    Settings
         │              │            │            │              │
         └──────────────┴────────────┴────────────┴──────────────┘
```

## 🔐 **Authentication Flow Wireframe**

```
┌─────────────────────────────────────────────────────────────────┐
│                           LOGIN PAGE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📧 Email: [________________]                                   │
│  🔑 Password: [________________] 👁️                            │
│  ☑️ Remember me for 30 days                                    │
│                                                                 │
│  🔐 Login with Email    📱 Google    🍎 Apple    📘 Facebook   │
│                                                                 │
│  ❓ Forgot Password?    📝 Create Account                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                                 │
         ▼                                 ▼
    Dashboard (Success)              Register Page
         │                                 │
         │                                 ▼
         │                            Onboarding Flow
         │                                 │
         │                                 ▼
         └─────────────────────────────────┘
```

## 🏠 **Dashboard Wireframe with CTAs**

```
┌─────────────────────────────────────────────────────────────────┐
│                          DASHBOARD                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🤖 AI Coach Message                                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Ask AI Coach │ View Progress │ Get Training Tips           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📊 Physical Profile (Draggable)                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Weight: 185 lbs │ Height: 6'2" │ BMI: 22.4                │ │
│  │ Weekly Training Schedule                                    │ │
│  │ 💾 Save Schedule │ 🤖 Get AI Recommendations │ 🔄 Reset    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🤝 Team Chemistry (Draggable)                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Overall: 87% ⭐ │ Communication: 92% │ Trust: 85%         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📈 Game Stats (Draggable)                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Games: 12 │ Touchdowns: 18 │ Passing Yards: 2,847         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🎯 Training Focus (Draggable)                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Speed & Agility: 75% │ Strength: 82% │ Endurance: 68%     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ⚡ Quick Actions                                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🏋️ Start Training │ 📊 View Team Stats │ 📅 Schedule Game │ │
│  │ 👤 Update Profile                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    Training Page   Team Analytics  Game Scheduling  Profile Page
```

## 🏋️ **Training Page Wireframe with CTAs**

```
┌─────────────────────────────────────────────────────────────────┐
│                          TRAINING PAGE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🤖 AI Coach Message                                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Ask AI Coach │ View Progress │ Get Training Tips           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📊 Training Stats                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Current Streak: 7 days │ Player Level: Route Runner Pro    │ │
│  │ Daily Challenge: Complete 5 Routes (+50 XP)                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🎯 Position-Specific Training Focus                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🎯 QB Primary Focus Areas                                   │ │
│  │ 🎯 WR Secondary Focus Areas                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  👨‍🏫 Coach-Recommended Drills                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🏈 QB Pocket Movement Drills                                │ │
│  │ Duration: 30 min • Difficulty: Advanced                     │ │
│  │ [Start Drill] [View Details]                                │ │
│  │                                                             │ │
│  │ 🎯 QB-WR Chemistry Drills                                   │ │
│  │ Duration: 45 min • Difficulty: Intermediate                 │ │
│  │ [Start Drill] [View Details]                                │ │
│  │                                                             │ │
│  │ 🛡️ Blitzer Pass Rush Drills                                 │ │
│  │ Duration: 25 min • Difficulty: Intermediate                 │ │
│  │ [Start Drill] [View Details]                                │ │
│  │                                                             │ │
│  │ 🎯 DB Coverage Drills                                       │ │
│  │ Duration: 35 min • Difficulty: Advanced                     │ │
│  │ [Start Drill] [View Details]                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📅 Training Categories                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🏃 Route Running │ ⚡ Plyometrics │ 🏃‍♂️ Speed Training    │ │
│  │ 💪 Strength │ 🎯 Accuracy │ 🧠 Mental │ 🛡️ Defense        │ │
│  │ 🏈 Position-Specific                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    Drill Execution  Drill Info    Drill Execution  Drill Info
```

## 👥 **Community Page Wireframe with CTAs**

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMMUNITY PAGE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  💬 Chat │ 🏋️ Training Sessions │ 📚 Knowledge │ 🎬 Film Room  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  🏈 Main Team Chat (23 members) [3 unread]                  │ │
│  │  "Practice tomorrow at 6 PM!"                               │ │
│  │  Chemistry: 7.8/10 🟢                                       │ │
│  │                                                             │ │
│  │  ⚡ Offense Chat (12 members) [2 unread]                     │ │
│  │  "New route combinations to practice"                       │ │
│  │  Chemistry: 8.3/10 🟢                                       │ │
│  │                                                             │ │
│  │  🛡️ Defense Chat (11 members) [1 unread]                    │ │
│  │  "Great job on coverage drills!"                            │ │
│  │  Chemistry: 7.5/10 🟡                                       │ │
│  │                                                             │ │
│  │  👨‍🏫 Coaches Corner (5 coaches)                             │ │
│  │  "Team meeting after practice"                              │ │
│  │  Chemistry: 8.0/10 🟢                                       │ │
│  │                                                             │ │
│  │  👥 Players Corner (18 players)                             │ │
│  │  "Who's up for extra practice this weekend?"                │ │
│  │  Chemistry: 8.2/10 🟢                                       │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  💬 Chat Messages                                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 👨‍🏫 Coach AJ (10:30 AM)                                     │ │
│  │ Great practice today everyone!                              │ │
│  │ [Announcement] [👍12] [🏈5]                                 │ │
│  │                                                             │ │
│  │ 🔥 Mike Johnson (WR) (10:45 AM)                             │ │
│  │ Can someone share the new route diagrams?                   │ │
│  │ Chemistry with you: 8.3/10 🟢                               │ │
│  │                                                             │ │
│  │ [Type a message...] [Send]                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🎬 Film Room Section                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 📹 Upload New Game Video                                    │ │
│  │ YouTube URL: [________________]                              │ │
│  │ Game Title: [________________]                               │ │
│  │ Date: [____/____/____] Opponent: [________]                  │ │
│  │ Coach Notes: [________________]                              │ │
│  │ [📹 Upload Game Video]                                      │ │
│  │                                                             │ │
│  │ 🎬 Recent Game Videos                                       │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Hawks vs Eagles - Week 3                                 │ │ │
│  │ │ Uploaded by Coach AJ • 2 days ago                        │ │ │
│  │ │ [Watch & Analyze] [View Comments]                        │ │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │ 👨‍🏫 Coach Analysis & Tips                                   │ │ │
│  │ 🎯 QB Performance Analysis - Week 3                         │ │ │
│  │ ✅ Pocket presence improved by 15%                          │ │ │
│  │ ✅ Decision time: 2.3s (target: 2.0s)                      │ │ │
│  │ ⚠️ Red zone efficiency needs work                           │ │ │
│  │                                                             │ │
│  │ 💬 Film Room Discussion                                     │ │ │
│  │ 👨‍🏫 Coach AJ (2 hours ago)                                 │ │ │
│  │ Great analysis of the Week 3 game!                          │ │ │
│  │ [Add your analysis or comment...] [Post Comment]            │ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    Chat Interface  Video Analysis  Comments Section  Comment Posted
```

## 🏆 **Tournaments Page Wireframe with CTAs**

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOURNAMENTS PAGE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏆 Upcoming Tournaments                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Spring Championship 2024                                     │ │
│  │ Date: March 15-17, 2024 • Location: Central Park            │ │
│  │ Teams: 48 (8 pools × 6 teams) • Status: Registered          │ │
│  │ [View Details]                                               │ │
│  │                                                             │ │
│  │ Summer League                                                │ │
│  │ Date: June 1-30, 2024 • Location: Various Venues            │ │
│  │ Teams: 24 • Status: Registration Open                       │ │
│  │ [Register Now]                                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📅 Tournament Schedule & Nutrition Plan                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 📅 Game Schedule                    🥤 Tournament Nutrition │ │
│  │ ┌─────────────────────────────────┐ ┌─────────────────────┐ │ │
│  │ │ Spring Championship - Day 1     │ │ Day 1 - Nutrition   │ │ │
│  │ │ 9:00 AM: Game 1 vs Eagles       │ │ 8:30 AM: Pre-Game   │ │ │
│  │ │ 11:00 AM: Game 2 vs Lions       │ │ After Game 1: Gel   │ │ │
│  │ │ 2:00 PM: Game 3 vs Bears        │ │ from 226 + 0.5L     │ │ │
│  │ │                                 │ │ electrolytes        │ │ │
│  │ │ Spring Championship - Day 2     │ │                     │ │ │
│  │ │ 10:00 AM: Quarterfinal vs TBD   │ │ Day 2 - Nutrition   │ │ │
│  │ │ 2:00 PM: Semifinal vs TBD       │ │ 9:30 AM: Pre-       │ │ │
│  │ │ 4:00 PM: Championship vs TBD    │ │ Quarterfinal        │ │ │
│  │ └─────────────────────────────────┘ └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📊 Tournament Results                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Win vs Eagles (28-14)                                        │ │
│  │ Win vs Lions (35-21)                                         │ │
│  │ Loss vs Bears (17-24)                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🍽️ Nutrition Planning                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🏥 Personal Dietary Profile                                  │ │
│  │ • Gluten Intolerance (Severe)                               │ │
│  │ • Lactose Sensitivity (Moderate)                            │ │
│  │ [Request Modification]                                       │ │
│  │                                                             │ │
│  │ 🍽️ Personal Preferences                                      │ │
│  │ • Vegetarian Diet Choice                                     │ │
│  │ • Dislikes: Seafood, Spicy Foods                            │ │
│  │ • Supplement Routine: Creatine, Protein                     │ │
│  │ [Edit Preferences]                                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ⏱️ 30-Minute Break Optimization                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 0-5 min: Cool down + immediate hydration                    │ │
│  │ 5-10 min: Team meeting (if scheduled)                       │ │
│  │ 10-15 min: Equipment check + personal care                  │ │
│  │ 15-25 min: Nutrition intake + rest                          │ │
│  │ 25-30 min: Warm-up + game preparation                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    Tournament Details  Tournament Registration  Health Profile  Preference Editor
```

## 👤 **Profile Page Wireframe with CTAs**

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROFILE PAGE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👤 Profile Information                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ First Name: [Alex] Last Name: [Rivera]                      │ │
│  │ Email: [alex.rivera@email.com]                              │ │
│  │ Team: [Hawks ▼] Primary Position: [QB ▼]                    │ │
│  │ Secondary Position: [WR ▼] Experience: [Intermediate ▼]     │ │
│  │                                                             │ │
│  │ [Edit Profile] [Save Changes] [Cancel]                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📊 Physical Metrics                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ⚖️ Measurement System: [Imperial ▼] [Metric]                │ │
│  │ Weight: [185] lbs Height: [74] inches                       │ │
│  │ Age: 24 Member Since: 2024-01-15                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🏈 Available Positions                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🏈 QB │ 🏃 WR │ 🏈 Center │ ⚡ Blitzer │ 🛡️ DB              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    Profile Editor  Profile Saved  Position Details  Position Details
```

## 🔄 **Complete User Flow Diagram**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   LOGIN     │───▶│ DASHBOARD   │───▶│  TRAINING   │───▶│ COMMUNITY   │
│   PAGE      │    │             │    │   PAGE      │    │   PAGE      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  REGISTER   │    │   PROFILE   │    │    DRILL    │    │   FILM      │
│   PAGE      │    │   PAGE      │    │ EXECUTION   │    │   ROOM      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ONBOARDING   │    │   SETTINGS  │    │   DRILL     │    │   VIDEO     │
│   FLOW      │    │             │    │   INFO      │    │ ANALYSIS    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ DASHBOARD   │    │   LOGOUT    │    │   TRAINING  │    │   COMMENTS  │
│ (Complete)  │    │             │    │   TIPS      │    │   SECTION   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│TOURNAMENTS  │
│   PAGE      │
└─────────────┘
       │
       ▼
┌─────────────┐
│ NUTRITION   │
│  PLANNING   │
└─────────────┘
```

---

## 🎉 **Summary**

This wireframe diagram shows every CTA button and its routing destination in the FlagFit Pro application. Each button leads to a specific page or action, creating a comprehensive user experience flow that guides users through all aspects of flag football training, community interaction, and tournament participation.

**Key Features:**
- ✅ **Complete Button Mapping**: Every CTA button shows its destination
- ✅ **Visual Flow**: Clear navigation paths between pages
- ✅ **User Journey**: Complete user flow from login to all features
- ✅ **Interactive Elements**: All clickable elements are identified
- ✅ **Responsive Design**: Works on all device sizes

**Ready for Implementation**: This structure provides the complete blueprint for building the routing logic and page transitions. 