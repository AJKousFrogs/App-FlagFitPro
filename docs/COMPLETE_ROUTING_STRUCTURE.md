# Complete Routing Structure - FlagFit Pro Wireframe

## 🎯 **Overview**
This document maps every Call-to-Action (CTA) button in the FlagFit Pro wireframe to its destination, showing the complete routing structure and user flow.

## 🏠 **Main Navigation Flow**

### **Header Navigation**
```
🏈 FlagFit Pro → Dashboard (Home)
├── Dashboard → Dashboard View
├── Training → Training Page
├── Community → Community Page
├── Tournaments → Tournaments Page
├── Profile → Profile Page
├── Theme → Toggle Dark/Light Mode
├── Avatar → Profile Settings
└── Logout → Login Page
```

## 🔐 **Authentication Flow**

### **Login Page (`/login`)**
```
📧 Email Input → Form Validation
🔑 Password Input → Form Validation
👁️ Show/Hide Password → Toggle Password Visibility
🔐 Login with Email → Dashboard (if successful)
📱 Google Sign In → OAuth Flow → Dashboard
🍎 Apple Sign In → OAuth Flow → Dashboard
📘 Facebook Sign In → OAuth Flow → Dashboard
❓ Forgot Password → Password Reset Flow
📝 Create Account → Register Page (`/register`)
```

### **Register Page (`/register`)**
```
📝 Create Account Form → Form Validation
⚖️ Measurement Toggle → Imperial/Metric Selection
📏 Weight Input → Measurement System Integration
📐 Height Input → Measurement System Integration
✅ Terms Agreement → Form Validation
📧 Marketing Consent → Email Preferences
📱 Social Sign In → OAuth Flow → Dashboard
🔙 Sign In → Login Page (`/login`)
```

### **Onboarding Flow**
```
👋 Welcome → Step 1: Personal Info
📝 Personal Info → Step 2: Physical Profile
⚖️ Physical Profile → Step 3: Team Selection
🏈 Team Selection → Step 4: Position Selection
🎯 Position Selection → Step 5: Experience Level
📊 Experience Level → Dashboard (Complete)
```

## 🏠 **Dashboard Flow**

### **Quick Actions Section**
```
🏋️ Start Training Session → Training Page
📊 View Team Stats → Team Analytics Page
📅 Schedule Game → Game Scheduling Page
👤 Update Profile → Profile Page
```

### **Draggable Dashboard Sections**
```
📊 Physical Profile → Profile Page (Physical Metrics)
🤝 Team Chemistry → Community Page (Team Overview)
📈 Game Stats → Game Statistics Page
🎯 Training Focus → Training Page (Focus Areas)
⚡ Quick Actions → Various Destinations
```

### **AI Coach Section**
```
🤖 Ask AI Coach → AI Chat Interface
📊 View Progress → Progress Analytics Page
💡 Get Training Tips → Training Tips Page
```

## 🏋️ **Training Page Flow**

### **AI Coach Message**
```
🤖 Ask AI Coach → AI Chat Interface
📊 View Progress → Progress Analytics Page
💡 Get Training Tips → Training Tips Page
```

### **Training Categories**
```
🏃 Route Running → Route Training Drills
⚡ Plyometrics → Plyometric Exercises
🏃‍♂️ Speed Training → Speed Workouts
💪 Strength → Strength Training
🎯 Accuracy → Accuracy Drills
🧠 Mental → Mental Training
🛡️ Defense → Defensive Drills
🏈 Position-Specific → Position Training
```

### **Coach-Recommended Drills**
```
🏈 QB Pocket Movement Drills
├── Start Drill → Drill Execution Page
└── View Details → Drill Information Page

🎯 QB-WR Chemistry Drills
├── Start Drill → Drill Execution Page
└── View Details → Drill Information Page

🛡️ Blitzer Pass Rush Drills
├── Start Drill → Drill Execution Page
└── View Details → Drill Information Page

🎯 DB Coverage Drills
├── Start Drill → Drill Execution Page
└── View Details → Drill Information Page
```

### **Weekly Training Schedule**
```
💾 Save Schedule → Schedule Confirmation
🤖 Get AI Recommendations → AI Recommendation Engine
🔄 Reset to Default → Default Schedule Restoration
```

## 👥 **Community Page Flow**

### **Tab Navigation**
```
💬 Chat → Chat Interface
🏋️ Training Sessions → Training Sessions View
📚 Knowledge → Knowledge Base
🎬 Film Room → Film Room Interface
```

### **Chat Rooms**
```
🏈 Main Team Chat → Chat Room Interface
⚡ Offense Chat → Offense Chat Room
🛡️ Defense Chat → Defense Chat Room
👨‍🏫 Coaches Corner → Coaches Chat Room
👥 Players Corner → Players Chat Room
```

### **Chat Messages**
```
💬 Send Message → Message Sent Confirmation
👍 Like Message → Like Confirmation
🏈 React to Message → Reaction Selection
```

### **Film Room**
```
📹 Upload Game Video → Video Upload Process
🎬 Watch & Analyze → Video Analysis Interface
💬 View Comments → Comments Section
📝 Post Comment → Comment Submission
```

## 🏆 **Tournaments Page Flow**

