# Community Page Wireframe Documentation

## Page Overview

The Community page serves as the social hub of the FlagFit Pro Training App, providing team communication, training session coordination, knowledge sharing, and player networking features. Updated to support team-based communication, chemistry ratings integration, position-specific chat rooms, and coach-player interactions.

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
│  │  │  Navigation Tabs: [Chat] [Training Sessions] [Knowledge]   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Team Overview - Hawks                              │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │   │   │
│  │  │  │  │             │ │             │ │             │   │   │   │   │
│  │  │  │  │   Active    │ │   Team      │ │   Next      │   │   │   │   │
│  │  │  │  │  Players    │ │  Chemistry  │ │   Game      │   │   │   │   │
│  │  │  │  │             │ │   Average   │ │             │   │   │   │   │
│  │  │  │  │     23      │ │    7.8/10   │ │  vs Eagles  │   │   │   │   │
│  │  │  │  │             │ │   🟢 Good   │ │  Tomorrow   │   │   │   │   │
│  │  │  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Chat Rooms                                        │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🏈 Main Team Chat (23 members) [3 unread]  │   │   │   │   │
│  │  │  │  │  "Practice tomorrow at 6 PM!"              │   │   │   │   │
│  │  │  │  │  Chemistry: 7.8/10 🟢                       │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🎯 QB/WR Squad (8 members) [1 unread]     │   │   │   │   │
│  │  │  │  │  "New route combinations to practice"      │   │   │   │   │
│  │  │  │  │  Chemistry: 8.3/10 🟢                       │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🛡️ Defense Unit (10 members)              │   │   │   │   │
│  │  │  │  │  "Great job on coverage drills!"            │   │   │   │   │
│  │  │  │  │  Chemistry: 7.5/10 🟡                       │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  👨‍🏫 Coach's Corner (5 coaches)           │   │   │   │   │
│  │  │  │  │  "Team meeting after practice"              │   │   │   │   │
│  │  │  │  │  Chemistry: 8.0/10 🟢                       │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Chat Messages                                     │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  👨‍🏫 Coach AJ (10:30 AM)                  │   │   │   │   │
│  │  │  │  │  Great practice today everyone! Remember    │   │   │   │   │
│  │  │  │  │  tomorrow's session starts at 6 PM sharp.   │   │   │   │   │
│  │  │  │  │  [Announcement] [👍12] [🏈5]               │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🔥 Mike Johnson (WR) (10:45 AM)           │   │   │   │   │
│  │  │  │  │  Can someone share the new route diagrams?  │   │   │   │   │
│  │  │  │  │  Chemistry with you: 8.3/10 🟢              │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  ⚡ Marcus Lightning (10:46 AM)             │   │   │   │   │
│  │  │  │  │  I've got them! Uploading now...            │   │   │   │   │
│  │  │  │  │  [📎 Route_Diagrams_v3.pdf] [👍3]          │   │   │   │   │
│  │  │  │  │  Chemistry with you: 7.2/10 🟡              │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🏈 You (11:20 AM)                          │   │   │   │   │
│  │  │  │  │  Excited for the new plays!                 │   │   │   │   │
│  │  │  │  │  [🔥2]                                      │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  [Type your message...] [😊] [📎] [Send]   │   │   │   │   │
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
│  │  │  │  Team Training Sessions                             │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🏈 Team Practice - Tomorrow 6:00 PM        │   │   │   │   │
│  │  │  │  │  Location: Central Field                     │   │   │   │   │
│  │  │  │  │  Focus: Eagles Preparation                   │   │   │   │   │
│  │  │  │  │  Attendees: 18/23 [Join] [Maybe] [Decline]  │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🎯 QB/WR Drills - Friday 7:00 PM          │   │   │   │   │
│  │  │  │  │  Location: Practice Field A                  │   │   │   │   │
│  │  │  │  │  Focus: Route Timing & Chemistry            │   │   │   │   │
│  │  │  │  │  Attendees: 6/8 [Join] [Maybe] [Decline]    │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  [Create New Session] [View All Sessions]   │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Team Chemistry Insights                            │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  Your Chemistry Ratings:                     │   │   │   │   │
│  │  │  │  │  • Mike Johnson (WR): 8.3/10 🟢             │   │   │   │   │
│  │  │  │  │  • Chris Wilson (Center): 8.0/10 🟢         │   │   │   │   │
│  │  │  │  │  • Tyler Brown (DB): 7.5/10 🟡              │   │   │   │   │
│  │  │  │  │  • Marcus Lightning (WR): 7.2/10 🟡         │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  🤖 AI Suggestion: "Your chemistry with     │   │   │   │   │
│  │  │  │  │     Mike is excellent. Consider practicing  │   │   │   │   │
│  │  │  │  │     together more to improve team cohesion."│   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  Knowledge Sharing                                 │   │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │  ┌─────────────────────────────────────────────┐   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  📚 Recent Resources                         │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  • Route_Diagrams_v3.pdf (Marcus)           │   │   │   │   │
│  │  │  │  │  • Eagles_Defense_Analysis.pdf (Coach AJ)   │   │   │   │   │
│  │  │  │  │  • QB_Pocket_Movement.mp4 (You)             │   │   │   │   │
│  │  │  │  │  • Team_Playbook_v2.1.pdf (Coach Mike)      │   │   │   │   │
│  │  │  │  │                                             │   │   │   │   │
│  │  │  │  │  [Upload Resource] [Browse Library]          │   │   │   │   │
│  │  │  │  └─────────────────────────────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Updates Made

