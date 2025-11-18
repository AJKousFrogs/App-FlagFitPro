# FlagFit Pro - Sport-Specific Patterns (Complete)

## Additional Sport Patterns

This document contains the remaining sport-specific patterns needed for your flag football app.

---

## Flag Football Performance Metrics & Benchmarks

### Overview

This section defines the key performance metrics and benchmarks used to evaluate flag football players. These metrics should be tracked in player profiles, performance charts, and assessment tools throughout the app.

### Physical Performance Metrics

#### Speed & Agility

| Metric           | Benchmark | Description                                               |
| ---------------- | --------- | --------------------------------------------------------- |
| **40-Yard Dash** | 4.6s      | Measures straight-line speed and acceleration             |
| **3-Cone Drill** | 6.8s      | Tests agility, change of direction, and body control      |
| **Shuttle Run**  | 4.3s      | Evaluates lateral quickness and acceleration/deceleration |

#### Explosiveness & Power

| Metric            | Benchmark          | Description                                    |
| ----------------- | ------------------ | ---------------------------------------------- |
| **Vertical Jump** | 1.1m (box jumping) | Measures lower body explosiveness and power    |
| **Broad Jump**    | —                  | Tests horizontal power and lower body strength |

#### Strength & Endurance

| Metric               | Benchmark                            | Description                                          |
| -------------------- | ------------------------------------ | ---------------------------------------------------- |
| **Hamstring Curls**  | 10 reps                              | Tests posterior chain strength and injury prevention |
| **Pull Ups**         | 10 reps                              | Measures upper body pulling strength                 |
| **Plank**            | 3 minutes total                      | Core strength and stability                          |
|                      | • Standard plank: 1.5 minutes        |                                                      |
|                      | • Side plank (each side): 45 seconds |                                                      |
| **Copenhagen Plank** | 3 minutes (both legs)                | Advanced core stability and hip strength             |

#### Additional Physical Attributes

- **Sit Ups**: Core endurance and strength
- **Stamina**: Cardiovascular endurance and recovery
- **Size**: Height and weight measurements
- **Hand Size**: Important for ball handling and catching

### Skill & Mental Metrics

#### Football-Specific Skills

- **Football IQ**: Understanding of game strategy, play recognition, and situational awareness
- **Route Running**: Precision and timing in route execution
- **Hands**: Catching ability and ball security
- **Team Player**: Communication, leadership, and collaboration skills

### Benchmark Scoring System

When implementing performance tracking, consider using a scoring system:

- **Elite**: Exceeds benchmark by 10%+
- **Excellent**: Meets or exceeds benchmark
- **Good**: Within 10% of benchmark
- **Needs Improvement**: Below benchmark by 10%+

### Implementation Notes

1. **Tracking Frequency**: Record metrics at regular intervals (pre-season, mid-season, post-season)
2. **Progress Visualization**: Use line charts to show improvement over time
3. **Comparison Tools**: Allow coaches to compare players against benchmarks and team averages
4. **Goal Setting**: Enable players to set personal goals based on benchmarks
5. **Injury Prevention**: Track hamstring curls and core metrics to identify injury risk

### Data Structure Example

```javascript
{
  playerId: "player-123",
  assessmentDate: "2025-11-15",
  metrics: {
    speed: {
      "40-yard-dash": { value: 4.5, unit: "s", benchmark: 4.6 },
      "3-cone-drill": { value: 6.9, unit: "s", benchmark: 6.8 },
      "shuttle-run": { value: 4.2, unit: "s", benchmark: 4.3 }
    },
    explosiveness: {
      "vertical-jump": { value: 1.15, unit: "m", benchmark: 1.1 },
      "broad-jump": { value: 2.8, unit: "m", benchmark: null }
    },
    strength: {
      "hamstring-curls": { value: 12, unit: "reps", benchmark: 10 },
      "pull-ups": { value: 8, unit: "reps", benchmark: 10 },
      "plank-standard": { value: 95, unit: "s", benchmark: 90 },
      "plank-side-left": { value: 50, unit: "s", benchmark: 45 },
      "plank-side-right": { value: 48, unit: "s", benchmark: 45 },
      "copenhagen-plank-left": { value: 95, unit: "s", benchmark: 90 },
      "copenhagen-plank-right": { value: 92, unit: "s", benchmark: 90 }
    },
    skills: {
      "football-iq": { value: 85, unit: "score", benchmark: null },
      "route-running": { value: 88, unit: "score", benchmark: null },
      "hands": { value: 90, unit: "score", benchmark: null },
      "team-player": { value: 92, unit: "score", benchmark: null }
    }
  }
}
```

---

## Player Profile Card

### Overview

Compact card showing key player info, stats, and quick actions. Used in rosters, lineups, and search results.

### Layout

