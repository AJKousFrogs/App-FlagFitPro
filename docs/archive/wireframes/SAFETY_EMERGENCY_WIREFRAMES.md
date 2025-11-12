# Safety & Emergency System Wireframes

## Page Overview

Critical safety features including emergency contacts, injury reporting, medical information management, and safety protocol integration for the flag football training app.

## **Emergency Contact System**

### **Emergency Contact Setup - Desktop**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] MERLINS PLAYBOOK                    [Theme Toggle] [Avatar Menu]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    🚨 Emergency Contacts Setup                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ⚠️ IMPORTANT: These contacts will be notified in case of emergency │   │
│  │     during training sessions, games, or tournaments.               │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Primary Emergency Contact                                   │   │   │
│  │  │                                                             │   │   │
│  │  │ Relationship: [Parent/Guardian ▼]                          │   │   │
│  │  │ Name: [                                            ]        │   │   │
│  │  │ Phone: [                                           ]        │   │   │
│  │  │ Email: [                                           ]        │   │   │
│  │  │ Address: [                                         ]        │   │   │
│  │  │ Notes: [Available 24/7, speak English and Spanish ]        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Secondary Emergency Contact                                 │   │   │
│  │  │                                                             │   │   │
│  │  │ Relationship: [Emergency Contact ▼]                        │   │   │
│  │  │ Name: [                                            ]        │   │   │
│  │  │ Phone: [                                           ]        │   │   │
│  │  │ Email: [                                           ]        │   │   │
│  │  │ Address: [                                         ]        │   │   │
│  │  │ Notes: [Backup contact, local area                ]        │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Medical Emergency Preferences                               │   │   │
│  │  │                                                             │   │   │
│  │  │ Preferred Hospital: [St. Mary's Medical Center      ▼]     │   │   │
│  │  │ Insurance Provider: [Blue Cross Blue Shield         ]      │   │   │
│  │  │ Policy Number: [                                   ]        │   │   │
│  │  │ ☑️ Share medical info with emergency responders            │   │   │
│  │  │ ☑️ Allow emergency contacts to make medical decisions      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  [Save Emergency Contacts] [Test Contact System] [Skip for Now]    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Emergency Contact - Mobile Interface**

```
┌─────────────────────────────────────┐
│ ← Back    🚨 Emergency Contacts     │
├─────────────────────────────────────┤
│                                     │
│ ⚠️ Required for participation       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Primary Contact                 │ │
│ │                                 │ │
│ │ Relationship                    │ │
│ │ [Parent/Guardian           ▼] │ │
│ │                                 │ │
│ │ Full Name                       │ │
│ │ [John Rivera                  ] │ │
│ │                                 │ │
│ │ Phone Number                    │ │
│ │ [(555) 123-4567              ] │ │
│ │ [📞 Test Call]                  │ │
│ │                                 │ │
│ │ Email Address                   │ │
│ │ [john.rivera@email.com        ] │ │
│ │                                 │ │
│ │ ☑️ Available 24/7               │ │
│ │ ☑️ Can make medical decisions   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ + Add Secondary Contact         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏥 Medical Preferences          │ │
│ │ Preferred Hospital: St. Mary's  │ │
│ │ Insurance: Blue Cross           │ │
│ │ [Edit Medical Info]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Save Contacts] [Test System]       │
│                                     │
└─────────────────────────────────────┘
```

## **Injury Reporting System**

### **Immediate Injury Report - Mobile**

```
┌─────────────────────────────────────┐
│ 🚨 INJURY REPORT                    │
├─────────────────────────────────────┤
│                                     │
│ ⚠️ Report an injury immediately     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Injured Person                  │ │
│ │ ● Self (Alex Rivera)            │ │
│ │ ○ Teammate: [Select Player ▼]   │ │
│ │ ○ Other: [Name            ]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Injury Severity                 │ │
│ │ ○ Minor (can continue)          │ │
│ │ ● Moderate (needs attention)    │ │
│ │ ○ Severe (emergency care)       │ │
│ │ ○ 🚨 CALL 911 IMMEDIATELY       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Body Part Injured               │ │
│ │                                 │ │
│ │     🧍 Tap body part:           │ │
│ │                                 │ │
│ │       ● Head/Neck               │ │
│ │       ○ Shoulder/Arm            │ │
│ │     ○●○ Torso/Back              │ │
│ │      │  Hip/Groin               │ │
│ │     ○○○ Leg/Knee                │ │
│ │      ▣  Ankle/Foot              │ │
│ │                                 │ │
│ │ Selected: Head/Neck             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [🚨 Emergency] [Continue Report]    │
│                                     │
└─────────────────────────────────────┘
```

### **Detailed Injury Report**

```
┌─────────────────────────────────────┐
│ 📋 Injury Details                   │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ What Happened?                  │ │
│ │ ○ Contact with player           │ │
│ │ ○ Non-contact injury            │ │
│ │ ● Collision with ground         │ │
│ │ ○ Equipment related             │ │
│ │ ○ Overuse/fatigue              │ │
│ │ ○ Other: [                  ]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Activity When Injured           │ │
│ │ ○ Training drill                │ │
│ │ ○ Scrimmage/Game               │ │
│ │ ● Warm-up/Cool-down            │ │
│ │ ○ Break/Rest period            │ │
│ │ ○ Other: [                  ]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Pain Level (1-10)               │ │
│ │ 😊 ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐ 😫     │ │
│ │    │1│2│3│4│5│6│7│8│9│10│       │ │
│ │    └─┴─┴─┴─┴─┴█┴─┴─┴─┴─┘       │ │
│ │                ▲ Selected: 6     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Description                     │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Hit head on ground during   │ │ │
│ │ │ diving drill. Felt dizzy    │ │ │
│ │ │ for a few seconds.          │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [🚨 Emergency] [Save Report]        │
│                                     │
└─────────────────────────────────────┘
```

### **Immediate Actions & Emergency Response**

```
┌─────────────────────────────────────┐
│ 🚨 EMERGENCY PROTOCOL ACTIVATED     │
├─────────────────────────────────────┤
│                                     │
│ Head/Neck Injury Reported           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ IMMEDIATE ACTIONS:            │ │
│ │                                 │ │
│ │ 1. ☑️ STOP all activity          │ │
│ │ 2. ☑️ DO NOT move player         │ │
│ │ 3. ⏰ Check consciousness         │ │
│ │ 4. ⏰ Call emergency services     │ │
│ │ 5. ⏰ Notify emergency contacts   │ │
│ │                                 │ │
│ │ [Emergency Checklist] →         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📞 Emergency Contacts           │ │
│ │                                 │ │
│ │ [📞 Call 911]                   │ │ ← Quick action
│ │                                 │ │   buttons
│ │ [📞 John Rivera (Parent)]       │ │
│ │ [📞 Coach Emergency Line]       │ │
│ │ [📞 Team Medical Staff]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📍 Location Information         │ │
│ │ Central High School Field       │ │
│ │ 123 Main St, Springfield       │ │
│ │ GPS: 40.7128, -74.0060         │ │
│ │ [Share Location] [Copy Address] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View Medical Info] [Update Status] │
│                                     │
└─────────────────────────────────────┘
```

## **Medical Information Management**

### **Medical History Setup**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏥 Medical Information                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ⚠️ This information is only shared with medical personnel and emergency    │
│     contacts in case of emergency. Coaches will only see relevant safety   │
│     restrictions.                                                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Allergies & Medical Conditions                                      │   │
│  │                                                                     │   │
│  │ Allergies:                                                          │   │
│  │ ☑️ No known allergies                                               │   │
│  │ ☐ Food allergies: [                                         ]      │   │
│  │ ☐ Medication allergies: [                                   ]      │   │
│  │ ☐ Environmental allergies: [                                ]      │   │
│  │                                                                     │   │
│  │ Medical Conditions:                                                 │   │
│  │ ☑️ No known conditions                                              │   │
│  │ ☐ Asthma                    ☐ Diabetes                             │   │
│  │ ☐ Heart condition          ☐ Epilepsy                             │   │
│  │ ☐ Previous concussion      ☐ Joint problems                       │   │
│  │ ☐ Other: [                                              ]          │   │
│  │                                                                     │   │
│  │ Current Medications:                                                │   │
│  │ ☑️ No current medications                                           │   │
│  │ ☐ Medication list: [                                        ]      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Previous Injuries & Restrictions                                    │   │
│  │                                                                     │   │
│  │ ☑️ No previous major injuries                                       │   │
│  │ ☐ Previous concussion(s): Date: [        ] Details: [        ]     │   │
│  │ ☐ Broken bones: [                                          ]        │   │
│  │ ☐ Surgeries: [                                             ]        │   │
│  │ ☐ Ongoing physical therapy: [                              ]        │   │
│  │                                                                     │   │
│  │ Activity Restrictions:                                              │   │
│  │ ☑️ No restrictions                                                  │   │
│  │ ☐ Contact limitations: [                                   ]        │   │
│  │ ☐ Time limitations: [                                      ]        │   │
│  │ ☐ Doctor's note required for: [                           ]        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Save Medical Info] [Upload Doctor's Note] [Medical Clearance]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Medical Information - Mobile View**

