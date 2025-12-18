# AI Training Scheduler - Implementation Summary

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready

---

## Overview

A comprehensive AI-powered training scheduler that intelligently adjusts training periodization based on player schedules, tournaments, practices, and league games.

### Key Features

- **Intelligent Periodization**: Automatic training volume and intensity adjustments
- **Tournament Integration**: Pre-loaded with official tournament dates
- **League Game Support**: Austrian League and Slovenian National League support
- **Schedule Upload**: CSV, Excel, and Markdown file support
- **Export Options**: JSON, CSV, and iCal formats

## Key Features

### 1. **Intelligent Periodization**
- Automatically adjusts training volume and intensity
- Tournament taper protocols (7-14 days before)
- Post-tournament recovery management
- Practice day adjustments

### 2. **Tournament Integration**
Pre-loaded with official tournament dates:
- ✅ Adria Bowl - Poreč, Croatia (April 11-12, 2026)
- ✅ Copenhagen Bowl - Copenhagen, Denmark (May 23-24, 2026)
- ✅ Big Bowl - Frankfurt, Germany (June 6-7, 2026)
- ✅ Capital Bowl - Paris, France (July 4-5, 2026)
- ✅ Elite 8 - Slovenia (September 18-20, 2026) - **PEAK PRIORITY**
- ✅ Flagging New Year - Scotland (January 2027 - TBD)
- ✅ Flag Tech - Spain (February 2027 - TBD)

### 3. **League Game Support**
- Austrian League (5 weeks, one game day, up to 3 games max per game day)
- Slovenian National League
- Custom league schedules

### 4. **Schedule Upload**
- CSV file support
- Excel file support
- Markdown file support
- Manual event entry

### 5. **Export Options**
- JSON (full data)
- CSV (spreadsheet)
- iCal (calendar apps)

## Files Created

### Core Services
1. **`src/js/services/aiTrainingScheduler.js`** (740 lines)
   - Main AI logic
   - Periodization rules
   - Schedule generation
   - Export functionality

2. **`src/js/services/playerProfileService.js`** (200 lines)
   - Player profile management
   - Schedule parsing
   - Example profile (Aljoša Kous)

### UI Components
3. **`src/js/components/ai-scheduler-ui.js`** (500+ lines)
   - Complete UI component
   - File upload handling
   - Schedule display
   - Export functionality

### Styling
4. **`src/css/components/ai-scheduler.css`** (400+ lines)
   - Complete styling
   - Responsive design
   - Activity tags
   - Schedule visualization

### Pages & Documentation
5. **`ai-training-scheduler.html`**
   - Main page for the scheduler

6. **`docs/AI_TRAINING_SCHEDULER_GUIDE.md`**
   - Complete user guide
   - Examples
   - Troubleshooting

7. **`docs/example-schedule-template.csv`**
   - CSV template for uploads
   - Example data

## How It Works

### Periodization Rules

#### Tournament Taper
- **0-2 days before**: Complete rest (tournament days)
- **3-4 days before**: 20% volume, 30% intensity (light activation)
- **5-7 days before**: 40% volume, 50% intensity (taper)
- **8-14 days before**: 60% volume, 70% intensity (pre-taper)

#### Post-Tournament Recovery
- **0-1 days after**: Complete rest
- **2-3 days after**: Mobility only (10% volume, 20% intensity)
- **4-5 days after**: Light activation (30% volume, 40% intensity)
- **6-7 days after**: Return to training (50% volume, 60% intensity)

#### Practice Day Adjustments
- **Flag Practice**: 80% volume, 70% intensity
- **Technique Training**: 60% volume, 50% intensity
- **3+ practices/week**: Training volume reduced to 60%
- **2 practices/week**: Training volume reduced to 80%

### Example: Aljoša Kous

**Profile:**
- Name: Aljoša Kous
- Jersey: #55
- Position: WR/DB

**League Commitments:**
- Austrian League: 5 weeks (one game day per week, up to 3 games max)
- Slovenian National League: Regular season

**How Scheduler Handles:**
1. Identifies Austrian League game days
2. Adjusts training around those days (light before, recovery after)
3. Accounts for tournament dates (especially Elite 8)
4. Balances training with practice schedules
5. Ensures proper recovery between competitions

## Integration Points

### With Existing System
- Uses `scheduleFileParser.js` for file parsing
- Integrates with `ANNUAL_TRAINING_PROGRAM` from `training-program-data.js`
- Uses `tournament-schedule.js` for tournament dates
- Compatible with existing `scheduleService.js`