```
┌───────────────────────────────────┐
│  [Photo]  Marcus Williams    [•] │
│    #12    QB • 6'2" • 185 lbs    │
│           ⭐⭐⭐⭐☆ 4.2           │
│                                   │
│  92  Speed  ████████████████░░    │
│  88  Hands  ██████████████░░░░    │
│  85  Route  █████████████░░░░░    │
│                                   │
│  [View Profile]  [Message]        │
└───────────────────────────────────┘
```

### HTML Structure

```html
<div class="player-card">
  <div class="card-header">
    <div class="player-photo">
      <img src="/players/marcus.jpg" alt="Marcus Williams" />
      <span class="player-status online" aria-label="Online"></span>
    </div>
    <div class="player-identity">
      <div class="player-main-info">
        <span class="player-number">#12</span>
        <h3 class="player-name">Marcus Williams</h3>
      </div>
      <div class="player-meta">
        <span class="player-position">QB</span>
        <span class="meta-separator">•</span>
        <span class="player-height">6'2"</span>
        <span class="meta-separator">•</span>
        <span class="player-weight">185 lbs</span>
      </div>
      <div class="player-rating">
        <div class="rating-stars">
          <svg class="star filled"><!-- star --></svg>
          <svg class="star filled"><!-- star --></svg>
          <svg class="star filled"><!-- star --></svg>
          <svg class="star filled"><!-- star --></svg>
          <svg class="star"><!-- star --></svg>
        </div>
        <span class="rating-value">4.2</span>
      </div>
    </div>
    <button class="card-menu-btn" aria-label="More options">
      <svg><!-- three dots --></svg>
    </button>
  </div>

  <div class="card-body">
    <div class="stat-bar">
      <div class="stat-label">
        <span class="stat-value">92</span>
        <span class="stat-name">Speed</span>
      </div>
      <div class="stat-progress">
        <div
          class="stat-fill"
          style="width: 92%;"
          role="progressbar"
          aria-valuenow="92"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    </div>

    <div class="stat-bar">
      <div class="stat-label">
        <span class="stat-value">88</span>
        <span class="stat-name">Hands</span>
      </div>
      <div class="stat-progress">
        <div
          class="stat-fill"
          style="width: 88%;"
          role="progressbar"
          aria-valuenow="88"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    </div>

    <div class="stat-bar">
      <div class="stat-label">
        <span class="stat-value">85</span>
        <span class="stat-name">Route</span>
      </div>
      <div class="stat-progress">
        <div
          class="stat-fill"
          style="width: 85%;"
          role="progressbar"
          aria-valuenow="85"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    </div>
  </div>

  <div class="card-footer">
    <button class="btn btn-primary btn-sm">View Profile</button>
    <button class="btn btn-secondary btn-sm">Message</button>
  </div>
</div>
```

### CSS

```css
.player-card {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-5);
  max-width: 380px;
  transition: box-shadow 0.2s ease;
}

.player-card:hover {
  box-shadow: var(--shadow-lg);
}

.card-header {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--border-subtle);
}

.player-photo {
  position: relative;
  flex-shrink: 0;
}

.player-photo img {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--border-default);
}

.player-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  border: 2px solid var(--surface-primary);
}

.player-status.online {
  background: var(--color-status-success-500);
}

.player-status.offline {
  background: var(--color-neutral-400);
}

.player-identity {
  flex: 1;
  min-width: 0;
}

.player-main-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.player-number {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-tertiary);
  background: var(--surface-secondary);
  padding: 2px var(--spacing-2);
  border-radius: var(--radius-sm);
}

.player-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-2);
}

.player-position {
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-primary);
}

.meta-separator {
  color: var(--text-tertiary);
}

.player-rating {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  width: 14px;
  height: 14px;
  fill: var(--color-neutral-300);
}

.star.filled {
  fill: var(--color-tertiary-500);
}

.rating-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.card-menu-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  cursor: pointer;
  flex-shrink: 0;
}

.card-menu-btn:hover {
  background: var(--surface-hover);
  color: var(--text-secondary);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.stat-label {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  min-width: 80px;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-name {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.stat-progress {
  flex: 1;
  height: 6px;
  background: var(--color-neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-brand-primary),
    var(--color-brand-primary-hover)
  );
  border-radius: var(--radius-full);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-footer {
  display: flex;
  gap: var(--spacing-2);
}

.btn-sm {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-sm);
  flex: 1;
}
```

---

## Attendance Tracker

### Overview

Quick-entry interface for marking player attendance at training sessions. Optimized for speed and touch input.

### Layout

```
┌────────────────────────────────────────────┐
│ Training Session - Nov 15, 2025            │
│ Speed & Agility                       8/15 │
├────────────────────────────────────────────┤
│                                            │
│ ✓ Marcus Williams     #12  [Present]      │
│ ✓ Devon Brown         #8   [Present]      │
│ ✓ Tyler Johnson       #3   [Present]      │
│ ✗ Jordan Davis        #15  [Absent]       │
│ E Chris Martinez      #55  [Excused]      │
│ L Alex Thompson       #7   [Late]         │
│                                            │
│ [Mark All Present]  [Save Attendance]     │
└────────────────────────────────────────────┘
```