```
┌─────────────────────────────────────┐
│ ← Back      🏥 Medical Info          │
├─────────────────────────────────────┤
│                                     │
│ 🔒 Private & Secure                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Allergies                       │ │
│ │ ☑️ No known allergies           │ │
│ │ ☐ Food allergies               │ │
│ │ ☐ Medication allergies         │ │
│ │ ☐ Environmental allergies      │ │
│ │ ☐ Other allergies              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Medical Conditions              │ │
│ │ ☑️ None                         │ │
│ │ ☐ Asthma                       │ │
│ │ ☐ Heart condition              │ │
│ │ ☐ Previous concussion          │ │
│ │ ☐ Diabetes                     │ │
│ │ ☐ Joint problems               │ │
│ │ [+ Add Condition]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Current Medications             │ │
│ │ ☑️ None                         │ │
│ │ ☐ Daily medications            │ │
│ │ ☐ As-needed medications        │ │
│ │ [+ Add Medication]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Emergency Instructions          │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Special instructions for    │ │ │
│ │ │ emergency responders...     │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Save Information] [Upload Files]   │
│                                     │
└─────────────────────────────────────┘
```

## **Safety Protocol Integration**

### **Weather Safety Alerts**

```
┌─────────────────────────────────────┐
│ ⚠️ WEATHER SAFETY ALERT             │
├─────────────────────────────────────┤
│                                     │
│ 🌡️ EXTREME HEAT WARNING             │
│ Temperature: 95°F                   │
│ Heat Index: 108°F                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🚨 AUTOMATIC SAFETY PROTOCOLS   │ │
│ │                                 │ │
│ │ ✅ Shortened practice (45→30min) │ │
│ │ ✅ Mandatory water breaks every  │ │
│ │    10 minutes                   │ │
│ │ ✅ Shade breaks required         │ │
│ │ ✅ Ice packs prepared            │ │
│ │ ✅ Emergency services notified   │ │
│ │                                 │ │
│ │ ❌ No conditioning drills        │ │
│ │ ❌ No full equipment            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Heat Illness Warning Signs:     │ │
│ │ • Excessive fatigue             │ │
│ │ • Dizziness or nausea           │ │
│ │ • Confusion                     │ │
│ │ • Profuse sweating or no sweat  │ │
│ │                                 │ │
│ │ [Report Heat Illness] →         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Accept Protocols] [Cancel Practice]│
│                                     │
└─────────────────────────────────────┘
```