### **Upcoming Tournaments**
```
🏆 Spring Championship 2024
└── View Details → Tournament Details Page

🏆 Summer League
└── Register Now → Tournament Registration
```

### **Tournament Schedule**
```
📅 Game Schedule → Game Details
🥤 Nutrition Plan → Nutrition Details
```

### **Tournament Results**
```
📊 Win vs Eagles → Game Recap
📊 Win vs Lions → Game Recap
📊 Loss vs Bears → Game Recap
```

### **Nutrition Planning**
```
🏥 Medical Restrictions → Health Profile
📝 Request Modification → Health Update Form
🍽️ Personal Preferences → Dietary Preferences
✏️ Edit Preferences → Preference Editor
```

## 👤 **Profile Page Flow**

### **Profile Information**
```
✏️ Edit Profile → Profile Editor Mode
💾 Save Changes → Profile Update Confirmation
❌ Cancel → Profile View Mode
```

### **Physical Metrics**
```
⚖️ Measurement Toggle → Imperial/Metric Switch
📏 Weight Input → Weight Update
📐 Height Input → Height Update
```

### **Available Positions**
```
🏈 QB → Position Details
🏃 WR → Position Details
🏈 Center → Position Details
⚡ Blitzer → Position Details
🛡️ DB → Position Details
```

## 🎬 **Film Room Detailed Flow**

### **Video Upload**
```
📹 YouTube URL → Video Validation
📝 Game Title → Title Confirmation
📅 Date → Date Selection
🏈 Opponent → Opponent Selection
📋 Coach Notes → Notes Editor
📤 Upload Game Video → Upload Confirmation
```

### **Video Actions**
```
▶️ Watch & Analyze → Video Player with Analysis Tools
💬 View Comments → Comments Interface
👍 Rate Video → Rating System
```

### **Coach Analysis**
```
📊 QB Performance Analysis → Detailed QB Metrics
📊 WR Route Analysis → Detailed WR Metrics
💡 Coach Tips → Tips Interface
```

## 🔄 **Cross-Page Navigation**

### **Breadcrumb Navigation**
```
🏠 Home → Dashboard
📚 Current Page → Current Location
🔙 Back → Previous Page
```

### **Contextual Navigation**
```
📊 Stats → Analytics Dashboard
📅 Calendar → Schedule View
👥 Team → Team Management
⚙️ Settings → App Settings
```

## 📱 **Mobile Navigation**

### **Mobile Menu**
```
🍔 Hamburger Menu → Mobile Navigation Drawer
📱 Quick Actions → Mobile Action Sheet
👆 Touch Gestures → Swipe Navigation
```

### **Mobile-Specific Actions**
```
📞 Call Coach → Phone Integration
📧 Email Team → Email Integration
📍 Location Services → Field Location
```

## 🎯 **User Flow Scenarios**

### **New Player Onboarding**
```
1. Register → Personal Info → Physical Profile → Team Selection → Position → Experience → Dashboard
2. Dashboard → Training → AI Coach → First Training Session
3. Training → Community → Join Chat Rooms → Film Room → Upload First Video
4. Community → Tournaments → Register for Tournament → Nutrition Planning
```

### **Returning Player**
```
1. Login → Dashboard → Check AI Coach Message → View Progress
2. Dashboard → Training → Weekly Schedule → Start Training Session
3. Training → Community → Check Chat Messages → Film Room → Watch Videos
4. Community → Tournaments → Check Schedule → Nutrition Plan
```

### **Coach Workflow**
```
1. Login → Dashboard → Team Overview → Player Progress
2. Dashboard → Training → Coach Drills → Upload New Drills
3. Training → Community → Film Room → Upload Game Videos → Analysis
4. Community → Tournaments → Schedule Management → Team Preparation
```

## 🔗 **Deep Linking Structure**

### **Direct URLs**
```
/ → Dashboard
/login → Login Page
/register → Register Page
/training → Training Page
/community → Community Page
/community/chat → Chat Tab
/community/training-sessions → Training Sessions Tab
/community/knowledge → Knowledge Tab
/community/film-room → Film Room Tab
/tournaments → Tournaments Page
/profile → Profile Page
/dashboard → Dashboard (Alternative)
```

### **Parameter-Based Routing**
```
/training/drill/:id → Specific Drill
/community/chat/:roomId → Specific Chat Room
/film-room/video/:videoId → Specific Video
/tournaments/:tournamentId → Specific Tournament
/profile/:playerId → Specific Player Profile
```

## 🎨 **UI State Management**

### **Loading States**
```
⏳ Loading → Loading Spinner
✅ Success → Success Message
❌ Error → Error Message
🔄 Refreshing → Refresh Indicator
```

### **Interactive States**
```
👆 Hover → Hover Effects
👆 Active → Active States
👆 Disabled → Disabled States
👆 Focus → Focus States
```

---

## 🎉 **Summary**

This routing structure provides a complete map of every CTA button and navigation element in the FlagFit Pro wireframe. Each button leads to a specific destination, creating a comprehensive user experience that guides players, coaches, and teams through all aspects of flag football training, community interaction, and tournament participation.

**Next Steps**: Implement the actual routing logic and page transitions based on this structure. 