### HTML Structure

```html
<div class="attendance-tracker">
  <div class="tracker-header">
    <div class="session-info">
      <h2 class="session-title">Training Session - Nov 15, 2025</h2>
      <p class="session-subtitle">Speed & Agility</p>
    </div>
    <div class="attendance-summary">
      <span class="summary-count present">8</span>
      <span class="summary-separator">/</span>
      <span class="summary-count total">15</span>
    </div>
  </div>

  <div class="attendance-list">
    <div class="attendance-row present">
      <button class="status-toggle present" aria-label="Mark absent">
        <svg class="status-icon"><!-- checkmark --></svg>
      </button>
      <div class="player-info">
        <span class="player-name">Marcus Williams</span>
        <span class="player-number">#12</span>
      </div>
      <span class="status-badge present">Present</span>
    </div>

    <div class="attendance-row present">
      <button class="status-toggle present" aria-label="Mark absent">
        <svg class="status-icon"><!-- checkmark --></svg>
      </button>
      <div class="player-info">
        <span class="player-name">Devon Brown</span>
        <span class="player-number">#8</span>
      </div>
      <span class="status-badge present">Present</span>
    </div>

    <div class="attendance-row present">
      <button class="status-toggle present" aria-label="Mark absent">
        <svg class="status-icon"><!-- checkmark --></svg>
      </button>
      <div class="player-info">
        <span class="player-name">Tyler Johnson</span>
        <span class="player-number">#3</span>
      </div>
      <span class="status-badge present">Present</span>
    </div>

    <div class="attendance-row absent">
      <button class="status-toggle absent" aria-label="Mark present">
        <svg class="status-icon"><!-- X --></svg>
      </button>
      <div class="player-info">
        <span class="player-name">Jordan Davis</span>
        <span class="player-number">#15</span>
      </div>
      <span class="status-badge absent">Absent</span>
    </div>

    <div class="attendance-row excused">
      <button class="status-toggle excused" aria-label="Mark present">
        <span class="status-icon">E</span>
      </button>
      <div class="player-info">
        <span class="player-name">Chris Martinez</span>
        <span class="player-number">#55</span>
      </div>
      <span class="status-badge excused">Excused</span>
    </div>

    <div class="attendance-row late">
      <button class="status-toggle late" aria-label="Mark present">
        <span class="status-icon">L</span>
      </button>
      <div class="player-info">
        <span class="player-name">Alex Thompson</span>
        <span class="player-number">#7</span>
      </div>
      <span class="status-badge late">Late</span>
    </div>
  </div>

  <div class="tracker-footer">
    <button class="btn btn-secondary">Mark All Present</button>
    <button class="btn btn-primary">Save Attendance</button>
  </div>
</div>
```

### CSS

```css
.attendance-tracker {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  max-width: 600px;
  margin: 0 auto;
}

.tracker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--border-default);
}

.session-info {
  flex: 1;
}

.session-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
}

.session-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.attendance-summary {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-1);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.summary-count.present {
  color: var(--color-brand-primary);
}

.summary-count.total {
  color: var(--text-tertiary);
}

.summary-separator {
  color: var(--text-tertiary);
}

.attendance-list {
  padding: var(--spacing-4);
}

.attendance-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  transition: background 0.2s ease;
}

.attendance-row:hover {
  background: var(--surface-hover);
}

.status-toggle {
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  border-radius: var(--radius-full);
  background: var(--surface-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.status-toggle.present {
  border-color: var(--color-status-success-500);
  background: var(--color-status-success-500);
  color: white;
}

.status-toggle.absent {
  border-color: var(--color-status-error-500);
  background: var(--color-status-error-500);
  color: white;
}

.status-toggle.excused {
  border-color: var(--color-status-warning-500);
  background: var(--color-status-warning-500);
  color: white;
}

.status-toggle.late {
  border-color: var(--color-status-info-500);
  background: var(--color-status-info-500);
  color: white;
}

.status-toggle:active {
  transform: scale(0.95);
}

.status-icon {
  width: 24px;
  height: 24px;
}

.player-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  flex: 1;
  min-width: 0;
}

.player-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-number {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.status-badge {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.status-badge.present {
  background: var(--surface-success-subtle);
  color: var(--color-status-success-700);
}

.status-badge.absent {
  background: var(--surface-error-subtle);
  color: var(--color-status-error-700);
}

.status-badge.excused {
  background: var(--surface-warning-subtle);
  color: var(--color-status-warning-700);
}

.status-badge.late {
  background: var(--surface-info-subtle);
  color: var(--color-status-info-700);
}

.tracker-footer {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  border-top: 1px solid var(--border-default);
}

.tracker-footer .btn {
  flex: 1;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .status-badge {
    display: none; /* Hide text badges on mobile, status color is clear */
  }

  .tracker-footer {
    flex-direction: column;
  }

  .tracker-footer .btn {
    width: 100%;
  }
}
```