### **Concussion Protocol Workflow**

```
┌─────────────────────────────────────┐
│ 🧠 CONCUSSION PROTOCOL ACTIVATED    │
├─────────────────────────────────────┤
│                                     │
│ Head injury reported for Alex Rivera│
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ IMMEDIATE ACTIONS:              │ │
│ │ 1. ✅ Remove from activity       │ │
│ │ 2. ⏰ Initial assessment         │ │
│ │ 3. ⏰ Monitor symptoms           │ │
│ │ 4. ⏰ Contact emergency contact  │ │
│ │ 5. ⏰ Medical evaluation         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Quick Assessment:               │ │
│ │                                 │ │
│ │ Is player responsive? [Yes/No]  │ │
│ │ Can they state their name?      │ │
│ │ Do they know where they are?    │ │
│ │ Do they remember what happened? │ │
│ │                                 │ │
│ │ [Start Assessment] →            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ RETURN-TO-PLAY PROTOCOL      │ │
│ │                                 │ │
│ │ Player CANNOT return today      │ │
│ │ Medical clearance required      │ │
│ │                                 │ │
│ │ [View RTP Protocol] →           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Document Incident] [Call Parent]   │
│                                     │
└─────────────────────────────────────┘
```

## **Emergency Communication System**

### **Auto-Alert System**

```
┌─────────────────────────────────────┐
│ 📱 Emergency Alert Sent             │
├─────────────────────────────────────┤
│                                     │
│ 🚨 Automatic notifications sent to: │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ John Rivera (Parent)          │ │
│ │    📱 SMS: Delivered 2:14 PM     │ │
│ │    📧 Email: Delivered 2:14 PM   │ │
│ │    ☎️ Call: Connecting...        │ │
│ │                                 │ │
│ │ ✅ Emergency Contact             │ │
│ │    📱 SMS: Delivered 2:14 PM     │ │
│ │                                 │ │
│ │ ✅ Coach Emergency Line          │ │
│ │    📧 Alert: Delivered 2:14 PM   │ │
│ │                                 │ │
│ │ ⏰ Team Medical Staff            │ │
│ │    📱 SMS: Sending...            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Message sent:                   │ │
│ │ "URGENT: Alex Rivera injured    │ │
│ │ during practice. Head/neck      │ │
│ │ injury at Central HS Field.     │ │
│ │ Emergency protocols activated.  │ │
│ │ Please respond ASAP."           │ │
│ │                                 │ │
│ │ Location: GPS coordinates sent  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Resend Alerts] [Add Contact]       │
│                                     │
└─────────────────────────────────────┘
```

This comprehensive safety system ensures immediate response capabilities, proper documentation, and communication protocols for emergency situations during flag football activities.