### Data Flow
```
Player Uploads Schedule
    ↓
playerProfileService.parseAndAddSchedule()
    ↓
Player Profile Created/Updated
    ↓
aiTrainingScheduler.generatePersonalizedSchedule()
    ↓
Schedule Generated with Periodization
    ↓
UI Renders Schedule
    ↓
User Exports (JSON/CSV/iCal)
```

## Usage Example

```javascript
// 1. Create player profile
const profile = playerProfileService.savePlayerProfile({
  name: "Aljoša Kous",
  jerseyNumber: 55,
  position: "WR/DB",
  leagueGames: [
    {
      date: "2026-04-20",
      league: "Austrian League",
      opponent: "TBD",
      location: "Austria",
      gameDay: 1,
      maxGames: 3,
    },
    // ... more games
  ],
});

// 2. Generate schedule
const schedule = aiTrainingScheduler.generatePersonalizedSchedule(
  profile,
  new Date("2026-04-01"),
  new Date("2026-10-31")
);

// 3. Export
const csv = aiTrainingScheduler.exportSchedule(schedule, "csv");
```

## Key Algorithms

### 1. Phase Determination
Automatically determines training phase based on date:
- December → Foundation
- January → Power Development
- February → Competition Preparation
- March → Explosive Phase
- April-June → Tournament Maintenance
- July → Off-Season Conditioning
- August → World Championship Prep
- September → Peak for Elite 8
- October → Transition

### 2. Periodization Calculation
```javascript
// Check tournament proximity
const daysUntilTournament = calculateDaysUntil(tournament, date);

if (daysUntilTournament <= 2) {
  // Tournament days - rest
  volume = 0;
  intensity = 0;
} else if (daysUntilTournament <= 7) {
  // Taper period
  volume = 0.4;
  intensity = 0.5;
} else if (daysUntilTournament <= 14) {
  // Pre-taper
  volume = 0.6;
  intensity = 0.7;
}
```

### 3. Practice Day Adjustment
```javascript
// Adjust based on practice frequency
const practiceCount = week.practices.length;

if (practiceCount >= 3) {
  volume *= 0.6; // High practice frequency
} else if (practiceCount === 2) {
  volume *= 0.8; // Moderate practice frequency
}
```

## Testing Recommendations

1. **Test with Example Profile**
   - Load Aljoša Kous example
   - Verify Austrian League games are handled
   - Check tournament taper periods

2. **Test File Upload**
   - Upload CSV template
   - Verify parsing works
   - Check schedule integration

3. **Test Periodization**
   - Generate schedule around Elite 8
   - Verify taper period (7-14 days before)
   - Check recovery period (after tournament)

4. **Test Export**
   - Export to JSON
   - Export to CSV
   - Export to iCal
   - Verify formats are correct

## Future Enhancements

1. **Machine Learning Integration**
   - Learn from player performance data
   - Optimize periodization based on results
   - Predict recovery needs

2. **Advanced Analytics**
   - Training load tracking
   - Fatigue monitoring
   - Performance predictions

3. **Team Coordination**
   - Multiple player schedules
   - Team-wide periodization
   - Practice scheduling optimization

4. **Mobile App**
   - Native mobile experience
   - Push notifications
   - Offline support

## Documentation

- **User Guide**: `docs/AI_TRAINING_SCHEDULER_GUIDE.md`
- **CSV Template**: `docs/example-schedule-template.csv`
- **This Summary**: `docs/AI_SCHEDULER_SUMMARY.md`

## Access

Open `ai-training-scheduler.html` in your browser to use the scheduler.

## 🔗 **Related Documentation**

- [AI Training Scheduler Guide](AI_TRAINING_SCHEDULER_GUIDE.md) - Complete user guide
- [Comprehensive Offseason Periodization](COMPREHENSIVE_OFFSEASON_PERIODIZATION.md) - Periodization plans
- [Evidence-Based Configuration Guide](EVIDENCE_BASED_CONFIGURATION_GUIDE.md) - Evidence-based configurations
- [Architecture](ARCHITECTURE.md) - System architecture overview

## 📝 **Changelog**

- **v1.0 (2025-01)**: Initial AI scheduler implementation
- Tournament integration added
- League game support implemented
- Export functionality added

---

**Built for Ljubljana Frogs - European & World Championship Domination** 🏆⚡