### JavaScript

```javascript
class AttendanceTracker {
  constructor() {
    this.attendanceData = {};
    this.init();
  }

  init() {
    document.querySelectorAll(".status-toggle").forEach((btn) => {
      btn.addEventListener("click", this.toggleStatus.bind(this));
    });

    document
      .querySelector(".tracker-footer .btn-secondary")
      .addEventListener("click", this.markAllPresent.bind(this));

    document
      .querySelector(".tracker-footer .btn-primary")
      .addEventListener("click", this.saveAttendance.bind(this));
  }

  toggleStatus(e) {
    const btn = e.currentTarget;
    const row = btn.closest(".attendance-row");

    // Cycle through statuses: absent -> present -> late -> excused -> absent
    let currentStatus = "absent";
    if (btn.classList.contains("present")) currentStatus = "present";
    else if (btn.classList.contains("late")) currentStatus = "late";
    else if (btn.classList.contains("excused")) currentStatus = "excused";

    let nextStatus;
    switch (currentStatus) {
      case "absent":
        nextStatus = "present";
        break;
      case "present":
        nextStatus = "late";
        break;
      case "late":
        nextStatus = "excused";
        break;
      case "excused":
        nextStatus = "absent";
        break;
    }

    this.updateRowStatus(row, nextStatus);
    this.updateSummary();

    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }

  updateRowStatus(row, status) {
    const btn = row.querySelector(".status-toggle");
    const badge = row.querySelector(".status-badge");
    const icon = btn.querySelector(".status-icon");

    // Remove all status classes
    ["present", "absent", "late", "excused"].forEach((s) => {
      row.classList.remove(s);
      btn.classList.remove(s);
      badge.classList.remove(s);
    });

    // Add new status
    row.classList.add(status);
    btn.classList.add(status);
    badge.classList.add(status);

    // Update badge text
    badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);

    // Update icon
    if (status === "present") {
      icon.innerHTML = "<svg><!-- checkmark --></svg>";
      btn.setAttribute("aria-label", "Mark absent");
    } else if (status === "absent") {
      icon.innerHTML = "<svg><!-- X --></svg>";
      btn.setAttribute("aria-label", "Mark present");
    } else if (status === "late") {
      icon.textContent = "L";
      btn.setAttribute("aria-label", "Mark excused");
    } else if (status === "excused") {
      icon.textContent = "E";
      btn.setAttribute("aria-label", "Mark absent");
    }
  }

  markAllPresent() {
    document.querySelectorAll(".attendance-row").forEach((row) => {
      this.updateRowStatus(row, "present");
    });
    this.updateSummary();
  }

  updateSummary() {
    const total = document.querySelectorAll(".attendance-row").length;
    const present = document.querySelectorAll(".attendance-row.present").length;

    document.querySelector(".summary-count.present").textContent = present;
    document.querySelector(".summary-count.total").textContent = total;
  }

  saveAttendance() {
    // Collect attendance data
    const data = [];
    document.querySelectorAll(".attendance-row").forEach((row) => {
      const name = row.querySelector(".player-name").textContent;
      const number = row.querySelector(".player-number").textContent;
      let status = "absent";
      if (row.classList.contains("present")) status = "present";
      else if (row.classList.contains("late")) status = "late";
      else if (row.classList.contains("excused")) status = "excused";

      data.push({ name, number, status });
    });

    console.log("Saving attendance:", data);

    // Show success feedback
    this.showToast("Attendance saved successfully");
  }

  showToast(message) {
    // Simple toast notification
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-status-success-600);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize
new AttendanceTracker();
```

---

## Video Analysis Player

### Overview

Video player optimized for analyzing game footage and drill performance. Features frame-by-frame control, drawing tools, and annotations.

### Layout

```
┌──────────────────────────────────────────────┐
│ [◄◄] [◄] [▶] [▶▶]  00:45 / 03:22  [🎨] [💬] │
├──────────────────────────────────────────────┤
│                                              │
│           [Video Player Area]                │
│                                              │
├──────────────────────────────────────────────┤
│ ●════════════════○═══════════════════        │
│                                              │
│ 📝 Notes:                                    │
│ Good route running, footwork needs work      │
└──────────────────────────────────────────────┘
```

### HTML Structure

