# AI-Powered Training Scheduler Guide

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready

---

## Overview

The AI Training Scheduler intelligently adjusts your training periodization based on:
- **Tournament dates** (Adria Bowl, Copenhagen Bowl, Big Bowl, Capital Bowl, Elite 8)
- **Player practice schedules** (flag practice, technique training)
- **Game schedules** (league games, tournaments)
- **League commitments** (Austrian League, Slovenian National League)
- **Recovery needs** (post-tournament recovery, taper periods)

## Features

### 1. **Intelligent Periodization**
- Automatically adjusts training volume and intensity based on tournament proximity
- Implements taper protocols (7-14 days before tournaments)
- Manages recovery periods (post-tournament)
- Adapts to practice frequency

### 2. **Tournament Integration**
The scheduler knows all official tournament dates:
- **Adria Bowl** - Poreč, Croatia (April 11-12, 2026)
- **Copenhagen Bowl** - Copenhagen, Denmark (May 23-24, 2026)
- **Big Bowl** - Frankfurt, Germany (June 6-7, 2026)
- **Capital Bowl** - Paris, France (July 4-5, 2026)
- **Elite 8** - Slovenia (September 18-20, 2026) - **PEAK PRIORITY**

### 3. **League Game Support**
Handles multiple league commitments:
- Austrian League (5 weeks, one game day, up to 3 games max per game day)
- Slovenian National League
- Custom league schedules

### 4. **Practice Day Adjustments**
- **Flag Practice**: Reduces training volume to 80%, maintains intensity at 70%
- **Technique Training**: Reduces volume to 60%, intensity to 50%
- **Game Day**: Complete rest
- **Day Before Game**: Light training (30% volume, 40% intensity)
- **Day After Game**: Recovery (30% volume, 40% intensity)

## How to Use

### Step 1: Create Player Profile

1. Open `ai-training-scheduler.html`
2. Fill in your information:
   - Name (e.g., "Aljoša Kous")
   - Jersey Number (e.g., 55)
   - Position (WR/DB, QB, etc.)
3. Click "Create Profile" or "Load Example (Aljoša Kous)" for a pre-filled example

### Step 2: Upload Your Schedule

You can upload your schedule in three ways:

#### Option A: Upload CSV/Excel/Markdown File

**CSV Format Example:**
```csv
date,day,workout_type,workout_title,duration,notes,is_game_day
2026-04-15,Monday,flag_practice,Flag Practice,120,Regular practice,false
2026-04-20,Saturday,league_game,Austrian League Game,180,vs Opponent,true
2026-04-22,Monday,technique,Technique Training,90,Throwing mechanics,false
```

#### Option B: Manual Entry

1. Select event type:
   - Flag Practice
   - Technique Training
   - League Game
2. Select date
3. For league games, add league name and opponent
4. Click "Add Event"

#### Option C: Load Example Profile

Click "Load Example (Aljoša Kous)" to see a pre-configured profile with:
- Austrian League games (5 weeks)
- Example practice schedule

### Step 3: Generate Training Schedule

1. Select **Start Date** (e.g., April 1, 2026)
2. Select **End Date** (e.g., October 31, 2026)
3. Click **"🚀 Generate AI Training Schedule"**

The scheduler will:
- Analyze all tournament dates
- Check your practice schedule
- Identify league game days
- Apply periodization rules
- Generate personalized weekly schedules

### Step 4: Review and Export

The generated schedule shows:
- **Weekly breakdown** with phase identification
- **Daily training sessions** with volume/intensity percentages
- **Adjustment reasons** (why training was modified)
- **Activity tags** (tournaments, practices, games)

**Export Options:**
- **JSON**: Full schedule data
- **CSV**: Spreadsheet format
- **iCal**: Import into calendar apps (Google Calendar, Outlook, etc.)

## Periodization Rules

### Tournament Taper Protocol