### **1. Team Overview Integration**

- **Team Name**: Hawks team identification
- **Active Players**: 23 team members
- **Team Chemistry Average**: 7.8/10 (Good)
- **Next Game**: vs Eagles tomorrow

### **2. Position-Specific Chat Rooms**

- **Main Team Chat**: All 23 members
- **QB/WR Squad**: 8 members (position-specific)
- **Defense Unit**: 10 members (position-specific)
- **Coach's Corner**: 5 coaches only

### **3. Chemistry Ratings Integration**

- **Individual Chemistry**: Shown for each teammate in chat
- **Chemistry Indicators**: 🟢 Good (7.5+), 🟡 Fair (6.0-7.4), 🔴 Poor (<6.0)
- **AI Suggestions**: Chemistry improvement recommendations

### **4. Team Training Sessions**

- **Session Types**: Team practice, position-specific drills
- **Attendance Tracking**: RSVP system with attendee counts
- **Focus Areas**: Game preparation, chemistry building

### **5. Coach-Player Interaction**

- **Coach Announcements**: Official team communications
- **Coach's Corner**: Dedicated coach chat room
- **Resource Sharing**: Coaches can share playbooks and analysis

---

## Technical Implementation Notes

### **Database Integration**

- Team memberships and chat room assignments
- Chemistry ratings with teammate relationships
- Training session coordination
- Resource library management

### **Access Control**

- Position-based chat room access
- Coach-only communication channels
- Team resource sharing permissions

### **Real-time Features**

- Live chat messaging
- Session attendance updates
- Chemistry rating changes

---

## User Experience Features

### **Team Communication**

- **Multi-room Chat**: Position-specific and team-wide channels
- **Chemistry Indicators**: Visual relationship status
- **File Sharing**: Resource upload and download
- **Reaction System**: Emoji reactions to messages

### **Training Coordination**

- **Session Creation**: Team and position-specific practices
- **RSVP System**: Attendance tracking and planning
- **Location Management**: Field assignments and directions
- **Focus Areas**: Session objectives and preparation

### **Knowledge Management**

- **Resource Library**: Team playbooks and analysis
- **File Upload**: Easy sharing of training materials
- **Version Control**: Updated resource tracking
- **Search Functionality**: Quick resource discovery

---

## Integration Points

### **Dashboard Connection**

- Team chemistry data feeds dashboard insights
- Training session attendance affects progress tracking
- Chat activity influences team cohesion metrics

### **Profile Integration**

- Individual chemistry ratings from profile
- Position-specific chat room access
- Team membership status

### **Training System**

- Session coordination with training calendar
- Position-specific drill recommendations
- Team chemistry building activities

---

## Future Enhancements

- [ ] **Video Chat**: Face-to-face team meetings
- [ ] **Polls & Voting**: Team decision making
- [ ] **Event Calendar**: Team social events
- [ ] **Achievement Sharing**: Team accomplishment celebrations
- [ ] **Integration**: Social media sharing
- [ ] **Analytics**: Team communication insights
- [ ] **Mobile Push**: Real-time notifications
- [ ] **Offline Mode**: Message queuing for connectivity