```html
<div class="video-analysis-player">
  <div class="player-controls">
    <div class="playback-controls">
      <button class="control-btn" id="rewindBtn" aria-label="Rewind 5 seconds">
        <svg><!-- rewind --></svg>
      </button>
      <button class="control-btn" id="frameBackBtn" aria-label="Previous frame">
        <svg><!-- step back --></svg>
      </button>
      <button class="control-btn primary" id="playPauseBtn" aria-label="Play">
        <svg><!-- play --></svg>
      </button>
      <button class="control-btn" id="frameForwardBtn" aria-label="Next frame">
        <svg><!-- step forward --></svg>
      </button>
      <button
        class="control-btn"
        id="fastForwardBtn"
        aria-label="Fast forward 5 seconds"
      >
        <svg><!-- fast forward --></svg>
      </button>
    </div>

    <div class="time-display">
      <span class="current-time">00:45</span>
      <span class="time-separator">/</span>
      <span class="total-time">03:22</span>
    </div>

    <div class="tool-controls">
      <button
        class="control-btn tool-btn"
        id="drawBtn"
        aria-label="Drawing tools"
      >
        <svg><!-- pen --></svg>
      </button>
      <button
        class="control-btn tool-btn"
        id="commentBtn"
        aria-label="Add comment"
      >
        <svg><!-- message --></svg>
      </button>
      <button class="control-btn" id="speedBtn" aria-label="Playback speed">
        1x
      </button>
      <button class="control-btn" id="fullscreenBtn" aria-label="Fullscreen">
        <svg><!-- expand --></svg>
      </button>
    </div>
  </div>

  <div class="video-container">
    <video id="analysisVideo" class="analysis-video">
      <source src="/videos/drill-analysis.mp4" type="video/mp4" />
      Your browser does not support video playback.
    </video>

    <canvas id="drawingCanvas" class="drawing-canvas"></canvas>

    <div class="annotation-markers">
      <button
        class="annotation-marker"
        style="left: 25%; top: 30%;"
        data-timestamp="45"
      >
        <svg><!-- comment icon --></svg>
      </button>
    </div>
  </div>

  <div class="timeline-container">
    <input
      type="range"
      id="videoTimeline"
      class="timeline-slider"
      min="0"
      max="202"
      value="45"
      aria-label="Video timeline"
    />
    <div class="timeline-markers">
      <div class="marker" style="left: 22%;" data-timestamp="45"></div>
      <div class="marker" style="left: 58%;" data-timestamp="117"></div>
    </div>
  </div>

  <div class="notes-panel">
    <label for="videoNotes" class="notes-label">
      <svg><!-- clipboard --></svg>
      Notes:
    </label>
    <textarea
      id="videoNotes"
      class="notes-textarea"
      placeholder="Add your analysis notes..."
      rows="3"
    >
Good route running, footwork needs work</textarea
    >
  </div>
</div>
```

### CSS

```css
.video-analysis-player {
  background: var(--color-neutral-950);
  border-radius: var(--radius-xl);
  overflow: hidden;
  max-width: 960px;
  margin: 0 auto;
}

.player-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  background: var(--color-neutral-900);
  gap: var(--spacing-4);
}

.playback-controls,
.tool-controls {
  display: flex;
  gap: var(--spacing-2);
}

.control-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-neutral-700);
  border-radius: var(--radius-md);
  color: var(--color-neutral-300);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.control-btn:hover {
  background: var(--color-neutral-800);
  border-color: var(--color-neutral-600);
  color: white;
}

.control-btn.primary {
  background: var(--color-brand-primary);
  border-color: var(--color-brand-primary);
  color: white;
}

.control-btn.primary:hover {
  background: var(--color-brand-primary-hover);
  border-color: var(--color-brand-primary-hover);
}

.control-btn.active {
  background: var(--color-brand-primary);
  border-color: var(--color-brand-primary);
  color: white;
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

.time-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-1);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-300);
  font-variant-numeric: tabular-nums;
}

.time-separator {
  color: var(--color-neutral-600);
}

.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: black;
}

.analysis-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.drawing-canvas.active {
  pointer-events: auto;
  cursor: crosshair;
}

.annotation-markers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.annotation-marker {
  position: absolute;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand-primary);
  border: 2px solid white;
  border-radius: var(--radius-full);
  color: white;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.annotation-marker:hover {
  transform: scale(1.2);
}

.annotation-marker svg {
  width: 16px;
  height: 16px;
}

.timeline-container {
  position: relative;
  padding: var(--spacing-4);
  background: var(--color-neutral-900);
}

.timeline-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-neutral-700);
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--color-brand-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.timeline-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--color-brand-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.timeline-markers {
  position: absolute;
  top: 0;
  left: var(--spacing-4);
  right: var(--spacing-4);
  height: 100%;
  pointer-events: none;
}

.marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: var(--color-status-warning-500);
  border: 2px solid var(--color-neutral-900);
  border-radius: var(--radius-full);
}

.notes-panel {
  padding: var(--spacing-4);
  background: var(--color-neutral-900);
  border-top: 1px solid var(--color-neutral-800);
}

.notes-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-300);
}

.notes-label svg {
  width: 16px;
  height: 16px;
}

.notes-textarea {
  width: 100%;
  padding: var(--spacing-3);
  background: var(--color-neutral-800);
  border: 1px solid var(--color-neutral-700);
  border-radius: var(--radius-md);
  color: var(--color-neutral-200);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-sans);
  resize: vertical;
}

.notes-textarea:focus {
  outline: none;
  border-color: var(--color-brand-primary);
}

.notes-textarea::placeholder {
  color: var(--color-neutral-600);
}

/* Mobile */
@media (max-width: 768px) {
  .player-controls {
    flex-wrap: wrap;
  }

  .time-display {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: var(--spacing-2);
  }

  .control-btn {
    width: 36px;
    height: 36px;
  }
}
```