| Days Before Tournament | Volume | Intensity | Type |
|------------------------|--------|-----------|------|
| 0-2 days | 0% | 0% | Rest (Tournament Days) |
| 3-4 days | 20% | 30% | Light Activation |
| 5-7 days | 40% | 50% | Taper |
| 8-14 days | 60% | 70% | Pre-Taper |

### Post-Tournament Recovery

| Days After Tournament | Volume | Intensity | Type |
|----------------------|--------|-----------|------|
| 0-1 days | 0% | 0% | Complete Rest |
| 2-3 days | 10% | 20% | Mobility Only |
| 4-5 days | 30% | 40% | Light Activation |
| 6-7 days | 50% | 60% | Return to Training |

### Practice Day Adjustments

- **3+ practices/week**: Training volume reduced to 60%
- **2 practices/week**: Training volume reduced to 80%
- **1 practice/week**: Full training program

## Example: Aljoša Kous Schedule

### Profile
- **Name**: Aljoša Kous
- **Jersey**: #55
- **Position**: WR/DB

### League Commitments
- **Austrian League**: 5 weeks (one game day per week, up to 3 games max)
- **Slovenian National League**: Regular season games

### Schedule Integration
The scheduler will:
1. Identify Austrian League game days
2. Adjust training around those days
3. Account for tournament dates (especially Elite 8 in September)
4. Balance training with practice schedules
5. Ensure proper recovery between competitions

## Training Phases

The scheduler automatically determines your training phase:

- **December**: Foundation Phase
- **January**: Power Development Phase
- **February**: Competition Preparation
- **March**: Explosive Phase (Hamstring focus)
- **April-June**: Tournament Maintenance
- **July**: Off-Season Conditioning
- **August**: World Championship Prep
- **September**: Peak for Elite 8
- **October**: Transition

## Tips for Best Results

1. **Upload Complete Schedule**: Include all practices, games, and tournaments
2. **Update Regularly**: Add new events as your schedule changes
3. **Review Adjustments**: Check why training was modified (hover over adjustment reasons)
4. **Export to Calendar**: Use iCal export to sync with your calendar
5. **Trust the AI**: The scheduler follows proven periodization principles

## Troubleshooting

### Schedule Not Generating?
- Ensure you've created a player profile
- Check that start/end dates are valid
- Verify at least some events are added

### Training Too Light/Heavy?
- Check your practice frequency (high frequency = lower volume)
- Review tournament proximity (taper periods reduce volume)
- Verify league game dates are correct

### Missing Tournaments?
- Tournament dates are pre-loaded from official schedule
- If dates change, update them in `tournament-schedule.js`

## Technical Details

### Files Structure
```
src/js/services/
  ├── aiTrainingScheduler.js    # Core AI logic
  ├── playerProfileService.js   # Player data management
  └── scheduleFileParser.js      # File parsing (existing)

src/js/components/
  └── ai-scheduler-ui.js         # UI component

src/css/components/
  └── ai-scheduler.css           # Styles

ai-training-scheduler.html       # Main page
```

### Data Flow
1. Player uploads schedule → `playerProfileService`
2. Profile + dates → `aiTrainingScheduler.generatePersonalizedSchedule()`
3. Scheduler analyzes dates, applies rules → Returns schedule
4. UI renders schedule → User can export

## Support

For questions or issues:
1. Check this guide
2. Review example profile (Aljoša Kous)
3. Verify your schedule format matches CSV template
4. Check browser console for errors

## 🔗 **Related Documentation**

- [AI Scheduler Summary](AI_SCHEDULER_SUMMARY.md) - Implementation summary
- [Comprehensive Offseason Periodization](COMPREHENSIVE_OFFSEASON_PERIODIZATION.md) - Periodization plans
- [Evidence-Based Configuration Guide](EVIDENCE_BASED_CONFIGURATION_GUIDE.md) - Evidence-based configurations

## 📝 **Changelog**

- **v1.0 (2025-01)**: Initial user guide
- Complete usage instructions documented
- Periodization rules explained
- Troubleshooting section added

---

**Built for Ljubljana Frogs - European & World Championship Domination** 🏆⚡