### JavaScript

```javascript
class VideoAnalysisPlayer {
  constructor() {
    this.video = document.getElementById("analysisVideo");
    this.canvas = document.getElementById("drawingCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.timeline = document.getElementById("videoTimeline");
    this.playSpeed = 1;
    this.isDrawing = false;
    this.drawingEnabled = false;

    this.init();
  }

  init() {
    // Set canvas dimensions
    this.canvas.width = this.video.clientWidth;
    this.canvas.height = this.video.clientHeight;

    // Playback controls
    document
      .getElementById("playPauseBtn")
      .addEventListener("click", this.togglePlayPause.bind(this));
    document
      .getElementById("rewindBtn")
      .addEventListener("click", () => this.skip(-5));
    document
      .getElementById("fastForwardBtn")
      .addEventListener("click", () => this.skip(5));
    document
      .getElementById("frameBackBtn")
      .addEventListener("click", () => this.frameStep(-1));
    document
      .getElementById("frameForwardBtn")
      .addEventListener("click", () => this.frameStep(1));

    // Timeline
    this.timeline.addEventListener("input", this.seekVideo.bind(this));
    this.video.addEventListener("timeupdate", this.updateTimeline.bind(this));
    this.video.addEventListener(
      "loadedmetadata",
      this.setupTimeline.bind(this),
    );

    // Tools
    document
      .getElementById("drawBtn")
      .addEventListener("click", this.toggleDrawing.bind(this));
    document
      .getElementById("speedBtn")
      .addEventListener("click", this.cyclePlaybackSpeed.bind(this));
    document
      .getElementById("fullscreenBtn")
      .addEventListener("click", this.toggleFullscreen.bind(this));

    // Drawing
    this.canvas.addEventListener("mousedown", this.startDrawing.bind(this));
    this.canvas.addEventListener("mousemove", this.draw.bind(this));
    this.canvas.addEventListener("mouseup", this.stopDrawing.bind(this));
    this.canvas.addEventListener("mouseleave", this.stopDrawing.bind(this));

    // Keyboard shortcuts
    document.addEventListener("keydown", this.handleKeyboard.bind(this));
  }

  togglePlayPause() {
    const btn = document.getElementById("playPauseBtn");

    if (this.video.paused) {
      this.video.play();
      btn.innerHTML = "<svg><!-- pause icon --></svg>";
      btn.setAttribute("aria-label", "Pause");
    } else {
      this.video.pause();
      btn.innerHTML = "<svg><!-- play icon --></svg>";
      btn.setAttribute("aria-label", "Play");
    }
  }

  skip(seconds) {
    this.video.currentTime = Math.max(
      0,
      Math.min(this.video.duration, this.video.currentTime + seconds),
    );
  }

  frameStep(direction) {
    this.video.pause();
    // Assume 30 fps
    const frameTime = 1 / 30;
    this.video.currentTime = Math.max(
      0,
      Math.min(
        this.video.duration,
        this.video.currentTime + frameTime * direction,
      ),
    );
  }

  seekVideo(e) {
    const time = parseFloat(e.target.value);
    this.video.currentTime = time;
  }

  updateTimeline() {
    this.timeline.value = this.video.currentTime;

    // Update time display
    document.querySelector(".current-time").textContent = this.formatTime(
      this.video.currentTime,
    );
  }

  setupTimeline() {
    this.timeline.max = Math.floor(this.video.duration);
    document.querySelector(".total-time").textContent = this.formatTime(
      this.video.duration,
    );
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  toggleDrawing() {
    const btn = document.getElementById("drawBtn");
    this.drawingEnabled = !this.drawingEnabled;

    if (this.drawingEnabled) {
      this.canvas.classList.add("active");
      btn.classList.add("active");
      this.video.pause();
    } else {
      this.canvas.classList.remove("active");
      btn.classList.remove("active");
    }
  }

  startDrawing(e) {
    if (!this.drawingEnabled) return;
    this.isDrawing = true;

    const rect = this.canvas.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  draw(e) {
    if (!this.isDrawing || !this.drawingEnabled) return;

    const rect = this.canvas.getBoundingClientRect();
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = "#10c96b";
    this.ctx.lineCap = "round";
    this.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  cyclePlaybackSpeed() {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(this.playSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    this.playSpeed = speeds[nextIndex];
    this.video.playbackRate = this.playSpeed;

    document.getElementById("speedBtn").textContent = `${this.playSpeed}x`;
  }

  toggleFullscreen() {
    const container = document.querySelector(".video-analysis-player");

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  handleKeyboard(e) {
    switch (e.key) {
      case " ":
        e.preventDefault();
        this.togglePlayPause();
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.skip(-5);
        break;
      case "ArrowRight":
        e.preventDefault();
        this.skip(5);
        break;
      case ",":
        e.preventDefault();
        this.frameStep(-1);
        break;
      case ".":
        e.preventDefault();
        this.frameStep(1);
        break;
      case "f":
        e.preventDefault();
        this.toggleFullscreen();
        break;
    }
  }
}

// Initialize
new VideoAnalysisPlayer();
```

---

## Game Stats Tracker (Live Entry)

### Overview

Quick-entry interface for tracking stats during live games. Optimized for one-handed operation and speed.

### Layout

```
┌────────────────────────────────────┐
│ Q2  12:45  Frogs 14 - 10 Eagles   │
├────────────────────────────────────┤
│                                    │
│ [#12 Marcus]  ▼                   │
│                                    │
│ ┌─ Offense ─────────────────────┐ │
│ │ [Catch]   [Drop]              │ │
│ │ [TD]      [2PT]               │ │
│ │ [Flag Pull]                   │ │
│ └───────────────────────────────┘ │
│                                    │
│ Recent:                            │
│ 12:45  #12 Catch +7 yds           │
│ 13:02  #8  TD                     │
│ 13:15  #3  Flag Pull              │
│                                    │
│ [Undo Last]                       │
└────────────────────────────────────┘
```

### HTML Structure

```html
<div class="stats-tracker">
  <div class="game-header">
    <div class="game-meta">
      <span class="quarter">Q2</span>
      <span class="game-clock">12:45</span>
    </div>
    <div class="game-score">
      <span class="team-name home">Frogs</span>
      <span class="score home">14</span>
      <span class="score-separator">-</span>
      <span class="score away">10</span>
      <span class="team-name away">Eagles</span>
    </div>
  </div>

  <div class="player-selector">
    <select id="playerSelect" class="player-select">
      <option value="12" selected>#12 Marcus Williams</option>
      <option value="8">#8 Devon Brown</option>
      <option value="3">#3 Tyler Johnson</option>
      <option value="15">#15 Jordan Davis</option>
      <option value="55">#55 Chris Martinez</option>
    </select>
  </div>

  <div class="stat-buttons-container">
    <div class="stat-category">
      <h3 class="category-title">Offense</h3>
      <div class="stat-buttons">
        <button class="stat-btn" data-stat="catch">
          <svg><!-- hand --></svg>
          <span>Catch</span>
        </button>
        <button class="stat-btn" data-stat="drop">
          <svg><!-- X --></svg>
          <span>Drop</span>
        </button>
        <button class="stat-btn highlight" data-stat="td">
          <svg><!-- trophy --></svg>
          <span>TD</span>
        </button>
        <button class="stat-btn" data-stat="2pt">
          <span class="stat-icon-text">2PT</span>
          <span>2-Point</span>
        </button>
        <button class="stat-btn" data-stat="flag-pull">
          <svg><!-- flag --></svg>
          <span>Flag Pull</span>
        </button>
      </div>
    </div>
  </div>

  <div class="recent-stats">
    <h3 class="recent-title">Recent</h3>
    <div class="stat-entries">
      <div class="stat-entry">
        <span class="entry-time">12:45</span>
        <span class="entry-player">#12</span>
        <span class="entry-stat">Catch</span>
        <span class="entry-detail">+7 yds</span>
        <button class="entry-delete" aria-label="Delete entry">
          <svg><!-- trash --></svg>
        </button>
      </div>

      <div class="stat-entry">
        <span class="entry-time">13:02</span>
        <span class="entry-player">#8</span>
        <span class="entry-stat highlight">TD</span>
        <button class="entry-delete" aria-label="Delete entry">
          <svg><!-- trash --></svg>
        </button>
      </div>

      <div class="stat-entry">
        <span class="entry-time">13:15</span>
        <span class="entry-player">#3</span>
        <span class="entry-stat">Flag Pull</span>
        <button class="entry-delete" aria-label="Delete entry">
          <svg><!-- trash --></svg>
        </button>
      </div>
    </div>
  </div>

  <div class="tracker-actions">
    <button class="btn btn-secondary btn-block" id="undoBtn">
      <svg><!-- undo --></svg>
      Undo Last
    </button>
  </div>
</div>
```

### CSS

```css
.stats-tracker {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 480px;
  margin: 0 auto;
  padding: var(--spacing-5);
}

.game-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding-bottom: var(--spacing-4);
  border-bottom: 2px solid var(--border-default);
  margin-bottom: var(--spacing-5);
}

.game-meta {
  display: flex;
  gap: var(--spacing-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.quarter {
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--color-brand-primary);
  color: white;
  border-radius: var(--radius-sm);
}

.game-clock {
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--surface-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  font-variant-numeric: tabular-nums;
}

.game-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.team-name {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.team-name.home {
  order: -1;
}

.score {
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.score.home {
  color: var(--color-brand-primary);
}

.score-separator {
  color: var(--text-tertiary);
}

.player-selector {
  margin-bottom: var(--spacing-5);
}

.player-select {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--surface-secondary);
  border: 2px solid var(--border-default);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  cursor: pointer;
}

.player-select:focus {
  outline: none;
  border-color: var(--color-brand-primary);
}

.stat-category {
  margin-bottom: var(--spacing-5);
}

.category-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-3);
}

.stat-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-2);
}

.stat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--surface-secondary);
  border: 2px solid var(--border-default);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;
}

.stat-btn:active {
  transform: scale(0.95);
}

.stat-btn:hover {
  border-color: var(--color-brand-primary);
  background: var(--surface-brand-subtle);
}

.stat-btn.highlight {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-primary);
  color: white;
}

.stat-btn.highlight:hover {
  background: var(--color-brand-primary-hover);
  border-color: var(--color-brand-primary-hover);
}

.stat-btn svg {
  width: 28px;
  height: 28px;
}

.stat-icon-text {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.recent-stats {
  margin-bottom: var(--spacing-4);
}

.recent-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-3);
}

.stat-entries {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-height: 200px;
  overflow-y: auto;
}

.stat-entry {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.entry-time {
  font-weight: var(--font-weight-semibold);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  min-width: 45px;
}

.entry-player {
  font-weight: var(--font-weight-bold);
  color: var(--color-brand-primary);
  min-width: 35px;
}

.entry-stat {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  flex: 1;
}

.entry-stat.highlight {
  color: var(--color-brand-primary);
}

.entry-detail {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

.entry-delete {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
}

.entry-delete:hover {
  background: var(--surface-error-subtle);
  color: var(--color-status-error-600);
}

.entry-delete svg {
  width: 14px;
  height: 14px;
}

.tracker-actions {
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-default);
}

.btn-block {
  width: 100%;
}
```

---

## Implementation Notes

### Mobile-First Considerations

All patterns are optimized for mobile use:

- **Touch targets**: Minimum 48×48px (larger for game-time use)
- **One-handed operation**: Critical controls within thumb reach
- **Offline-first**: All patterns work without internet
- **Performance**: Minimal JavaScript, efficient rendering
- **Battery-conscious**: Reduce animations, use dark themes

### Accessibility Requirements

- **ARIA labels**: All icon buttons have descriptive labels
- **Keyboard navigation**: Full keyboard support for all interactions
- **Screen reader support**: Announce stat changes, timer updates
- **High contrast**: All text meets WCAG AA standards
- **Focus indicators**: Clear focus states for all interactive elements

### Data Persistence

All patterns should implement local storage:

- Auto-save draft workouts every 30 seconds
- Cache attendance records offline
- Store video annotations locally
- Sync to server when connection available

### Performance Targets

- **Initial load**: < 2 seconds on 3G
- **Interaction response**: < 100ms
- **Video playback**: 60fps minimum
- **Drawing latency**: < 16ms

---

## Quick Reference: When to Use Each Pattern

| Pattern                 | Use Case                                  | Priority |
| ----------------------- | ----------------------------------------- | -------- |
| **Performance Charts**  | Show progress over time                   | Critical |
| **Performance Metrics** | Track speed, agility, strength benchmarks | Critical |
| **Radar Chart**         | Multi-skill assessment                    | High     |
| **Progress Rings**      | Goal tracking                             | High     |
| **Workout Builder**     | Session planning                          | Critical |
| **Timer**               | During practice                           | Critical |
| **Lineup Builder**      | Game preparation                          | High     |
| **Player Card**         | Roster management                         | Medium   |
| **Attendance**          | Track participation                       | High     |
| **Video Player**        | Film review                               | Medium   |
| **Stats Tracker**       | Live game entry                           | High     |

---

## Next Steps

1. **Implement core patterns first**: Performance charts, timer, attendance
2. **Test with real users**: Coaches and players during actual training
3. **Iterate based on feedback**: Speed is critical during practice
4. **Add advanced features**: Video analysis, formation builder
5. **Optimize for your team**: Customize stat categories, drill libraries

These patterns give you everything you need to build a complete flag football team management app. Focus on the Critical and High priority patterns first, then add Medium priority features based on your team's specific needs.
